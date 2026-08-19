from pathlib import Path

import fitz


def render(svg: str, target: Path, size: int) -> None:
    document = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    page = document[0]
    scale = size / page.rect.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    pixmap.save(target)


source = Path("public/assets/favicon.svg").read_text(encoding="utf-8")
render(source, Path("public/assets/icon-192.png"), 192)
render(source, Path("public/assets/icon-512.png"), 512)

opening_tag_end = source.index(">") + 1
closing_tag_start = source.rindex("</svg>")
inner = source[opening_tag_end:closing_tag_start]
maskable = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="#f3eee2"/>
<g transform="translate(96 96) scale(2.5)">{inner}</g>
</svg>'''
render(maskable, Path("public/assets/icon-maskable-512.png"), 512)
print("PWA icons generated")
