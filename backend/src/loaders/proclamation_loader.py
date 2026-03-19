# -*- coding: utf-8 -*-
"""
Layout-aware loader for the Ethiopian Startup Proclamation PDF (bilingual: Amharic | English).
Splits each page into LEFT (Amharic) and RIGHT (English) columns and returns structured chunks.
"""
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

# PDF location: use PROCLAMATION_PDF_PATH or try data/proclamation.pdf then data/publications/
DEFAULT_PDF_PATH = os.environ.get("PROCLAMATION_PDF_PATH")
_DEFAULT_CANDIDATES = [
    os.path.join("data", "proclamation.pdf"),
    os.path.join("data", "publications", "Ethiopia-Startup-proclamation.pdf"),
]


def _normalize_text(text: str) -> str:
    """Strip and collapse whitespace; preserve newlines for structure."""
    if not text or not isinstance(text, str):
        return ""
    return re.sub(r"[ \t]+", " ", text.strip()).strip()


def _extract_article_id(english_text: str, amharic_text: str) -> Optional[str]:
    """
    Extract article reference from text (e.g. 'Article 5', 'አንቀጽ ፭').
    Returns e.g. 'Article_5' or None.
    """
    # English: "Article 5" or "Article 12"
    m = re.search(r"\bArticle\s+(\d+)\b", english_text, re.IGNORECASE)
    if m:
        return f"Article_{m.group(1)}"
    # Amharic: አንቀጽ followed by Amharic numeral (፩–፲፱) or digit
    amharic_article = re.search(r"አንቀጽ\s*[\(]?(\d+)[\)]?", amharic_text or "")
    if amharic_article:
        return f"Article_{amharic_article.group(1)}"
    return None


def load_proclamation_pdf(
    pdf_path: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Load the bilingual proclamation PDF with layout-aware parsing.

    - Splits each page vertically: LEFT = Amharic, RIGHT = English.
    - One chunk per page to avoid mixing languages; both columns in metadata.
    - Returns list of chunk dicts with: article_id, page, amharic, english, source, content_combined.

    Args:
        pdf_path: Path to PDF. Defaults to DEFAULT_PDF_PATH.

    Returns:
        List of dicts suitable for embedding and storing in vector DB.
    """
    if fitz is None:
        raise ImportError("PyMuPDF is required for proclamation PDF loading. Install with: pip install pymupdf")

    path = pdf_path or DEFAULT_PDF_PATH
    path = Path(path) if path else None
    if not path or not path.exists():
        # Try candidate paths: env path, then data/proclamation.pdf, then data/publications/
        to_try = ([path] if path else []) + _DEFAULT_CANDIDATES
        bases = [Path.cwd(), Path(__file__).resolve().parents[2]]
        path = None
        for p in to_try:
            if not p:
                continue
            p = Path(p)
            if p.is_absolute() and p.exists():
                path = p
                break
            for base in bases:
                candidate = base / p
                if candidate.exists():
                    path = candidate
                    break
            if path is not None:
                break
    if not path or not path.exists():
        raise FileNotFoundError(
            "Proclamation PDF not found. Set PROCLAMATION_PDF_PATH or place PDF at "
            "data/proclamation.pdf or data/publications/Ethiopia-Startup-proclamation.pdf"
        )

    source_name = path.name
    chunks: List[Dict[str, Any]] = []

    with fitz.open(path) as doc:
        for page_num in range(len(doc)):
            page = doc[page_num]
            rect = page.rect
            w, h = rect.width, rect.height
            mid_x = w / 2.0

            # Left half: Amharic (x from 0 to mid_x)
            left_rect = fitz.Rect(0, 0, mid_x, h)
            amharic = page.get_text("text", clip=left_rect)
            amharic = _normalize_text(amharic)

            # Right half: English
            right_rect = fitz.Rect(mid_x, 0, w, h)
            english = page.get_text("text", clip=right_rect)
            english = _normalize_text(english)

            if not amharic and not english:
                continue

            combined = f"{amharic}\n\n{english}".strip() if (amharic and english) else (amharic or english)
            article_id = _extract_article_id(english, amharic)

            chunks.append({
                "article_id": article_id,
                "page": page_num + 1,  # 1-based for display
                "amharic": amharic,
                "english": english,
                "source": source_name,
                "content_combined": combined,
            })

    return chunks
