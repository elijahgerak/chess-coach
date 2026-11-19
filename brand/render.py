"""Renders the logo: a white pawn pressing a green barbell, studio-lit on black.

A tiny ray marcher (signed distance fields + numpy), so the logo is real 3D with soft shadows,
ambient occlusion and a rim light. Run: python3 brand/render.py [size]   (default 1024; ~2 min)
Writes brand/logo-1024.png, brand/sq-180.png, sq-192.png, sq-512.png and brand/logo.svg.
"""
import base64, io, os, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
F = np.float32

# ---------- scene ----------
def length(v): return np.sqrt((v * v).sum(-1))
def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)

def sphere(p, c, r): return length(p - np.array(c, F)) - r
def capsule(p, a, b, r):
    a, b = np.array(a, F), np.array(b, F); pa, ba = p - a, b - a
    h = np.clip((pa @ ba) / (ba @ ba), 0, 1)
    return length(pa - h[:, None] * ba) - r
def round_cyl(q_r, q_h, r, h, rr):
    """Cylinder along the axis: q_r = distance from the axis, q_h = position along it (centred)."""
    dx, dy = q_r - r + rr, np.abs(q_h) - h / 2 + rr
    return np.minimum(np.maximum(dx, dy), 0) + length(np.stack([np.maximum(dx, 0), np.maximum(dy, 0)], -1)) - rr
def cone(q_r, y, y0, r0, y1, r1):
    """Solid between heights y0..y1 whose radius goes r0 -> r1 (exact for a capped cone)."""
    k1 = np.array([r1, y1 - y0], F); k2 = np.array([r1 - r0, y1 - y0], F)
    qy = y - (y0 + y1) / 2; hh = (y1 - y0) / 2
    q = np.stack([q_r, qy], -1)
    ca = np.stack([q_r - np.minimum(q_r, np.where(qy < 0, r0, r1)), np.abs(qy) - hh], -1)
    kk = np.array([r1 - r0, 2 * hh], F)
    t = np.clip(((np.array([r1, hh], F) - q) @ kk) / (kk @ kk), 0, 1)
    cb = q - np.array([r1, hh], F) + t[:, None] * kk
    s = np.where((cb[:, 0] < 0) & (ca[:, 1] < 0), -1, 1)
    return s * np.sqrt(np.minimum((ca * ca).sum(-1), (cb * cb).sum(-1)))

BAR_Y, HAND_X = 1.9, 0.6
def pawn(p):
    r = length(p[:, [0, 2]]); y = p[:, 1]
    d = round_cyl(r, y - 0.09, 0.66, 0.18, 0.07)                     # base
    d = smin(d, round_cyl(r, y - 0.24, 0.52, 0.14, 0.05), 0.06)       # step
    d = smin(d, cone(r, y, 0.2, 0.44, 1.0, 0.19), 0.1)                # body
    d = smin(d, round_cyl(r, y - 1.02, 0.38, 0.09, 0.04), 0.05)       # collar
    d = smin(d, sphere(p, (0, 1.37, 0), 0.32), 0.04)                  # head
    for s in (-1, 1):                                                 # arms, raised
        sh, el, ha = (s * 0.32, 1.04, 0), (s * 0.7, 1.36, 0.06), (s * HAND_X, BAR_Y - 0.03, 0)
        d = smin(d, capsule(p, sh, el, 0.085), 0.07)
        d = smin(d, capsule(p, el, ha, 0.08), 0.06)
        d = smin(d, sphere(p, ha, 0.105), 0.04)
    return d

def bar(p):
    return capsule(p, (-1.32, BAR_Y, 0), (1.32, BAR_Y, 0), 0.036)

def plates(p):
    r = length(p[:, [1, 2]] - np.array([BAR_Y, 0], F)); x = np.abs(p[:, 0])
    d = round_cyl(r, x - 1.0, 0.44, 0.13, 0.035)                      # big plate
    d = np.minimum(d, round_cyl(r, x - 1.135, 0.32, 0.1, 0.03))       # small plate
    return d

