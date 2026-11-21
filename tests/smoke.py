"""UI smoke test: builds, serves site/, opens it in headless Chrome and plays like a beginner.

Learn (reflex duel): plays a full run. Copies new answers, answers known ones, makes one wrong move
(should cost a heart and show the ghost), lets one timer run out (should say "Too slow"). Then Play: 1...c6.

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

async def wait_state(page, states, timeout=30000):
    await page.wait_for_function(f"() => {states!r}.includes(D.state)", timeout=timeout)
    return await page.evaluate("() => D.state")

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
        await page.screenshot(path=os.path.join(OUT, "1-home.png"))

        # A full run of "White's first moves"
        await page.click(".btn.go")
        shots = {"new": "2-new-ghost.png", "go": "3-your-move.png"}
        wrong_done = slow_done = False
        while True:
            st = await wait_state(page, ["new", "go", "fix", "over"])
            if st == "over": break
            await page.wait_for_timeout(450)
            if st in shots:
                await page.screenshot(path=os.path.join(OUT, shots.pop(st)))
            if st == "go" and not wrong_done:
                wrong_done = True; hearts = await page.evaluate("() => D.hearts"); qlen = await page.evaluate("() => D.queue.length")
                await page.evaluate("() => { const g = new Chess(D.g.fen()); const m = g.moves({verbose: true}).find(m => !D.card.answers.includes(m.san)); onDuelMove({from: m.from, to: m.to}); }")
                await page.wait_for_timeout(300)
                await page.screenshot(path=os.path.join(OUT, "4-wrong.png"))
                if await page.evaluate("() => D.hearts") != hearts - 1: fails.append("a wrong move should cost a heart")
                if await page.evaluate("() => D.queue.length") != qlen + 1: fails.append("a miss should add the position back into the run")
                if "Not that one" not in await page.inner_text("#duel-panel"): fails.append("wrong move should say 'Not that one'")
                continue
            if st == "go" and wrong_done and not slow_done:
                slow_done = True
                await wait_state(page, ["fix"], timeout=12000)
                if "Too slow" not in await page.inner_text("#duel-panel"): fails.append("timeout should say 'Too slow'")
                continue
            await page.evaluate("() => onDuelMove({from: D.want.from, to: D.want.to})")
            await page.wait_for_timeout(200)
            if st == "go" and await page.evaluate("() => D.state") != "done": fails.append("right answer wasn't accepted")
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(OUT, "5-run-cleared.png"))
        if await page.evaluate("() => S.duel.progress.first.clears") != 1: fails.append("a cleared run should count once")
        if await page.evaluate("() => D.round") != 14: fails.append(f"run should be 6 x 2 + 2 misses = 14 rounds, got {await page.evaluate('() => D.round')}")

        # Out of hearts doesn't count
        await page.click('[data-d="start"]')
        while True:
            st = await wait_state(page, ["new", "go", "fix", "over"])
            if st == "over": break
            if st == "go": await page.evaluate("() => { const g = new Chess(D.g.fen()); const m = g.moves({verbose: true}).find(m => !D.card.answers.includes(m.san)); onDuelMove({from: m.from, to: m.to}); }")
            else: await page.evaluate("() => onDuelMove({from: D.want.from, to: D.want.to})")
            await page.wait_for_timeout(150)
        await page.wait_for_timeout(500)
        if await page.evaluate("() => S.duel.progress.first.clears") != 1: fails.append("running out of hearts shouldn't count")
        if "Out of hearts" not in await page.inner_text("#duel-panel"): fails.append("should say 'Out of hearts'")

        # One run at a time; run 2 opens after 3 clears; run 1 stays reachable
        await page.click('[data-d="home"]'); await page.wait_for_timeout(200)
        if "White's first moves" not in await page.inner_text(".run-card"): fails.append("home should show run 1 before 3 clears")
        if await page.locator("[data-step]").count(): fails.append("no arrows while only one run is open")
        await page.evaluate("() => { S.duel.progress.first.clears = 3; D.pick = null; renderLearn(); }"); await page.wait_for_timeout(200)
        if "White protects" not in await page.inner_text(".run-card"): fails.append("home should move on to run 2 after 3 clears")
        await page.click('[data-step="0"]'); await page.wait_for_timeout(150)
        if "White's first moves" not in await page.inner_text(".run-card"): fails.append("'Earlier run' should go back to run 1")
        await page.click('[data-step="1"]'); await page.wait_for_timeout(150)
        # New + review everything: run 2 = its 5 new answers in order, then all 11 known answers mixed
        mix = await page.evaluate("""() => { const old = RUN_CARDS.first; old.forEach(k => cst(k).seen = true);
            const q = buildQueue(RUNS[1]), nw = RUN_CARDS.protect; return { newFirst: q.slice(0, nw.length).every((k, i) => k === nw[i]), review: q.slice(nw.length).sort().join() === [...old, ...nw].sort().join() }; }""")
        if not (mix["newFirst"] and mix["review"]): fails.append(f"run 2 should be new answers then a review of everything, got {mix}")
        await page.evaluate("() => renderLearn()")
        if "review of all 11" not in await page.inner_text(".run-card"): fails.append("run card should say it reviews everything you know")
        await page.screenshot(path=os.path.join(OUT, "6-home-after.png"))

        # Queen's Gambit path: you're White, the first answer is 1.d4
        await page.click('[data-path="qg"]'); await page.wait_for_timeout(200)
        if "Your first moves" not in await page.inner_text(".run-card"): fails.append("QG path should start at 'Your first moves'")
        await page.click(".btn.go")
        for _ in range(4):
            st = await wait_state(page, ["new", "go", "fix"])
            if st == "go":
                await page.wait_for_timeout(1200); await page.screenshot(path=os.path.join(OUT, "7-qg-timer.png"))
            await page.evaluate("() => onDuelMove({from: D.want.from, to: D.want.to})"); await page.wait_for_timeout(200)
        if await page.evaluate("() => D.side") != "w": fails.append("QG should be played as White")
        if await page.evaluate("() => getComputedStyle(document.querySelector('.tabs')).display") != "none": fails.append("tabs should hide during a run")
        await page.click("#duel-quit"); await page.wait_for_timeout(200)
        if await page.evaluate("() => getComputedStyle(document.querySelector('.tabs')).display") == "none": fails.append("tabs should come back after a run")
        await page.click('[data-path="caro"]'); await page.wait_for_timeout(200)

        # Reset history wipes progress
        await page.click("#open-settings"); await page.wait_for_timeout(300)
        await page.click("#reset"); await page.click("#reset"); await page.wait_for_timeout(1500)
        if await page.evaluate("() => Object.values(S.duel.progress).some(p => p.clears) || S.duel.played"): fails.append("reset should erase progress")

        # Play still works
        await page.click('.tab[data-v="play"]'); await page.wait_for_timeout(3500)
        await page.evaluate('() => onUserMove({from: "c7", to: "c6"})'); await page.wait_for_timeout(6000)
        await page.screenshot(path=os.path.join(OUT, "9-play.png"))
        coach = await page.inner_text("#coach")
        if "Your move" not in coach: fails.append(f"play coach: {coach[:100]!r}")
        await b.close()
    if errors: fails.append(f"errors: {errors}")
    print("ok | runs, clears, unlocks + play work" if not fails else "FAIL | " + " ; ".join(fails))
    sys.exit(0 if not fails else 1)

if __name__ == "__main__":
    asyncio.run(main())
