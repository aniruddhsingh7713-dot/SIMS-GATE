"""
Intelligent Language Detection Service for Examination Papers.
Detects language strictly from actual extracted question text and content.
Strict Rule: Never translate questions. Preserve original language content exactly.
"""
import re
from typing import Dict, Any, List

# Unicode Character Ranges
DEVANAGARI_REGEX = re.compile(r'[\u0900-\u097F]')
GUJARATI_REGEX = re.compile(r'[\u0A80-\u0AFF]')
LATIN_REGEX = re.compile(r'[a-zA-Z]')

HINDI_KEYWORDS = [
    "प्रश्न", "उत्तर", "निम्नलिखित", "विकल्प", "कथन", "सही", "गलत", "गणना",
    "मान", "ज्ञात", "कीजिए", "व्याख्या", "अंक", "हल", "सत्य", "असत्य", "सूत्र",
    "प्रतिशत", "अनुपात", "समीकरण", "वर्ग", "मूल", "त्रिभुज", "आयतन", "क्षेत्रफल"
]

GUJARATI_KEYWORDS = [
    "પ્રશ્ન", "જવાબ", "નીચેના", "વિકલ્પ", "સાચું", "ખોટું", "ગણતરી", "કિંમત",
    "શોધો", "સમજૂતી", "ગુણ", "ઉકેલ", "સત્ય", "અસત્ય", "સૂત્ર"
]


def detect_text_language(text: str) -> Dict[str, Any]:
    """
    Detects the primary language of a question or passage based on character distribution
    and script vocabulary.
    Returns:
        {
            "language": "Hindi" | "English" | "Gujarati" | "Bilingual",
            "confidence": float,
            "devanagari_count": int,
            "gujarati_count": int,
            "latin_count": int,
            "is_hindi": bool,
            "is_gujarati": bool,
            "is_english": bool,
        }
    """
    if not text or not text.strip():
        return {
            "language": "English",
            "confidence": 0.5,
            "devanagari_count": 0,
            "gujarati_count": 0,
            "latin_count": 0,
            "is_hindi": False,
            "is_gujarati": False,
            "is_english": True,
        }

    devanagari_chars = len(DEVANAGARI_REGEX.findall(text))
    gujarati_chars = len(GUJARATI_REGEX.findall(text))
    latin_chars = len(LATIN_REGEX.findall(text))

    # Keyword matching bonus
    text_lower = text.lower()
    hindi_kw_hits = sum(1 for kw in HINDI_KEYWORDS if kw in text)
    gujarati_kw_hits = sum(1 for kw in GUJARATI_KEYWORDS if kw in text)

    # Weighted scores
    hindi_score = devanagari_chars + (hindi_kw_hits * 10)
    gujarati_score = gujarati_chars + (gujarati_kw_hits * 10)
    english_score = latin_chars

    total_indic = devanagari_chars + gujarati_chars
    total_score = hindi_score + gujarati_score + english_score

    if total_score == 0:
        return {
            "language": "English",
            "confidence": 0.5,
            "devanagari_count": 0,
            "gujarati_count": 0,
            "latin_count": 0,
            "is_hindi": False,
            "is_gujarati": False,
            "is_english": True,
        }

    # Bilingual / Mixed check
    if devanagari_chars > 20 and latin_chars > 30 and (devanagari_chars / (devanagari_chars + latin_chars) >= 0.25):
        lang = "Hindi" if devanagari_chars >= latin_chars else "Bilingual"
        conf = round(max(hindi_score, english_score) / total_score, 2)
    elif gujarati_score > hindi_score and gujarati_score > english_score:
        lang = "Gujarati"
        conf = round(gujarati_score / total_score, 2)
    elif hindi_score > english_score or devanagari_chars > 10:
        lang = "Hindi"
        conf = round(hindi_score / total_score, 2)
    else:
        lang = "English"
        conf = round(english_score / total_score, 2)

    return {
        "language": lang,
        "confidence": conf,
        "devanagari_count": devanagari_chars,
        "gujarati_count": gujarati_chars,
        "latin_count": latin_chars,
        "is_hindi": lang == "Hindi",
        "is_gujarati": lang == "Gujarati",
        "is_english": lang == "English",
    }


def detect_document_language(questions: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Determines overall test paper language across all extracted questions.
    """
    if not questions:
        return {"language": "English", "breakdown": {}}

    lang_counts = {"Hindi": 0, "English": 0, "Gujarati": 0, "Bilingual": 0}
    for q in questions:
        q_text = q.get("question_text", "")
        # Include options for comprehensive check
        opts_text = " ".join([q.get(f"option_{k}", "") for k in ["a", "b", "c", "d"]])
        combined = f"{q_text} {opts_text}"
        res = detect_text_language(combined)
        lang = res["language"]
        q["language"] = lang
        lang_counts[lang] = lang_counts.get(lang, 0) + 1

    total = len(questions)
    # Determine dominant language
    if lang_counts["Hindi"] > (total * 0.35):
        overall = "Hindi"
    elif lang_counts["Gujarati"] > (total * 0.35):
        overall = "Gujarati"
    elif lang_counts["Hindi"] > 0 and lang_counts["English"] > 0:
        overall = "Bilingual"
    else:
        overall = "English"

    return {
        "language": overall,
        "breakdown": lang_counts,
        "total_questions": total,
    }
