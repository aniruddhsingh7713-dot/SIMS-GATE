"""
Intelligent Duplicate Question Detection Service.
Detects both intra-batch duplicates and cross-test database duplicates using
tokenized Jaccard similarity and normalized string matching.
"""
import re
from typing import Dict, Any, List, Optional
from courses.models import TestQuestion


def normalize_text_for_comparison(text: str) -> str:
    """
    Normalizes text by stripping whitespace, punctuation, math wrappers, and lowercasing.
    """
    if not text:
        return ""
    # Strip markdown and LaTeX syntax
    clean = re.sub(r'[\$\_\^\{\}\\\*\#\[\]\(\)]', ' ', text)
    # Strip punctuation
    clean = re.sub(r'[^\w\s]', ' ', clean, flags=re.UNICODE)
    # Consolidate whitespace
    clean = re.sub(r'\s+', ' ', clean).strip().lower()
    return clean


def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """
    Calculates token-level Jaccard similarity between two text strings.
    """
    norm1 = normalize_text_for_comparison(text1)
    norm2 = normalize_text_for_comparison(text2)

    tokens1 = set(norm1.split())
    tokens2 = set(norm2.split())

    if not tokens1 or not tokens2:
        return 0.0

    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))

    if union == 0:
        return 0.0

    return round(intersection / union, 3)


def check_duplicates_in_batch(
    questions: List[Dict[str, Any]],
    check_database: bool = True,
    similarity_threshold: float = 0.82
) -> List[Dict[str, Any]]:
    """
    Scans a batch of extracted questions for internal duplicates and database duplicates.
    Flags matching questions with warning details.
    """
    # 1. Intra-batch duplicate check
    total = len(questions)
    for i in range(total):
        q1 = questions[i]
        q1_text = q1.get("question_text", "")
        if not q1_text:
            continue

        for j in range(i + 1, total):
            q2 = questions[j]
            q2_text = q2.get("question_text", "")
            if not q2_text:
                continue

            sim = calculate_jaccard_similarity(q1_text, q2_text)
            if sim >= similarity_threshold:
                note = f"Potential duplicate of Q{q1.get('question_number', i+1)} (Similarity: {int(sim*100)}%)"
                q2["is_duplicate"] = True
                q2["duplicate_warning"] = note
                q2["is_flagged_for_review"] = True
                curr_notes = q2.get("validation_notes", "")
                q2["validation_notes"] = f"{curr_notes}; {note}".strip("; ")

    # 2. Database duplicate check (against recent questions)
    if check_database:
        recent_db_qs = list(
            TestQuestion.objects.all().order_by("-id")[:300].values("id", "question_text", "test__title")
        )
        for q in questions:
            q_text = q.get("question_text", "")
            if not q_text or q.get("is_duplicate"):
                continue

            for db_q in recent_db_qs:
                sim = calculate_jaccard_similarity(q_text, db_q["question_text"])
                if sim >= similarity_threshold:
                    note = f"Matches existing DB question #{db_q['id']} in '{db_q.get('test__title', 'Test')}' ({int(sim*100)}% match)"
                    q["is_duplicate"] = True
                    q["duplicate_warning"] = note
                    q["is_flagged_for_review"] = True
                    curr_notes = q.get("validation_notes", "")
                    q["validation_notes"] = f"{curr_notes}; {note}".strip("; ")
                    break

    return questions
