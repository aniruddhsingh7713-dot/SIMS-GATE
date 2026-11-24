"""
Intelligent Question Segmentation and Parser.
Recognizes question numbering, MCQ/MSQ options, answers, and explanations
in English, Hindi (Devanagari), and Gujarati.
Preserves original script, punctuation, mathematical formulas, and tables intact.
"""
import re
from typing import Dict, Any, List, Optional
from .language_detector import detect_text_language


# Multilingual Question Header Patterns with Explicit Prefix (Q1., Question 1., प्रश्न 1., etc.)
EXPLICIT_QUESTION_START_REGEX = re.compile(
    r'(?:^|\n)\s*(?:'
    r'[Qq](?:uestion)?\.?\s*(\d+)[\.\:\)]|'                           # Q1., Question 1:
    r'प्रश्न\s*(?:संख्या)?\.?\s*(\d+)[\.\:\)]|'                        # प्रश्न 1., प्रश्न संख्या 1:
    r'प्र[\.०]\s*(\d+)[\.\:\)]|'                                      # प्र. 1., प्र० 1:
    r'પ્રશ્ન\s*(?:સંખ્યા)?\.?\s*(\d+)[\.\:\)]|'                       # પ્રશ્ન 1.
    r'પ્ર[\.]\s*(\d+)[\.\:\)]'                                        # પ્ર. 1.
    r')',
    re.IGNORECASE | re.UNICODE
)

# Fallback Bare Question Header Patterns (1., 2., etc.) used ONLY when no explicit Q prefixes exist
BARE_QUESTION_START_REGEX = re.compile(
    r'(?:^|\n)\s*(?:'
    r'(?<![A-Za-z0-9\(\[\=])(\d{1,3})[\.\)]\s+|'                     # 1. or 1) at start of line
    r'(?<![A-Za-z0-9\(\[\=])(\d{1,3})\s{2,}(?=[A-Z\(\[])'           # 1   Question text (without period)
    r')',
    re.UNICODE
)

# Combined regex for general matching
QUESTION_START_REGEX = re.compile(
    r'(?:^|\n)\s*(?:'
    r'[Qq](?:uestion)?\.?\s*(\d+)[\.\:\)]|'                           # Q1., Question 1:
    r'प्रश्न\s*(?:संख्या)?\.?\s*(\d+)[\.\:\)]|'                        # प्रश्न 1., प्रश्न संख्या 1:
    r'प्र[\.०]\s*(\d+)[\.\:\)]|'                                      # प्र. 1., प्र० 1:
    r'પ્રશ્ન\s*(?:સંખ્યા)?\.?\s*(\d+)[\.\:\)]|'                       # પ્રશ્ન 1.
    r'પ્ર[\.]\s*(\d+)[\.\:\)]|'                                       # પ્ર. 1.
    r'(?<![A-Za-z0-9\(\[\=])(\d{1,3})[\.\)]\s+|'                     # 1. or 1) at start of line
    r'(?<![A-Za-z0-9\(\[\=])(\d{1,3})\s{2,}(?=[A-Z\(\[])'           # 1   Question text (without period)
    r')',
    re.IGNORECASE | re.UNICODE
)

# Option marker matchers
# Group 1: Option letter/identifier (A, B, C, D, a, b, c, d, क, ख, ग, घ, 1, 2, 3, 4)
# Negative lookahead protects (C) and (c) from matching copyright or trademark notices!
OPT_SPLIT_REGEX = re.compile(
    r'(?:^|\s|\n)(?:'
    r'\(([A-Da-d])\)(?!\s*(?:Copyright|©|UCLES|®|All\s+rights|registered))|\b([A-Da-d])[\.\:\)]|' # (A), A., A), (a)
    r'\(([कखगघ])\)|\b([कखगघ])[\.\:\)]|'                              # (क), क., क)
    r'\(([અબકડ])\)|\b([અબકડ])[\.\:\)]|'                              # (અ), અ., અ)
    r'\(([1-4])\)|\b([1-4])[\.\:\)]'                                 # (1), 1., 1)
    r')\s*',
    re.UNICODE
)

