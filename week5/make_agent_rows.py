"""Write the per-video rows of the two agent sections into index.html.

    python3 make_agent_rows.py

Reads agent_runs.json (written by build_week5.py) and replaces whatever sits between
the ONESHOT ROWS and LOOP ROWS markers in index.html. Everything else on the page is
hand-written and is left alone.
"""
from pathlib import Path
import html
import json
import re

ROOT = Path(__file__).resolve().parent
NAMES = {"claude": "Claude", "astra": "Astra"}


def row(video: str, cells: list[tuple[str, str, str]], meta: str) -> str:
    """cells: (clip path, bold label, the rest of the label as HTML)."""
    body = "".join(
        f'<div class="cell{" key" if i else ""}">'
        f'<video src="{src}" muted loop playsinline autoplay preload="metadata"></video>'
        f'<p class="label"><b>{name}</b>{rest}</p></div>'
        for i, (src, name, rest) in enumerate(cells))
    return (f'  <div class="row">\n'
            f'    <div class="row-head">\n'
            f'      <span class="id">{html.escape(video)}</span>\n'
            f'      <span class="row-controls">\n'
            f'        <button data-action="toggle">Pause</button>\n'
            f'        <button data-action="restart">Restart</button>\n'
            f'      </span>\n'
            f'      <span class="meta">{meta}</span>\n'
            f'    </div>\n'
            f'    <div class="trio">{body}</div>\n'
            f'  </div>\n')


def main() -> None:
    runs = json.loads((ROOT / "agent_runs.json").read_text())
    one, loop = [], []
    for r in runs:
        v = r["video"]
        base = f"clips/agent/{v}"

        cells = [(f"{base}/ref.mp4", "Video", "")]
        for short in ("claude", "astra"):
            s = r["simple"][short]
            cells.append((f"{base}/simple_{short}.mp4", NAMES[short],
                          f' · {s["minutes"]} min · <a href="{s["play"]}">play</a>'
                          f' · <a href="{s["code"]}">world.js</a>'))
        one.append(row(v, cells, " · ".join(
            f'{NAMES[s]} {r["simple"][s]["minutes"]} min' for s in ("claude", "astra"))
            + " to write · 0 JS errors"))

        cells = [(f"{base}/ref.mp4", "Video", "")]
        for short in ("claude", "astra"):
            l = r["loop"][short]
            cells.append((f"{base}/loop_{short}.mp4", NAMES[short],
                          f' · best round {l["best_round"]} of {l["rounds"]} · overall {l["overall"]:.2f}'
                          f' · <a href="{l["play"]}">play</a> · <a href="{l["report"]}">rounds</a>'))
        loop.append(row(v, cells, " · ".join(
            f'{NAMES[s]} {r["loop"][s]["minutes"]:.0f} min, {r["loop"][s]["rounds"]} rounds'
            for s in ("claude", "astra"))))

    page = (ROOT / "index.html").read_text()
    for tag, rows in (("ONESHOT", one), ("LOOP", loop)):
        page, n = re.subn(rf"<!-- {tag} ROWS START -->.*?<!-- {tag} ROWS END -->",
                          lambda m: (f"<!-- {tag} ROWS START -->\n" + "".join(rows)
                                     + f"<!-- {tag} ROWS END -->"),
                          page, flags=re.S)
        if n != 1:
            raise SystemExit(f"{tag} markers not found exactly once in index.html")
    (ROOT / "index.html").write_text(page)
    print(f"{len(one)} one-shot rows, {len(loop)} loop rows written")


if __name__ == "__main__":
    main()
