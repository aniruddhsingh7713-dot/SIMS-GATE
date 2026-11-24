"""
Intelligent Question Paper Services Package.
"""
from .language_detector import detect_text_language, detect_document_language
from .pdf_extractor import extract_raw_pdf_content, extract_raw_image_content
from .question_parser import parse_question_block, parse_document_text, normalize_answer_key
from .question_classifier import classify_question_type, calculate_question_complexity
from .marks_allocator import allocate_marks_and_sections
from .duplicate_detector import check_duplicates_in_batch, calculate_jaccard_similarity
from .validation_service import validate_single_question, validate_test_paper_distribution
from .test_paper_service import generate_structured_paper_view, publish_test_paper

__all__ = [
    "detect_text_language",
    "detect_document_language",
    "extract_raw_pdf_content",
    "extract_raw_image_content",
    "parse_question_block",
    "parse_document_text",
    "normalize_answer_key",
    "classify_question_type",
    "calculate_question_complexity",
    "allocate_marks_and_sections",
    "check_duplicates_in_batch",
    "calculate_jaccard_similarity",
    "validate_single_question",
    "validate_test_paper_distribution",
    "generate_structured_paper_view",
    "publish_test_paper",
]