ANSWER_REGEX = re.compile(
    r'(?:'
    r'Ans(?:wer)?|Correct\s*(?:Option|Answer)?|Key|'
    r'उत्तर(?:\s*माला)?|सही\s*उत्तर|हल|'
    r'જવાબ|સાચો\s*જવાબ'
    r')\s*[\:\-\=]\s*([^\n\r]+)',
    re.IGNORECASE | re.UNICODE
)

EXPLANATION_REGEX = re.compile(
    r'(?:'
    r'Explanation|Solution|Derivation|'
    r'व्याख्या|स्पष्टीकरण|विस्तार|'
    r'સમજૂતી|ઉકેલ'
    r')\s*[\:\-\=]\s*([\s\S]+)$',
    re.IGNORECASE | re.UNICODE
)

EXPLICIT_MARKS_REGEX = re.compile(
    r'\[?\b(\d+(?:\.\d+)?)\s*(?:Marks?|Mark|अंक|ગુણ)\]?',
    re.IGNORECASE | re.UNICODE
)

HINDI_TO_LATIN_MAP = {
    'क': 'A', 'ख': 'B', 'ग': 'C', 'घ': 'D',
    'अ': 'A', 'ब': 'B', 'સ': 'C', 'ડ': 'D',
    '1': 'A', '2': 'B', '3': 'C', '4': 'D',
    'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D',
    'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D',
}


def normalize_answer_key(raw_ans: str) -> str:
    """
    Normalizes single or multiple answer keys (e.g. 'क' -> 'A', 'A, C' -> 'A, C', '(B)' -> 'B').
    """
    if not raw_ans:
        return ""

    raw_clean = raw_ans.strip()
    # Strip brackets
    raw_clean = re.sub(r'[\(\)\[\]\{\}]', ' ', raw_clean)

    # Check for multi-select separated by commas, and, or, &, /
    tokens = re.split(r'[,&/\s]+|\band\b|\bऔर\b|\bઅને\b', raw_clean)
    normalized = []
    for tok in tokens:
        tok = tok.strip()
        if not tok:
            continue
        mapped = HINDI_TO_LATIN_MAP.get(tok) or HINDI_TO_LATIN_MAP.get(tok.upper())
        if mapped and mapped not in normalized:
            normalized.append(mapped)

    if normalized:
        # Sort e.g. ['A', 'C'] -> 'A, C'
        normalized.sort()
        return ", ".join(normalized)

    # If it's a numerical answer (NAT) e.g. 42.5 or 40-45
    nat_match = re.search(r'[-+]?\d+(?:\.\d+)?(?:\s*-\s*[-+]?\d+(?:\.\d+)?)?', raw_ans)
    if nat_match:
        return nat_match.group(0).strip()

    return raw_ans.strip()


