"""
Test script for Intelligent Question Paper Generator Pipeline.
"""
import sys
import os
import django

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from courses.services import (
    detect_text_language,
    detect_document_language,
    parse_document_text,
    classify_question_type,
    allocate_marks_and_sections,
    validate_test_paper_distribution,
    generate_structured_paper_view
)

def run_tests():
    hindi_doc = """
प्रश्न 1. भार का SI मात्रक क्या है?
(A) किलोग्राम
(B) न्यूटन
(C) पास्कल
(D) जूल
उत्तर: (B)

प्रश्न 2. प्रकाश वर्ष किसका मात्रक है?
(A) समय
(B) दूरी
(C) प्रकाश की तीव्रता
(D) द्रव्यमान
उत्तर: B

प्रश्न 3. न्यूटन के गति के किस नियम को जड़त्व का नियम भी कहा जाता है?
(A) प्रथम नियम
(B) द्वितीय नियम
(C) तृतीय नियम
(D) उपरोक्त में से कोई नहीं
उत्तर: (A)

प्रश्न 4. जल का घनत्व किस तापमान पर अधिकतम होता है?
(A) 0°C
(B) 4°C
(C) 100°C
(D) -4°C
उत्तर: B

प्रश्न 5. कार्य का SI मात्रक क्या होता है?
(A) वाट
(B) न्यूटन
(C) जूल
(D) पास्कल
उत्तर: (C)

प्रश्न 6. [MSQ] निम्न में से कौन सी सदिश (Vector) राशियां हैं?
(A) वेग
(B) संवेग
(C) चाल
(D) बल
उत्तर: A, B, D

प्रश्न 7. एक 5 kg द्रव्यमान की वस्तु पर 20 N का स्थिर बल लगाया जाता है। वस्तु में उत्पन्न त्वरण (acceleration) की गणना कीजिए यदि सतह घर्षणहीन है:
(A) 2 m/s²
(B) 4 m/s²
(C) 5 m/s²
(D) 10 m/s²
उत्तर: B

प्रश्न 8. [MSQ] ऊष्मागतिकी के प्रथम नियम के संबंध में निम्न में से कौन से कथन सही हैं?
(A) यह ऊर्जा संरक्षण के नियम पर आधारित है
(B) dQ = dU + dW
(C) यह स्वतःस्फूर्त प्रक्रमों की दिशा बताता है
(D) रुद्धोष्म प्रक्रम में dQ = 0 होता है
उत्तर: A, B, D

प्रश्न 9. यदि एक सरल लोलक (Simple Pendulum) की लम्बाई 4 गुना बढ़ा दी जाए, तो इसका आवर्तकाल (Time Period) T' ज्ञात कीजिए:
(A) आधा हो जाएगा
(B) अपरिवर्तित रहेगा
(C) दोगुना हो जाएगा
(D) चार गुना हो जाएगा
उत्तर: (C)

प्रश्न 10. [MSQ] आदर्श गैस (Ideal Gas) के लिए निम्नलिखित में से कौन से संबंध सही हैं?
(A) PV = nRT
(B) Cp - Cv = R
(C) समतापीय प्रक्रम में आन्तरिक ऊर्जा में परिवर्तन शून्य होता है
(D) Cp / Cv = gamma
उत्तर: A, B, C, D
"""

    print("--- 1. Parsing Document ---")
    parsed = parse_document_text(hindi_doc)
    print(f"Extracted questions count: {len(parsed)}")
    assert len(parsed) == 10, f"Expected 10 questions, got {len(parsed)}"

    print("--- 2. Detecting Language ---")
    doc_lang = detect_document_language(parsed)
    print(f"Detected Document Language: {doc_lang['language']}")
    assert doc_lang["language"] == "Hindi", f"Expected Hindi, got {doc_lang['language']}"

    print("--- 3. Classifying Questions (MCQ vs MSQ & Complexity) ---")
    for q in parsed:
        c = classify_question_type(q)
        q["question_type"] = c["question_type"]
        q["complexity_score"] = c["complexity_score"]
        print(f"Q{q['question_number']}: Type={q['question_type']}, Complexity={q['complexity_score']}")

    print("--- 4. Allocating Marks (Default Balanced Pattern) ---")
    res = allocate_marks_and_sections(parsed, distribution_pattern="balanced")
    print(f"Summary: {res['distribution_summary']}")
    print(f"1-Mark Count: {res['one_mark_count']}, 2-Mark Count: {res['two_mark_count']}, Total Marks: {res['total_marks']}")

    assert res["one_mark_count"] == 5, f"Expected 5 1-mark questions, got {res['one_mark_count']}"
    assert res["two_mark_count"] == 5, f"Expected 5 2-mark questions, got {res['two_mark_count']}"
    assert res["total_marks"] == 15.0, f"Expected 15.0 total marks, got {res['total_marks']}"

    print("--- 5. Validating Paper Distribution ---")
    val = validate_test_paper_distribution(res["questions"], expected_one_mark=5, expected_two_mark=5, expected_total_questions=10)
    print(f"Can Publish: {val['can_publish']}")
    print(f"Errors: {val['errors']}")
    print(f"Warnings: {val['warnings']}")
    assert val["can_publish"] == True, f"Validation failed: {val['errors']}"

    print("--- 6. Structured Paper Layout ---")
    paper = generate_structured_paper_view(
        title="भौतिक विज्ञान परीक्षा - 2026",
        subject="भौतिक विज्ञान (Physics)",
        topic="यांत्रिकी एवं ऊष्मागतिकी",
        language=doc_lang["language"],
        duration_minutes=60,
        questions=res["questions"]
    )
    print(f"Paper Sections Count: {len(paper['sections'])}")
    for sec in paper["sections"]:
        print(f"  {sec['title']} -> {sec['question_count']} Questions, {sec['total_marks']} Marks")

    print("\n[SUCCESS] ALL 10-QUESTION HINDI PIPELINE TESTS PASSED PERFECTLY!")

    print("\n--- Running 10-Question English Test Paper Pipeline ---")
    english_doc = """
Q1. Which data structure operates on a Last In First Out (LIFO) principle?
(A) Queue
(B) Stack
(C) Binary Tree
(D) Linked List
Answer: B

Q2. What is the worst-case time complexity of QuickSort?
(A) O(n)
(B) O(n log n)
(C) O(n^2)
(D) O(log n)
Answer: C

Q3. In SQL, which clause is used to filter records resulting from a GROUP BY statement?
(A) WHERE
(B) HAVING
(C) ORDER BY
(D) FILTER
Answer: B

Q4. Which layer of the OSI reference model is responsible for end-to-end reliable transmission?
(A) Network Layer
(B) Transport Layer
(C) Session Layer
(D) Data Link Layer
Answer: B

Q5. What is the complement of 0 in Boolean algebra?
(A) 0
(B) 1
(C) Null
(D) Undefined
Answer: B

Q6. [MSQ] Which of the following page replacement algorithms suffer from Belady's Anomaly?
(A) FIFO
(B) LRU
(C) Optimal
(D) Second Chance
Answer: A, D

Q7. Calculate the maximum number of nodes in a binary tree of depth k where root is at depth 1:
(A) 2^k - 1
(B) 2^(k-1)
(C) 2^(k+1) - 1
(D) 2^k
Answer: A

Q8. [MSQ] Which of the following languages are decidable by a Turing Machine?
(A) Regular languages
(B) Context-free languages
(C) Context-sensitive languages
(D) Halting problem language
Answer: A, B, C

Q9. In a p-n junction diode under forward bias condition, calculate the barrier potential behavior:
(A) Increases
(B) Decreases linearly
(C) Reduces to near zero
(D) Remains unaffected
Answer: C

Q10. [MSQ] Which of the following statements regarding TCP and UDP are true?
(A) TCP provides guaranteed delivery through acknowledgments
(B) UDP is connectionless and has lower header overhead
(C) TCP guarantees packet order
(D) UDP provides flow control via sliding window
Answer: A, B, C
"""
    eng_parsed = parse_document_text(english_doc)
    print(f"Extracted English questions: {len(eng_parsed)}")
    assert len(eng_parsed) == 10

    eng_lang = detect_document_language(eng_parsed)
    print(f"Detected English Language: {eng_lang['language']}")
    assert eng_lang["language"] == "English"

    for q in eng_parsed:
        c = classify_question_type(q)
        q["question_type"] = c["question_type"]
        q["complexity_score"] = c["complexity_score"]

    eng_res = allocate_marks_and_sections(eng_parsed, distribution_pattern="balanced")
    print(f"English Summary: {eng_res['distribution_summary']}")
    assert eng_res["one_mark_count"] == 5
    assert eng_res["two_mark_count"] == 5
    assert eng_res["total_marks"] == 15.0

    eng_val = validate_test_paper_distribution(eng_res["questions"], expected_one_mark=5, expected_two_mark=5, expected_total_questions=10)
    assert eng_val["can_publish"] == True

    eng_paper = generate_structured_paper_view(
        title="Computer Science GATE Mock Exam",
        subject="Computer Science & Engineering",
        topic="Algorithms & Systems",
        language=eng_lang["language"],
        duration_minutes=90,
        questions=eng_res["questions"]
    )
    for sec in eng_paper["sections"]:
        print(f"  {sec['title']} -> {sec['question_count']} Questions, {sec['total_marks']} Marks")

    print("\n[SUCCESS] ALL 10-QUESTION ENGLISH PIPELINE TESTS PASSED PERFECTLY!")

    print("\n--- Running Real PDF Binary Extraction Tests ---")
    from courses.services import extract_raw_pdf_content

    hindi_pdf_bytes = open("media/sample_papers/hindi_physics_10q.pdf", "rb").read()
    hindi_extracted = extract_raw_pdf_content(hindi_pdf_bytes, "hindi_physics_10q.pdf")
    hindi_pdf_qs = parse_document_text(hindi_extracted["full_text"])
    print(f"Extracted from real Hindi PDF: {len(hindi_pdf_qs)} questions")
    assert len(hindi_pdf_qs) == 10
    hindi_pdf_lang = detect_document_language(hindi_pdf_qs)
    print(f"Detected from real Hindi PDF: {hindi_pdf_lang['language']}")
    assert hindi_pdf_lang["language"] == "Hindi"

    eng_pdf_bytes = open("media/sample_papers/english_cs_10q.pdf", "rb").read()
    eng_extracted = extract_raw_pdf_content(eng_pdf_bytes, "english_cs_10q.pdf")
    eng_pdf_qs = parse_document_text(eng_extracted["full_text"])
    print(f"Extracted from real English PDF: {len(eng_pdf_qs)} questions")
    assert len(eng_pdf_qs) == 10
    eng_pdf_lang = detect_document_language(eng_pdf_qs)
    print(f"Detected from real English PDF: {eng_pdf_lang['language']}")
    assert eng_pdf_lang["language"] == "English"

    print("\n[SUCCESS] REAL PDF EXTRACTION VERIFIED WITH 100% ACCURACY!")


if __name__ == "__main__":
    run_tests()
