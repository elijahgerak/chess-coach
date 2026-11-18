#!/usr/bin/env python3
"""Build the coach.

  dist/  one self-contained page + engine files, for the Claude artifact version
  site/  the same page plus home-screen install bits, for GitHub Pages

Usage: python3 build.py
"""
import json, os, shutil, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC, BRAND, ENGINE = (os.path.join(ROOT, d) for d in ("src", "brand", "vendor/stockfish"))
DIST, SITE = os.path.join(ROOT, "dist"), os.path.join(ROOT, "site")
JS_ORDER = ["pieces.js", "data.js", "core.js", "board.js", "ui.js"]
ENGINE_FILES = ["stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm", "stockfish-19-asm.js"]


def read(*p):
    with open(os.path.join(*p), encoding="utf-8") as f:
        return f.read()


def sized(svg, n, uid):
    # Resize the logo and give its clipPath a unique id so several copies can share a page
    return svg.replace('width="512" height="512"', f'width="{n}" height="{n}"', 1).replace('id="c"', f'id="{uid}"').replace("url(#c)", f"url(#{uid})")


def page():
    logo = read(BRAND, "logo.svg")
    js = "\n".join(read(SRC, f) for f in JS_ORDER).replace("/*LOGOSVG*/", logo)
    js += '\nif (window.Chess) boot(); else document.body.insertAdjacentHTML("afterbegin", "<p style=\\"padding:24px\\">Couldn\'t load the chess rules library. Check your connection and reload.</p>");\n'
    return (read(SRC, "index.template.html")
            .replace("/*CSS*/", read(SRC, "style.css"))
            .replace("/*JS*/", js)
            .replace("/*LOGO30*/", sized(logo, 30, "c1"))
            .replace("/*FAVICON*/", "data:image/svg+xml," + urllib.parse.quote(logo)))


def fresh(d):
    shutil.rmtree(d, ignore_errors=True)
    os.makedirs(d)


def main():
    html = page()
    fresh(DIST)
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8") as f:
        f.write(html)
    for f in ENGINE_FILES:
        shutil.copy(os.path.join(ENGINE, f), DIST)
    shutil.copy(os.path.join(BRAND, "sq-180.png"), os.path.join(DIST, "apple-touch-icon.png"))

    fresh(SITE)
    for f in ENGINE_FILES:
        shutil.copy(os.path.join(ENGINE, f), SITE)
    shutil.copy(os.path.join(BRAND, "sq-180.png"), os.path.join(SITE, "apple-touch-icon.png"))
    shutil.copy(os.path.join(BRAND, "sq-192.png"), os.path.join(SITE, "icon-192.png"))
    shutil.copy(os.path.join(BRAND, "sq-512.png"), os.path.join(SITE, "icon-512.png"))
    with open(os.path.join(SITE, "manifest.webmanifest"), "w") as f:
        json.dump({"name": "Caro-Kann Coach", "short_name": "Chess Coach", "start_url": "./", "display": "standalone",
                   "background_color": "#f3f4f1", "theme_color": "#f3f4f1",
                   "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable"},
                             {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]}, f, indent=1)
    site_html = html.replace('<link rel="apple-touch-icon" href="apple-touch-icon.png">', "\n".join([
        '<link rel="apple-touch-icon" href="apple-touch-icon.png">',
        '<link rel="manifest" href="manifest.webmanifest">',
        '<meta name="apple-mobile-web-app-capable" content="yes">',
        '<meta name="mobile-web-app-capable" content="yes">',
        '<meta name="apple-mobile-web-app-title" content="Chess Coach">',
        '<meta name="apple-mobile-web-app-status-bar-style" content="default">']), 1)
    site_html = site_html.replace('<meta name="theme-color" content="#2c5a4b">',
                                  '<meta name="theme-color" content="#f3f4f1" media="(prefers-color-scheme: light)">\n'
                                  '<meta name="theme-color" content="#0d0f0e" media="(prefers-color-scheme: dark)">', 1)
    with open(os.path.join(SITE, "index.html"), "w", encoding="utf-8") as f:
        f.write(site_html)
    open(os.path.join(SITE, ".nojekyll"), "w").close()
    print(f"Built dist/ and site/ ({len(html) // 1024} KB page)")


if __name__ == "__main__":
    main()