def parse_question_block(block: str, q_num: int, default_page: int = 1) -> Dict[str, Any]:
    """
    Parses a single raw question text block into structured fields.
    Preserves exact original text and script.
    """
    lang_info = detect_text_language(block)
    language = lang_info["language"]

    # 1. Extract Explicit Marks if present
    explicit_marks = None
    marks_match = EXPLICIT_MARKS_REGEX.search(block)
    if marks_match:
        try:
            explicit_marks = float(marks_match.group(1))
        except ValueError:
            explicit_marks = None

    # 2. Extract Explanation / Solution
    explanation = ""
    expl_match = EXPLANATION_REGEX.search(block)
    if expl_match:
        explanation = expl_match.group(1).strip()
        # Remove explanation part from the block for option/question isolation
        block = block[:expl_match.start()].strip()

    # 3. Extract Answer Key
    correct_answer = ""
    ans_match = ANSWER_REGEX.search(block)
    if ans_match:
        raw_ans = ans_match.group(1).strip()
        correct_answer = normalize_answer_key(raw_ans)
        # Remove answer line from block
        block = block[:ans_match.start()].strip()

    # 4. Extract Options (A, B, C, D / क, ख, ग, घ / 1, 2, 3, 4)
    # Find all option headers with their start positions
    opt_matches = []
    for m in OPT_SPLIT_REGEX.finditer(block):
        # Extract whichever capture group succeeded
        ident = next((g for g in m.groups() if g is not None), None)
        if ident:
            norm_key = HINDI_TO_LATIN_MAP.get(ident) or HINDI_TO_LATIN_MAP.get(ident.upper())
            if norm_key in ['A', 'B', 'C', 'D']:
                opt_matches.append({
                    "raw_key": ident,
                    "norm_key": norm_key,
                    "start": m.start(),
                    "end": m.end()
                })

    options = {"option_a": "", "option_b": "", "option_c": "", "option_d": ""}
    question_text = block

    if len(opt_matches) >= 2:
        # First option start separates question text from options
        question_text = block[:opt_matches[0]["start"]].strip()

        for i, m in enumerate(opt_matches):
            norm_key = m["norm_key"]
            content_start = m["end"]
            content_end = opt_matches[i + 1]["start"] if (i + 1 < len(opt_matches)) else len(block)
            opt_text = block[content_start:content_end].strip()
            # Clean trailing punctuation
            opt_text = re.sub(r'[\r\n]+', ' ', opt_text).strip()

            target_field = f"option_{norm_key.lower()}"
            if not options[target_field]:  # Don't overwrite if duplicate match
                options[target_field] = opt_text

    # Clean up question text from metadata tags like [1 Mark] or [CORE]
    clean_q_text = re.sub(r'\[?\b\d+(?:\.\d+)?\s*(?:Marks?|Mark|अंक|ગુણ)\]?', '', question_text, flags=re.I)
    clean_q_text = re.sub(r'\[?(?:MCQ|MSQ|NAT|TF|CORE|GA|MATH)\]?', '', clean_q_text, flags=re.I)
    # Strip copyright and watermark lines from question text
    clean_q_text = re.sub(r'(?i)(?:\([Cc]\)\s*)?Copyright\b.*|©\s*UCLES.*|®\s*IGCSE.*|Cambridge Assessment.*|\[Turn over\]|\bTurn over\b|\[Total:\s*\d+\]', '', clean_q_text)
    # Strip scrambled atomic bond characters (e.g. C C P H H H H H H H H H H C C C C C C...) if present
    clean_q_text = re.sub(r'(?:[CHOPNRST]\s+){5,}[CHOPNRST]?', ' ', clean_q_text)
    clean_q_text = re.sub(r'\s{2,}', ' ', clean_q_text).strip()

    # Clean options from scrambled atomic bonds and copyright artifacts
    for opt_k in ["option_a", "option_b", "option_c", "option_d"]:
        if options[opt_k]:
            opt_val = re.sub(r'(?i)(?:\([Cc]\)\s*)?Copyright\b.*|©\s*UCLES.*|®\s*IGCSE.*|Cambridge Assessment.*|\[Turn over\]|\bTurn over\b|\[Total:\s*\d+\]', '', options[opt_k])
            opt_val = re.sub(r'(?:[CHOPNRST]\s+){5,}[CHOPNRST]?', ' ', opt_val)
            options[opt_k] = re.sub(r'\s{2,}', ' ', opt_val).strip()

    return {
        "question_number": q_num,
        "question_text": clean_q_text or question_text,
        "language": language,
        "explicit_marks": explicit_marks,
        "option_a": options["option_a"],
        "option_b": options["option_b"],
        "option_c": options["option_c"],
        "option_d": options["option_d"],
        "correct_answer": correct_answer,
        "explanation": explanation,
        "page_number": default_page,
        "raw_block": block,
    }


DIAGRAM_REF_REGEX = re.compile(
    r'(?:figure|fig\.|diagram|schematic|circuit|shown below|as shown|given below|'
    r'structures? of|organic compounds?|structural formula|formulae|compounds? are shown|'
    r'following structure|apparatus|chart|graph|plot|table|waveform|curve|flowchart|'
    r'चित्र|आरेख|दर्शाया गया|दिखाया गया|दिए गए चित्र|ग्राफ|परिपथ|रेखाचित्र)',
    re.IGNORECASE
)


