"""
Intelligent Marks Distribution and Allocation Service.
Assigns marks strictly according to original PDF marks, complexity heuristics,
and configured test patterns.
Supports 5x1M + 5x2M = 15 Marks balanced distribution for 10-question papers.
"""
from typing import Dict, Any, List, Optional


def allocate_marks_and_sections(
    questions: List[Dict[str, Any]],
    distribution_pattern: str = "balanced",
    target_one_mark: Optional[int] = None,
    target_two_mark: Optional[int] = None,
    apply_gate_sections: bool = True
) -> Dict[str, Any]:
    """
    Distributes 1-mark and 2-mark categories intelligently.
    Prioritizes explicit marks when present.
    Allocates remaining questions based on complexity score.
    Returns:
        {
            "questions": list of questions with assigned marks, negative_marks, section, and order,
            "total_questions": int,
            "total_marks": float,
            "one_mark_count": int,
            "two_mark_count": int,
            "other_mark_count": int,
            "distribution_summary": str
        }
    """
    if not questions:
        return {
            "questions": [],
            "total_questions": 0,
            "total_marks": 0.0,
            "one_mark_count": 0,
            "two_mark_count": 0,
            "other_mark_count": 0,
            "distribution_summary": "0 Questions"
        }

    total_q = len(questions)

    # 1. Identify which questions already have explicit marks from the PDF source
    explicit_indices = set()
    for idx, q in enumerate(questions):
        exp_m = q.get("explicit_marks")
        if exp_m is not None and exp_m > 0:
            q["marks"] = float(exp_m)
            explicit_indices.add(idx)

    # 2. Determine target counts for remaining questions
    unassigned_indices = [i for i in range(total_q) if i not in explicit_indices]
    unassigned_count = len(unassigned_indices)

    if unassigned_count > 0:
        if distribution_pattern == "all_one_mark":
            req_1 = unassigned_count
            req_2 = 0
        elif distribution_pattern == "all_two_mark":
            req_1 = 0
            req_2 = unassigned_count
        elif target_one_mark is not None and target_two_mark is not None:
            # Custom requested numbers
            req_1 = min(unassigned_count, target_one_mark)
            req_2 = min(unassigned_count - req_1, target_two_mark)
        else:
            # Default Balanced Distribution:
            # For 10 questions: 5 × 1 Mark, 5 × 2 Marks = 15 Marks
            req_1 = total_q // 2
            # Adjust if some were already explicitly assigned
            explicit_1 = sum(1 for i in explicit_indices if questions[i].get("marks") == 1.0)
            explicit_2 = sum(1 for i in explicit_indices if questions[i].get("marks") == 2.0)
            rem_1 = max(0, req_1 - explicit_1)
            rem_2 = unassigned_count - rem_1
            req_1 = min(rem_1, unassigned_count)
            req_2 = unassigned_count - req_1

        # Sort unassigned questions by cognitive complexity score ascending
        # Lower complexity -> 1 mark (short, factual, direct)
        # Higher complexity -> 2 marks (multi-step, math formulas, MSQ)
        sorted_unassigned = sorted(
            unassigned_indices,
            key=lambda idx: questions[idx].get("complexity_score", 1.0)
        )

        for i, q_idx in enumerate(sorted_unassigned):
            if i < req_1:
                questions[q_idx]["marks"] = 1.0
            else:
                questions[q_idx]["marks"] = 2.0

    # 3. Assign Negative Marking and Examination Sections
    # Standard GATE Rule:
    # 1 Mark MCQ -> -0.33
    # 2 Mark MCQ -> -0.66
    # MSQ / NAT -> 0.00 (No negative marking)
    one_mark_list = []
    two_mark_list = []
    other_list = []

    for q in questions:
        m = float(q.get("marks", 1.0))
        q_type = q.get("question_type", "MCQ")

        # Negative marks logic
        if q_type == "MCQ":
            neg = 0.66 if m >= 2.0 else 0.33
        elif q_type == "TF":
            neg = 0.33 if m == 1.0 else 0.66
        else:
            # MSQ and NAT have NO negative marking
            neg = 0.0
        q["negative_marks"] = neg

        if m == 1.0:
            q["section"] = "SEC_A"
            one_mark_list.append(q)
        elif m == 2.0:
            q["section"] = "SEC_B"
            two_mark_list.append(q)
        else:
            q["section"] = "CORE"
            other_list.append(q)

    # 4. If structured examination format requested, re-order Section A then Section B
    ordered_questions = []
    if apply_gate_sections:
        cur_num = 1
        for q in one_mark_list:
            q["question_number"] = cur_num
            q["order"] = cur_num
            cur_num += 1
            ordered_questions.append(q)

        for q in two_mark_list:
            q["question_number"] = cur_num
            q["order"] = cur_num
            cur_num += 1
            ordered_questions.append(q)

        for q in other_list:
            q["question_number"] = cur_num
            q["order"] = cur_num
            cur_num += 1
            ordered_questions.append(q)
    else:
        ordered_questions = questions

    # 5. Compute Totals
    total_marks = sum(float(q.get("marks", 0.0)) for q in ordered_questions)
    count_1m = len(one_mark_list)
    count_2m = len(two_mark_list)
    count_other = len(other_list)

    summary_parts = []
    if count_1m:
        summary_parts.append(f"{count_1m} × 1 Mark ({count_1m * 1} M)")
    if count_2m:
        summary_parts.append(f"{count_2m} × 2 Marks ({count_2m * 2} M)")
    if count_other:
        summary_parts.append(f"{count_other} × Other Marks")

    summary_str = " + ".join(summary_parts) + f" = {round(total_marks, 2)} Total Marks"

    return {
        "questions": ordered_questions,
        "total_questions": len(ordered_questions),
        "total_marks": round(total_marks, 2),
        "one_mark_count": count_1m,
        "two_mark_count": count_2m,
        "other_mark_count": count_other,
        "distribution_summary": summary_str
    }