def collars(p):
    r = length(p[:, [1, 2]] - np.array([BAR_Y, 0], F)); x = np.abs(p[:, 0])
    return round_cyl(r, x - 0.885, 0.075, 0.07, 0.015)

PARTS = [pawn, bar, plates, collars]
def scene(p):
    return np.minimum.reduce([f(p) for f in PARTS])
def material(p):
    return np.argmin(np.stack([f(p) for f in PARTS]), 0)

# ---------- camera ----------
def normalize(v): return v / np.linalg.norm(v, axis=-1, keepdims=True)
def rays(n):
    eye, at = np.array([2.2, 2.0, 6.8], F), np.array([0, 1.06, 0], F)
    fw = normalize(at - eye); rt = normalize(np.cross(fw, [0, 1, 0])); up = np.cross(rt, fw)
    fov = np.tan(np.radians(26.5) / 2)
    j, i = np.mgrid[0:n, 0:n].astype(F)
    u = ((i + 0.5) / n * 2 - 1) * fov; v = (1 - (j + 0.5) / n * 2) * fov
    d = normalize(fw + u[..., None] * rt + v[..., None] * up).reshape(-1, 3).astype(F)
    return np.broadcast_to(eye, d.shape).astype(F), d

def march(o, d, tmax=14.0, steps=160):
    t = np.zeros(len(o), F); hit = np.zeros(len(o), bool); live = np.arange(len(o))
    for _ in range(steps):
        if not len(live): break
        h = scene(o[live] + t[live, None] * d[live])
        t[live] += h * 0.9
        done = h < 1e-3 * (1 + t[live]); gone = t[live] > tmax
        hit[live[done]] = True
        live = live[~(done | gone)]
    return t, hit

def soft_shadow(p, l, k=10.0, steps=56):
    res = np.ones(len(p), F); t = np.full(len(p), 0.02, F); live = np.arange(len(p))
    for _ in range(steps):
        if not len(live): break
        h = scene(p[live] + t[live, None] * l)
        res[live] = np.minimum(res[live], np.clip(k * h / t[live], 0, 1))
        t[live] += np.clip(h, 0.01, 0.25)
        live = live[(h > 1e-4) & (t[live] < 6)]
    res = np.clip(res, 0, 1)
    return res * res * (3 - 2 * res)

def occlusion(p, n):
    occ = np.zeros(len(p), F)
    for i in range(1, 6):
        h = 0.03 + 0.07 * i
        occ += (h - scene(p + n * h)) * (0.75 ** i)
    return np.clip(1 - 2.2 * occ, 0, 1)

def normals(p):
    e = F(6e-4); out = np.empty_like(p)
    for k in range(3):
        dv = np.zeros(3, F); dv[k] = e
        out[:, k] = scene(p + dv) - scene(p - dv)
    return normalize(out)

KEY = normalize(np.array([-0.55, 0.85, 0.55], F))
FILL = normalize(np.array([0.9, 0.25, 0.35], F))
RIM = normalize(np.array([0.35, 0.55, -1.0], F))
ALBEDO = np.array([[0.88, 0.88, 0.86],    # pawn: white clay
                   [0.75, 0.76, 0.78],    # bar: steel
                   [0.02, 0.3, 0.14],     # plates: app green
                   [0.6, 0.62, 0.64]], F) # collars
GLOSS = np.array([60, 160, 70, 120], F)
SPEC = np.array([0.25, 0.9, 0.45, 0.7], F)
RIMK = np.array([1.5, 0.8, 0.55, 0.8], F)
METAL = np.array([0, 1, 0, 1], F)

def env(r):
    """A soft studio: big light overhead, dark below."""
    y = r[:, 1]
    return (0.04 + 0.9 * np.clip(y, 0, 1) ** 2)[:, None] * np.array([1, 1, 1], F)

