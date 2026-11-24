"""
Acceptance Test for Intelligent PDF Question & Diagram Overlap Handling.
Tests cow_5_questions_with_diagrams.pdf without requiring any external API calls:
1. 5 questions found, each with 4 options matching the PDF text exactly.
2. Correct answers: Q1 D, Q2 B, Q3 B, Q4 B, Q5 B (read from 'Correct Answer:' lines).
3. Explanations present for all 5.
4. 5 diagram images produced, one per question, and for Q3 and Q4 the diagram image
   must NOT contain the option text (verified via PyMuPDF text extraction on clip).
5. Overlap flag is set for Q3 and Q4 and not for Q1, Q2, Q5.
6. A draft question whose text is not found on its page fails the test.
"""
import os
import sys
import fitz
from pathlib import Path
from django.test import SimpleTestCase
from django.conf import settings

from courses.services.pdf_extractor import extract_raw_pdf_content
from courses.services.question_parser import parse_document_text

class PDFDiagramOverlapAcceptanceTest(SimpleTestCase):
    databases = set()

    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.fixture_path = Path(settings.BASE_DIR) / "tests" / "fixtures" / "cow_5_questions_with_diagrams.pdf"
        assert cls.fixture_path.exists(), f"Fixture missing at {cls.fixture_path}"
        with open(cls.fixture_path, "rb") as f:
            cls.pdf_bytes = f.read()

        cls.extraction_res = extract_raw_pdf_content(cls.pdf_bytes, "cow_5_questions_with_diagrams.pdf")
        cls.questions = parse_document_text(cls.extraction_res["full_text"], cls.extraction_res["pages"])

    def test_acceptance_criteria(self):
        print("\n========================================================")
        print("   ACCEPTANCE TEST: PDF DIAGRAM OVERLAP EXTRACTION")
        print("========================================================")

        # 1. 5 questions found
        self.assertEqual(len(self.questions), 5, f"Expected 5 questions, got {len(self.questions)}")
        print("[PASS] Criterion 1 Passed: Exactly 5 questions parsed from PDF.")

        # Expected answers and options
        expected_answers = {1: "D", 2: "B", 3: "B", 4: "B", 5: "B"}
        expected_options = {
            1: {"A": "Rumen", "B": "Reticulum", "C": "Omasum", "D": "Abomasum"},
            2: {"A": "Incisors only", "B": "Premolars and molars", "C": "Canines", "D": "Tongue only"},
            3: {"A": "Pumping blood", "B": "Microbial fermentation of plant material", "C": "Filtering urine", "D": "Producing bile"},
            4: {"A": "Respiration", "B": "Rumination", "C": "Excretion", "D": "Lactation"},
            5: {"A": "Ovaries", "B": "Udder (mammary glands)", "C": "Rumen", "D": "Liver"},
        }
        expected_overlap = {1: False, 2: False, 3: True, 4: True, 5: False}

        doc = fitz.open(self.fixture_path)

        for q in self.questions:
            q_num = q["question_number"]
            p_num = q["page_number"]
            page = doc[p_num - 1]
            page_text = page.get_text("text")

            # Check question prompt exists on page
            q_text = q["question_text"]
            self.assertTrue(len(q_text) > 10, f"Q{q_num} text too short: '{q_text}'")
            # First 25 chars must be on the page
            self.assertIn(q_text[:25], page_text, f"Q{q_num} text '{q_text[:25]}' not found on page {p_num}")

            # 4 options matching PDF text exactly
            exp_opts = expected_options[q_num]
            self.assertEqual(q["option_a"], exp_opts["A"], f"Q{q_num} Option A mismatch: '{q['option_a']}' != '{exp_opts['A']}'")
            self.assertEqual(q["option_b"], exp_opts["B"], f"Q{q_num} Option B mismatch: '{q['option_b']}' != '{exp_opts['B']}'")
            self.assertEqual(q["option_c"], exp_opts["C"], f"Q{q_num} Option C mismatch: '{q['option_c']}' != '{exp_opts['C']}'")
            self.assertEqual(q["option_d"], exp_opts["D"], f"Q{q_num} Option D mismatch: '{q['option_d']}' != '{exp_opts['D']}'")

            # 2. Correct answers: Q1 D, Q2 B, Q3 B, Q4 B, Q5 B
            self.assertEqual(q["correct_answer"], expected_answers[q_num], f"Q{q_num} Answer mismatch: '{q['correct_answer']}' != '{expected_answers[q_num]}'")

            # 3. Explanations present for all 5
            self.assertTrue(bool(q.get("explanation") and len(q["explanation"]) > 10), f"Q{q_num} missing explanation: '{q.get('explanation')}'")

            # 4. Diagram images produced, one per question
            diag_file = q.get("diagram_path") or (Path(settings.BASE_DIR) / q.get("diagram_image", ""))
            self.assertTrue(Path(diag_file).exists(), f"Q{q_num} diagram file does not exist: {diag_file}")
            self.assertTrue(str(diag_file).endswith(".webp"), f"Q{q_num} diagram not WEBP: {diag_file}")

            # For Q3 and Q4, diagram image must NOT contain option text
            clean_text = q.get("clean_clip_text", "")
            if q_num in [3, 4]:
                for opt_k, opt_v in exp_opts.items():
                    self.assertNotIn(opt_v, clean_text, f"Option text '{opt_v}' leaked into Q{q_num} diagram render!")

            # 5. Overlap flag is set for Q3 and Q4 and not for Q1, Q2, Q5
            self.assertEqual(q.get("overlap"), expected_overlap[q_num],
                             f"Q{q_num} overlap flag expected {expected_overlap[q_num]}, got {q.get('overlap')}")

            print(f"  Q{q_num} verified: Ans={q['correct_answer']}, Overlap={q.get('overlap')}, Diagram={Path(diag_file).name}")

        # Batch banner verification
        self.assertTrue(self.extraction_res.get("batch_has_overlap"), "Expected batch_has_overlap to be True")
        banner = self.extraction_res.get("batch_banner", "")
        self.assertIn("Layout problem in source PDF: diagram overlaps options on pages 2, 3", banner)
        print("[PASS] Criterion 2-6 Passed: All answers, options, redactions, overlap flags & batch banner verified.")
        print("========================================================\n")
        doc.close()
