from pathlib import Path

import fitz


def render(svg: str, target: Path, size: int) -> None:
    document = fitz.open(stream=svg.encode("utf-8"), filetype="svg")
    page = document[0]
    scale = size / page.rect.width
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=True)
    pixmap.save(target)


source = Path("public/assets/favicon.svg").read_text(encoding="utf-8")
opening_tag_end = source.index(">") + 1
closing_tag_start = source.rindex("</svg>")
inner = source[opening_tag_end:closing_tag_start]


def launcher_icon(scale: float, rounded: bool) -> str:
    offset = (512 - 128 * scale) / 2
    radius = ' rx="112"' if rounded else ""
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512"{radius} fill="#f3eee2"/>
<g transform="translate({offset:g} {offset:g}) scale({scale:g})">{inner}</g>
</svg>'''


regular = launcher_icon(3.8, True)
maskable = launcher_icon(3.1, False)
render(regular, Path("public/assets/icon-192.png"), 192)
render(regular, Path("public/assets/icon-512.png"), 512)
render(maskable, Path("public/assets/icon-maskable-512.png"), 512)
print("PWA icons generated")
