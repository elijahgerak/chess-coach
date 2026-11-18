"""UI smoke test: builds, serves site/, opens it in headless Chrome and plays like a beginner.

Learn: starts level 1, watches the clip, copies the ghost, plays it solo, checks the stars.
Then level 2 with one wrong move (it should shake and show the ghost). Then Play: 1...c6 and the coach asks for a move.

Needs: pip install playwright && playwright install chromium   (or pass CHROME=/path/to/chrome)
Run:   python3 tests/smoke.py        Screenshots land in tests/screens/
"""
import asyncio, http.server, os, subprocess, sys, threading, functools
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHESS = os.path.join(ROOT, "node_modules", "chess.js", "chess.js")
OUT = os.path.join(ROOT, "tests", "screens")

def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
    handler = functools.partial(Quiet, directory=os.path.join(ROOT, "site"))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

async def wait_turn(page, timeout=30000):
    await page.wait_for_function("() => LS.waiting || LS.between || LS.done", timeout=timeout)

async def play_wanted(page):
    """Play every move the level asks for until the phase ends."""
    while True:
        await wait_turn(page)
        if await page.evaluate("() => LS.between || LS.done"):
            return
        await page.evaluate("() => onLearnMove({from: LS.want.from, to: LS.want.to})")
        await page.wait_for_timeout(300)

async def main():
    subprocess.run([sys.executable, os.path.join(ROOT, "build.py")], check=True)
    os.makedirs(OUT, exist_ok=True)
    srv = serve(); url = f"http://127.0.0.1:{srv.server_address[1]}/index.html"
    fails = []
    async with async_playwright() as p:
        kw = {"executable_path": os.environ["CHROME"]} if os.environ.get("CHROME") else {}
        b = await p.chromium.launch(args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"], **kw)
        page = await (await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)).new_page()
        errors = []; page.on("pageerror", lambda e: errors.append(str(e)))
        if os.path.exists(CHESS):  # use the local chess.js so the test works offline
            await page.route("https://cdnjs.cloudflare.com/**", lambda r: r.fulfill(path=CHESS, content_type="text/javascript"))
        await page.goto(url); await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT, "1-path.png"))

        # Level 1: watch, copy, solo
        await page.click("#learn-go"); await page.wait_for_timeout(2600)
        await page.screenshot(path=os.path.join(OUT, "2-watch.png"))
        await page.wait_for_function("() => LS.between", timeout=30000)
        await page.click('[data-l="follow"]'); await wait_turn(page); await page.wait_for_timeout(900)
        await page.screenshot(path=os.path.join(OUT, "3-copy-ghost.png"))
        await play_wanted(page)
        await page.click('[data-l="solo"]'); await play_wanted(page)
        await page.wait_for_timeout(700)
        await page.screenshot(path=os.path.join(OUT, "4-stars.png"))
        if await page.evaluate("() => S.learn.start.stars") != 3: fails.append("level 1 should give 3 stars")

        # Level 2: one wrong move in Copy
        await page.click('[data-l="next"]'); await page.wait_for_timeout(300)
        await page.click('[data-l="skip"]')
        await page.click('[data-l="follow"]'); await wait_turn(page)
        await page.evaluate("() => onLearnMove({from: 'a7', to: 'a6'})"); await page.wait_for_timeout(250)
        await page.screenshot(path=os.path.join(OUT, "5-wrong.png"))
        if "Not that one" not in await page.inner_text("#learn-panel"): fails.append("wrong move should say 'Not that one'")
        await play_wanted(page)
        await page.click('[data-l="solo"]'); await wait_turn(page)
        await page.wait_for_timeout(10000)  # pause: the piece glows, then the ghost comes back
        await page.screenshot(path=os.path.join(OUT, "6-solo-help.png"))
        if not await page.evaluate("() => LS.helped"): fails.append("solo help didn't appear after a pause")
        await play_wanted(page)
        if await page.evaluate("() => S.learn.protect.stars") != 2: fails.append("one help in solo should give 2 stars")

        # Back to the path
        await page.click("#learn-quit"); await page.wait_for_timeout(400)
        await page.screenshot(path=os.path.join(OUT, "7-path-after.png"))

        # Boss level runs with a color chip
        await page.evaluate("() => startLevel(PATH[PATH.length - 1], false)"); await wait_turn(page)
        await page.screenshot(path=os.path.join(OUT, "8-boss.png"))

        # Play still works
        await page.evaluate("() => quitLevel()")
        await page.click('.tab[data-v="play"]'); await page.wait_for_timeout(3500)
        await page.evaluate('() => onUserMove({from: "c7", to: "c6"})'); await page.wait_for_timeout(6000)
        await page.screenshot(path=os.path.join(OUT, "9-play.png"))
        coach = await page.inner_text("#coach")
        if "Your move" not in coach: fails.append(f"play coach: {coach[:100]!r}")
        await b.close()
    if errors: fails.append(f"errors: {errors}")
    print("ok | learn levels + play work" if not fails else "FAIL | " + " ; ".join(fails))
    sys.exit(0 if not fails else 1)

if __name__ == "__main__":
    asyncio.run(main())
