"""UI smoke test: builds, serves site/, opens it in headless Chrome, plays 1...c6, checks the next-move card appears.

Needs: pip install playwright && playwright install chromium   (or pass CHROME=/path/to/chrome)
Run:   python3 tests/smoke.py        Screenshots land in tests/screens/
"""
import asyncio, http.server, os, subprocess, sys, threading, functools
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHESS = os.path.join(ROOT, "node_modules", "chess.js", "chess.js")
OUT = os.path.join(ROOT, "tests", "screens")

def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=os.path.join(ROOT, "site"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def main():
    subprocess.run([sys.executable, os.path.join(ROOT, "build.py")], check=True)
    os.makedirs(OUT, exist_ok=True)
    srv = serve(); url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    async with async_playwright() as p:
        kw = {"executable_path": os.environ["CHROME"]} if os.environ.get("CHROME") else {}
        b = await p.chromium.launch(args=["--no-sandbox"], **kw)
        page = await (await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)).new_page()
        errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
        if os.path.exists(CHESS):  # use the local chess.js so the test works offline
            await page.route("https://cdnjs.cloudflare.com/**", lambda r: r.fulfill(path=CHESS, content_type="text/javascript"))
        await page.goto(url); await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(OUT, "1-chooser.png"))
        await page.click('[data-open="caro"]'); await page.wait_for_timeout(3500)
        await page.evaluate('() => onUserMove({from: "c7", to: "c6"})'); await page.wait_for_timeout(6000)
        await page.screenshot(path=os.path.join(OUT, "2-after-c6.png"))
        coach = await page.inner_text("#coach")
        await b.close()
    ok = ("Move your" in coach or "Take the" in coach or "Castle" in coach) and not errors
    print("ok" if ok else "FAIL", "| engine + coach responded" if ok else f"| coach: {coach[:120]!r} errors: {errors}")
    sys.exit(0 if ok else 1)

asyncio.run(main())
