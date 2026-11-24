"""
Generates multi-page sample 10-question PDF files (Hindi and English) for end-to-end testing.
"""
import sys
import os
import fitz  # PyMuPDF
from pathlib import Path

def generate_sample_pdfs():
    output_dir = Path("media") / "sample_papers"
    output_dir.mkdir(parents=True, exist_ok=True)

    hindi_pdf_path = output_dir / "hindi_physics_10q.pdf"
    english_pdf_path = output_dir / "english_cs_10q.pdf"

    nirmala_font = "C:/Windows/Fonts/Nirmala.ttc"
    has_nirmala = os.path.exists(nirmala_font)

    # 1. Hindi PDF (2 Pages, 5 Questions per page)
    hindi_doc = fitz.open()

    p1_content = """भौतिक विज्ञान — परीक्षा प्रश्न पत्र (खण्ड 1)

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
"""

    p2_content = """भौतिक विज्ञान — परीक्षा प्रश्न पत्र (खण्ड 2)

प्रश्न 6. [MSQ] निम्न में से कौन सी सदिश (Vector) राशियां हैं?
(A) वेग
(B) संवेग
(C) चाल
(D) बल
उत्तर: A, B, D

प्रश्न 7. एक 5 kg द्रव्यमान की वस्तु पर 20 N का स्थिर बल लगाया जाता है। वस्तु में उत्पन्न त्वरण की गणना कीजिए यदि सतह घर्षणहीन है:
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

प्रश्न 9. यदि एक सरल लोलक (Simple Pendulum) की लम्बाई 4 गुना बढ़ा दी जाए, तो इसका आवर्तकाल ज्ञात कीजिए:
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

    for page_text in [p1_content, p2_content]:
        page = hindi_doc.new_page(width=595, height=842)
        rect = fitz.Rect(40, 40, 555, 800)
        if has_nirmala:
            page.insert_textbox(rect, page_text, fontsize=10, fontname="Nirmala", fontfile=nirmala_font)
        else:
            page.insert_textbox(rect, page_text, fontsize=10)

    hindi_doc.save(str(hindi_pdf_path))
    hindi_doc.close()
    print(f"Generated Hindi PDF: {hindi_pdf_path} ({hindi_pdf_path.stat().st_size} bytes)")

    # 2. English PDF (2 Pages, 5 Questions per page)
    english_doc = fitz.open()

    eng_p1 = """COMPUTER SCIENCE & ENGINEERING — GATE MOCK TEST (Page 1)

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
"""

    eng_p2 = """COMPUTER SCIENCE & ENGINEERING — GATE MOCK TEST (Page 2)

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

    for page_text in [eng_p1, eng_p2]:
        page = english_doc.new_page(width=595, height=842)
        rect = fitz.Rect(40, 40, 555, 800)
        page.insert_textbox(rect, page_text, fontsize=10)

    english_doc.save(str(english_pdf_path))
    english_doc.close()
    print(f"Generated English PDF: {english_pdf_path} ({english_pdf_path.stat().st_size} bytes)")


if __name__ == "__main__":
    generate_sample_pdfs()
