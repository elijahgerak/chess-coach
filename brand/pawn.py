PAWN='M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z'
INK='#16231c'; CREAM='#f3f0e4'; GOLD='#e9c46a'; SHADOW='#1b3a2f'
def logo(rounded=True):
    s=8.6; cx,cy=22.5,22.0
    tx,ty=256-cx*s, 268-cy*s
    T=lambda dx=0,dy=0: f'translate({tx+dx:.1f},{ty+dy:.1f}) scale({s})'
    sq=''.join(f'<rect x="{x*128}" y="{y*128}" width="128" height="128" fill="{"#3a6b5a" if (x+y)%2==0 else "#2c5a4b"}"/>' for x in range(4) for y in range(4))
    armL='M17.6 21.8C13.2 20.6 11.2 15 12.4 6.6'
    armR='M27.4 21.8C31.8 20.6 33.8 15 32.6 6.6'
    arms=lambda col,w: f'<g fill="none" stroke="{col}" stroke-width="{w}" stroke-linecap="round"><path d="{armL}"/><path d="{armR}"/></g>'
    bar=(f'<rect x="4.5" y="5.4" width="36" height="2.4" rx="1.2" fill="{INK}"/>'
         + ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="1.1" fill="{GOLD}" stroke="{INK}" stroke-width="1.1"/>' for (x,y,w,h) in [(3.2,0.6,3.4,12),(6.9,2.4,2.4,8.4),(38.4,0.6,3.4,12),(35.7,2.4,2.4,8.4)]))
    hands=''.join(f'<circle cx="{x}" cy="6.6" r="2.1" fill="{CREAM}" stroke="{INK}" stroke-width="1.1"/>' for x in (12.4,32.6))
    sweat=f'<path d="M30.2 11.6c.9 1.3 1.4 2.2 1.4 2.9a1.4 1.4 0 0 1-2.8 0c0-.7.5-1.6 1.4-2.9z" fill="#bfe3f2" stroke="{INK}" stroke-width=".7"/>'
    figure=lambda: (f'<g transform="{T()}">' + arms(INK,4.6) + arms(CREAM,2.2)
        + f'<path d="{PAWN}" fill="{CREAM}" stroke="{INK}" stroke-width="1.4" stroke-linejoin="round"/>' + bar + hands + sweat + '</g>')
    shadow=(f'<g transform="{T(12,12)}" fill="{SHADOW}" stroke="{SHADOW}"><g fill="none" stroke-width="4.6" stroke-linecap="round"><path d="{armL}"/><path d="{armR}"/></g>'
            f'<path d="{PAWN}" stroke-width="1.4"/><rect x="3.2" y="0.6" width="38.6" height="12" rx="1.1" opacity="0"/></g>')
    clip = '<clipPath id="c"><rect width="512" height="512" rx="114"/></clipPath>' if rounded else '<clipPath id="c"><rect width="512" height="512"/></clipPath>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs>{clip}</defs><g clip-path="url(#c)">{sq}{shadow}{figure()}</g></svg>'
open('logo.svg','w').write(logo())
open('logo-square.svg','w').write(logo(False))