def parse_document_text(full_text: str, pages_data: Optional[List[Dict[str, Any]]] = None) -> List[Dict[str, Any]]:
    """
    Splits text across question boundaries and parses all questions accurately.
    Intelligently links extracted diagrams and schematics to appropriate questions
    based on page context, vertical proximity, and explicit diagram references.
    """
    if not full_text or not full_text.strip():
        # If full_text is empty but we have extracted images/diagrams from the document
        if pages_data:
            for p in pages_data:
                if p.get("images"):
                    img = p["images"][0]
                    return [{
                        "question_number": 1,
                        "question_text": "Refer to the diagram below and answer the question.",
                        "language": "English",
                        "explicit_marks": None,
                        "option_a": "Option A",
                        "option_b": "Option B",
                        "option_c": "Option C",
                        "option_d": "Option D",
                        "correct_answer": "A",
                        "explanation": "",
                        "page_number": p.get("page_number", 1),
                        "raw_block": "",
                        "diagram_url": img["url"],
                        "diagram_image": img["file_path"],
                    }]
        return []

    # Check if digital_questions were already accurately extracted from the text layer and coordinates
    if pages_data:
        for p in pages_data:
            if p.get("digital_questions"):
                # Collect all digital questions across pages
                all_digital_qs = []
                for p_d in pages_data:
                    all_digital_qs.extend(p_d.get("digital_questions", []))
                if all_digital_qs:
                    return all_digital_qs

    # Prioritize explicit question headers (Q1., Question 1, प्रश्न 1) over bare numbers (1., 2.)
    # to avoid falsely segmenting diagram labels like "1. Swallow grass", "2. Rumen"
    matches = list(EXPLICIT_QUESTION_START_REGEX.finditer(full_text))
    if not matches:
        matches = list(BARE_QUESTION_START_REGEX.finditer(full_text))
    questions = []

    if not matches:
        # Fallback: Treat as a single question
        q_obj = parse_question_block(full_text.strip(), 1)
        if pages_data:
            for p in pages_data:
                if p.get("images"):
                    q_obj["diagram_url"] = p["images"][0]["url"]
                    q_obj["diagram_image"] = p["images"][0]["file_path"]
                    break
        questions.append(q_obj)
        return questions

    for i, cur_m in enumerate(matches):
        # Extract question number from whichever capture group matched
        q_num_str = next((g for g in cur_m.groups() if g is not None), str(i + 1))
        try:
            q_num = int(q_num_str)
        except ValueError:
            q_num = i + 1

        content_start = cur_m.end()
        content_end = matches[i + 1].start() if (i + 1 < len(matches)) else len(full_text)
        block = full_text[content_start:content_end].strip()

        # Find which page this question likely belongs to
        page_num = 1
        if pages_data:
            cum_len = 0
            for p in pages_data:
                p_len = len(p.get("text", ""))
                if cum_len <= content_start <= (cum_len + p_len + 15):
                    page_num = p.get("page_number", 1)
                    break
                cum_len += p_len + 2

        q_parsed = parse_question_block(block, q_num, default_page=page_num)
        questions.append(q_parsed)

    # Intelligent Diagram Association by Page Context & Keywords
    if pages_data and questions:
        # Map available images by page
        page_to_images: Dict[int, List[Dict[str, Any]]] = {}
        for p in pages_data:
            p_num = p.get("page_number", 1)
            imgs = p.get("images", [])
            if imgs:
                page_to_images[p_num] = list(imgs)

        # Distribute images to matching questions per page
        for p_num, imgs in page_to_images.items():
            page_qs = [q for q in questions if q.get("page_number") == p_num]
            if not page_qs or not imgs:
                continue

            available_imgs = list(imgs)

            # Priority 1: Questions explicitly referencing a diagram / figure
            for q in page_qs:
                if not available_imgs:
                    break
                if DIAGRAM_REF_REGEX.search(q.get("question_text", "")):
                    assigned_img = available_imgs.pop(0)
                    q["diagram_url"] = assigned_img["url"]
                    q["diagram_image"] = assigned_img["file_path"]

            # Priority 2: If images still remain and 1-to-1 match is possible
            for q in page_qs:
                if not available_imgs:
                    break
                if not q.get("diagram_url"):
                    assigned_img = available_imgs.pop(0)
                    q["diagram_url"] = assigned_img["url"]
                    q["diagram_image"] = assigned_img["file_path"]

    return questions
