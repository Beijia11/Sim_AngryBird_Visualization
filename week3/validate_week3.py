"""Check that the week 3 page and all five embedded games actually work.

Serves the repository locally and drives real Chrome. For each iteration it
opens the page, presses that iteration's play button, waits for the game to
report itself ready, and screenshots the running game inside its iframe. It also
checks the iframe auto-sizing, the close button, and that no report/masthead
chrome leaked into the embed.

    /shared/perception/personals/beijia/browsertools/venv/bin/python validate_week3.py

Results and screenshots land in validation/.
"""
from pathlib import Path
import http.server, socketserver, threading, functools, json, sys

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent
OUT = ROOT / "validation"
CHROME = "/opt/google/chrome/chrome"

ITERATIONS = ["ab-v0", "ab-v1", "ab-v2", "tennis-v0", "tennis-v1", "tennis-v2", "tennis-v3"]

# Each embed draws "ready" differently. These probes run inside the iframe.
READY = {
    "ab-v0":     "typeof Matter !== 'undefined' && document.querySelector('canvas') !== null",
    "tennis-v0": "document.querySelector('canvas') !== null",
    "ab-v1":     "typeof Matter !== 'undefined' && document.querySelector('canvas') !== null",
    "ab-v2":     "typeof Matter !== 'undefined' && document.querySelector('canvas') !== null",
    "tennis-v1": "document.querySelector('canvas') !== null",
    # The tennis sprite builds gate on Image.decode() of a ~14 MB atlas. The flag
    # is a top-level `let`, so it lives in the script scope, not on `window` --
    # probe the bare identifier.
    "tennis-v2": "playerSpritesReady === true",
    "tennis-v3": "playerSpritesReady === true",
}


def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler,
                                directory=str(SITE))
    socketserver.TCPServer.allow_reuse_address = True
    # port 0: let the OS pick a free one, so a stray server never blocks a run
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, httpd.server_address[1]


def main():
    OUT.mkdir(exist_ok=True)
    httpd, port = serve()
    results = {"iterations": {}, "page": {}}

    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROME,
                                     args=["--no-sandbox", "--disable-gpu"])
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(f"http://127.0.0.1:{port}/week3/", wait_until="load")

        # the page itself
        results["page"] = {
            "title": page.title(),
            "sections": page.locator("section").count(),
            "iterations_on_page": page.locator("article.iteration").count(),
            "prompt_bands": page.locator("figure.prompt-band").count(),
            "comparison_figures": page.locator(".compare figure").count(),
            "frames_start_blank": page.evaluate(
                "[...document.querySelectorAll('.game-frame')]"
                ".every(f=>f.getAttribute('src')==='about:blank' && f.hidden)"),
        }

        # Every figure is loading="lazy". A full-page screenshot does not trigger
        # them -- it captures by resizing, so nothing ever enters the viewport --
        # so scroll the document the way a reader does, then assert.
        page.evaluate("""async () => {
          for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight/2) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 120));
          }
          window.scrollTo(0, 0);
        }""")
        page.wait_for_function(
            "[...document.images].every(i=>i.complete && i.naturalWidth>0)",
            timeout=30_000)
        page.screenshot(path=str(OUT / "page.png"), full_page=True)
        results["page"]["images_loaded"] = True
        results["page"]["image_count"] = page.evaluate("document.images.length")

        for i, name in enumerate(ITERATIONS):
            article = page.locator("article.iteration").nth(i)
            article.scroll_into_view_if_needed()
            article.locator("[data-start]").click()

            frame_el = article.locator("iframe.game-frame")
            frame_el.wait_for(state="visible")

            # The iframe starts on about:blank, so grabbing content_frame() right
            # after the click can hand back the blank document. Wait for the frame
            # whose URL is the game instead.
            want = f"games/{name}/embed.html"
            frame = None
            for _ in range(120):          # frame attachment lags the src assignment
                frame = next((f for f in page.frames if want in f.url), None)
                if frame:
                    break
                page.wait_for_timeout(500)
            assert frame, f"{name}: game frame never attached"
            frame.wait_for_load_state("load")
            frame.wait_for_function(READY[name], timeout=180_000)
            page.wait_for_timeout(1500)   # let a few animation frames draw

            entry = {
                # nothing from the surrounding report page may be visible
                "masthead_hidden": frame.evaluate(
                    "[...document.querySelectorAll('main>header,main>footer,main>details,"
                    "main>.intro,.bottom-grid,.foot')]"
                    ".every(e=>getComputedStyle(e).display==='none')"),
                "canvas_visible": frame.locator("canvas").is_visible(),
                # the iframe must be sized by the postMessage handler, not left at 720
                "iframe_height": page.evaluate(
                    "el=>Math.round(el.getBoundingClientRect().height)",
                    frame_el.element_handle()),
                "status": article.locator(".status").inner_text(),
            }
            article.screenshot(path=str(OUT / f"{name}.png"))

            article.locator("[data-stop]").click()
            entry["closed_to_blank"] = page.evaluate(
                "el=>el.getAttribute('src')==='about:blank' && el.hidden",
                frame_el.element_handle())
            results["iterations"][name] = entry
            print(f"  {name:<10} {json.dumps(entry)}", flush=True)

        results["page_errors"] = errors
        browser.close()
    httpd.shutdown()

    (OUT / "results.json").write_text(json.dumps(results, indent=1) + "\n")

    ok = (results["page"]["images_loaded"]
          and results["page"]["frames_start_blank"]
          and not errors
          and all(e["masthead_hidden"] and e["canvas_visible"]
                  and e["closed_to_blank"] and e["iframe_height"] > 300
                  for e in results["iterations"].values()))
    print("\nPASS" if ok else "\nFAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