def shade(p, d):
    n = normals(p); m = material(p)
    sh = soft_shadow(p + n * 0.003, KEY); ao = occlusion(p, n)
    alb = ALBEDO[m]; ndl = np.clip((n * KEY).sum(-1), 0, 1)
    v = -d; hv = normalize(KEY + v)
    spec = np.clip((n * hv).sum(-1), 0, 1) ** GLOSS[m] * SPEC[m] * sh
    fill = np.clip((n * FILL).sum(-1), 0, 1) * 0.28
    sky = (0.5 + 0.5 * n[:, 1]) * 0.22
    fres = (1 - np.clip((n * v).sum(-1), 0, 1)) ** 4
    rim = fres * np.clip((n * RIM).sum(-1) + 0.35, 0, 1) * RIMK[m]
    diffuse = alb * ((ndl * sh * 1.25 + fill + sky * ao) * (1 - METAL[m] * 0.75))[:, None]
    refl = env(d - 2 * (d * n).sum(-1, keepdims=True) * n) * (alb * METAL[m][:, None] + (1 - METAL[m][:, None]) * 0.04) * ao[:, None]
    tint = np.where((m == 2)[:, None], alb * 2.2 + 0.25, 1.0)  # green plates get a green rim, not a white one
    col = diffuse * ao[:, None] ** 0.5 + refl + spec[:, None] + rim[:, None] * tint
    return col

def floor(o, d, hitmask):
    """Ground: pure black except a soft contact shadow pool and a faint reflection of light."""
    col = np.zeros((len(o), 3), F)
    ok = (d[:, 1] < 0) & ~hitmask
    t = -o[ok, 1] / d[ok, 1]; p = o[ok] + t[:, None] * d[ok]
    r = length(p[:, [0, 2]])
    glow = np.exp(-(r / 1.15) ** 2) * 0.075
    sh = soft_shadow(p + np.array([0, 0.002, 0], F), KEY, k=6)
    ao = occlusion(p, np.broadcast_to(np.array([0, 1, 0], F), p.shape).copy())
    col[ok] = (glow * (0.25 + 0.75 * sh) * ao)[:, None] * np.array([1, 1, 1], F)
    return col

def tonemap(c):
    a, b, cc, dd, e = 2.51, 0.03, 2.43, 0.59, 0.14
    c = np.clip((c * (a * c + b)) / (c * (cc * c + dd) + e), 0, 1)
    return c ** (1 / 2.2)

def render(n):
    o, d = rays(n)
    t, hit = march(o, d)
    img = floor(o, d, hit)
    if hit.any():
        img[hit] = shade(o[hit] + t[hit, None] * d[hit], d[hit])
    return (tonemap(img).reshape(n, n, 3) * 255 + 0.5).astype(np.uint8)

if __name__ == "__main__":
    size = int(sys.argv[1]) if len(sys.argv) > 1 else 1024
    ss = 2 if size <= 1024 else 1
    big = Image.fromarray(render(size * ss))
    img = big.resize((size, size), Image.LANCZOS)
    img.save(os.path.join(HERE, "logo-1024.png" if size == 1024 else f"logo-{size}.png"))
    if size == 1024:
        for s in (180, 192, 512):
            img.resize((s, s), Image.LANCZOS).save(os.path.join(HERE, f"sq-{s}.png"))
        buf = io.BytesIO(); img.resize((128, 128), Image.LANCZOS).save(buf, "PNG", optimize=True)
        b64 = base64.b64encode(buf.getvalue()).decode()
        open(os.path.join(HERE, "logo.svg"), "w").write(
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">'
            '<defs><clipPath id="c"><rect width="512" height="512" rx="114"/></clipPath></defs>'
            f'<image clip-path="url(#c)" width="512" height="512" href="data:image/png;base64,{b64}"/>'
            '<rect x="6" y="6" width="500" height="500" rx="108" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width="12"/></svg>')
    print("rendered", size)
