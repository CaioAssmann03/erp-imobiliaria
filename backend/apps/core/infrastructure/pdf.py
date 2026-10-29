"""HTML to PDF with WeasyPrint, never reaching the network or the file system."""

from typing import Never

from weasyprint import HTML  # pyright: ignore[reportMissingTypeStubs]


def render_pdf(html: str) -> bytes:
    """The PDF bytes of an HTML document; the renderer refuses every URL (images, fonts, stylesheets).

    Whatever the text contains, rendering cannot load anything from outside the document.
    """
    content: bytes = HTML(string=html, url_fetcher=_refuse_every_url).write_pdf()
    return content


def _refuse_every_url(url: str, *args: object, **kwargs: object) -> Never:
    raise ValueError(f"A PDF does not load external resources: {url}")
