"""
Intelligent Question Classification Service.
Accurately categorizes question type (MCQ, MSQ, NAT, TF, Descriptive)
and computes objective complexity scores based on technical depth, mathematics,
and cognitive steps.
"""
import re
from typing import Dict, Any

# Multi-select indicator patterns
MSQ_KEYWORDS = [
    r'\bMSQ\b',
    r'multiple\s*select',
    r'one\s*or\s*more\s*(?:than\s*one)?\s*option',
    r'select\s*all\s*(?:correct|that\s*apply)',
    r'which\s*of\s*the\s*following\s*(?:are|statements?\s*are)',
    r'एक\s*या\s*अधिक\s*(?:विकल्प)?\s*सही',
    r'निम्न(?:लिखित)?\s*में\s*से\s*कौन\s*(?:से|सा)\s*कथन\s*सही',
    r'સાચા\s*વિધાનો\s*પસંદ\s*કરો',
]

# Calculation & derivation keywords (Higher complexity indicators)
CALCULATION_KEYWORDS = [
    r'\bcalculate\b', r'\bevaluate\b', r'\bderive\b', r'\bcompute\b',
    r'\bdetermine\s*the\s*value\b', r'\bfind\s*the\s*value\b',
    r'गणना\s*कीजिए', r'मान\s*ज्ञात\s*(?:कीजिए|करें)', r'हल\s*कीजिए',
    r'ગણતરી\s*કરો', r'કિંમત\s*શોધો'
]

# Mathematical and scientific symbol patterns
MATH_SYMBOLS_REGEX = re.compile(
    r'(\\[a-zA-Z]+|[\∫\∑\∏\√\∞\≈\≠\≤\≥\±\×\÷\^\_\{\}\$\=\+\-\*\/\%])',
    re.UNICODE
)


def classify_question_type(question: Dict[str, Any]) -> Dict[str, Any]:
    """
    Determines whether a question is MCQ, MSQ, NAT, TF, or DESCRIPTIVE.
    Returns:
        {
            "question_type": "MCQ" | "MSQ" | "NAT" | "TF" | "DESCRIPTIVE",
            "is_msq": bool,
            "is_mcq": bool,
            "is_nat": bool,
            "classification_reason": str,
            "complexity_score": float
        }
    """
    raw_block = question.get("raw_block", "") or ""
    q_text = question.get("question_text", "") or ""
    ans = question.get("correct_answer", "").strip()

    opt_a = question.get("option_a", "").strip()
    opt_b = question.get("option_b", "").strip()
    opt_c = question.get("option_c", "").strip()
    opt_d = question.get("option_d", "").strip()

    has_options = bool(opt_a or opt_b or opt_c or opt_d)

    # 1. Check for MSQ
    # Check if answer contains multiple keys (e.g. "A, C", "A, B, D")
    ans_keys = [k.strip() for k in ans.split(",") if k.strip() in ['A', 'B', 'C', 'D']]
    is_multi_key_ans = len(ans_keys) > 1

    msq_keyword_matched = any(re.search(pat, f"{raw_block} {q_text}", re.I | re.U) for pat in MSQ_KEYWORDS)

    if is_multi_key_ans or (has_options and msq_keyword_matched):
        q_type = "MSQ"
        reason = f"Multiple answer keys ({ans}) or explicit multi-select phrasing detected."

    # 2. Check for True / False
    elif has_options and not opt_c and not opt_d and (
        ("true" in opt_a.lower() and "false" in opt_b.lower()) or
        ("सत्य" in opt_a and "असत्य" in opt_b) or
        ("साચું" in opt_a and "ખોટું" in opt_b)
    ):
        q_type = "TF"
        reason = "Binary True/False options."

    # 3. Check for MCQ
    elif has_options:
        q_type = "MCQ"
        reason = "Standard 4-option single correct choice."

    # 4. Check for NAT (Numerical Answer Type)
    elif not has_options and (
        re.match(r'^[-+]?\d+(?:\.\d+)?(?:\s*-\s*[-+]?\d+(?:\.\d+)?)?$', ans) or
        re.search(r'(?:numerical|integer|round\s*off|संख्यात्मक)', f"{raw_block} {q_text}", re.I | re.U)
    ):
        q_type = "NAT"
        reason = "Numerical answer without options."

    # 5. Descriptive / Subjective
    else:
        q_type = "DESCRIPTIVE"
        reason = "Open-ended formulation without standard objective options."

    # Compute Complexity Score
    complexity = calculate_question_complexity(question, q_type)

    return {
        "question_type": q_type,
        "is_msq": q_type == "MSQ",
        "is_mcq": q_type == "MCQ",
        "is_nat": q_type == "NAT",
        "classification_reason": reason,
        "complexity_score": complexity
    }


def calculate_question_complexity(question: Dict[str, Any], q_type: str) -> float:
    """
    Computes an objective complexity score (1.00 to 5.00) based on:
    - Text length and syntactic clauses
    - Math/LaTeX equations and formulas
    - Multi-step calculation keywords
    - Diagram/schematic presence
    - Question type (MSQ questions require validating 4 independent statements)
    """
    q_text = question.get("question_text", "")
    score = 1.0

    # 1. Length & clause factor
    word_count = len(q_text.split())
    if word_count > 60:
        score += 0.8
    elif word_count > 30:
        score += 0.4

    # 2. Math & formula density
    math_matches = MATH_SYMBOLS_REGEX.findall(q_text)
    if len(math_matches) > 6:
        score += 1.0
    elif len(math_matches) > 2:
        score += 0.5

    # 3. Calculation / derivation requirement
    has_calc = any(re.search(kw, q_text, re.I | re.U) for kw in CALCULATION_KEYWORDS)
    if has_calc:
        score += 0.8

    # 4. Attached diagram or schematic
    if question.get("diagram_url") or question.get("diagram_image"):
        score += 0.7

    # 5. MSQ Cognitive Load
    if q_type == "MSQ":
        score += 1.0
    elif q_type == "NAT":
        score += 0.6

    return round(min(5.0, max(1.0, score)), 2)
