#!/usr/bin/env python3
"""Author compact Boogar + floor maps from the official Coral Pudge plush swatch."""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
REF = ROOT / "scripts" / "refs" / "boogar-fiber.png"
SHEET = Path("/tmp/sheets/pack/boogar/boogar-character.png")
OUT_BOOGAR = ROOT / "public" / "textures" / "boogar"
OUT_FLOOR = ROOT / "public" / "textures" / "floor"

CORAL = (255, 140, 115)  # #FF8C73
BELLY = (255, 182, 160)  # #FFB6A0
CREAM = (252, 246, 236)
MINT = (186, 236, 214)
PEACH = (255, 210, 186)
SKY = (186, 226, 255)
PINK = (255, 196, 220)
LEMON = (255, 236, 170)


def fade(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def clamp255(v: float) -> int:
    return max(0, min(255, int(round(v))))


def extract_fiber_swatch() -> Image.Image:
    if REF.exists():
        return Image.open(REF).convert("RGB")
    if not SHEET.exists():
        raise SystemExit(f"Missing fiber ref {REF} and sheet {SHEET}")
    im = Image.open(SHEET).convert("RGB")
    region = im.crop((380, 1020, 540, 1180))
    w, h = region.size
    pts: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            r, g, b = region.getpixel((x, y))
            if r > 190 and 70 < g < 190 and b < 180 and r - g > 40:
                pts.append((x, y))
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    dists = sorted(math.hypot(x - cx, y - cy) for x, y in pts)
    rad = dists[int(len(dists) * 0.92)]
    inset = rad * 0.68
    box = (380 + cx - inset, 1020 + cy - inset, 380 + cx + inset, 1020 + cy + inset)
    swatch = im.crop(tuple(int(v) for v in box))
    REF.parent.mkdir(parents=True, exist_ok=True)
    swatch.save(REF)
    return swatch


def make_tileable(img: Image.Image) -> Image.Image:
    w, h = img.size
    src = img.load()
    out = Image.new("RGB", (w, h))
    dst = out.load()
    hw, hh = w / 2, h / 2
    for y in range(h):
        for x in range(w):
            wx = fade(min(x, w - 1 - x) / hw)
            wy = fade(min(y, h - 1 - y) / hh)
            wgt = wx * wy
            ox, oy = (x + w // 2) % w, (y + h // 2) % h
            r1, g1, b1 = src[x, y]
            r2, g2, b2 = src[ox, oy]
            dst[x, y] = (
                clamp255(r1 * wgt + r2 * (1 - wgt)),
                clamp255(g1 * wgt + g2 * (1 - wgt)),
                clamp255(b1 * wgt + b2 * (1 - wgt)),
            )
    return out


def color_match(img: Image.Image, target: tuple[int, int, int], amount: float = 0.72) -> Image.Image:
    pixels = list(img.getdata())
    n = len(pixels)
    mr = sum(p[0] for p in pixels) / n
    mg = sum(p[1] for p in pixels) / n
    mb = sum(p[2] for p in pixels) / n
    out: list[tuple[int, int, int]] = []
    for r, g, b in pixels:
        out.append(
            (
                clamp255(lerp(r, r - mr + target[0], amount)),
                clamp255(lerp(g, g - mg + target[1], amount)),
                clamp255(lerp(b, b - mb + target[2], amount)),
            )
        )
    matched = Image.new("RGB", img.size)
    matched.putdata(out)
    return matched


def tile_to(img: Image.Image, size: int) -> Image.Image:
    tile = img
    canvas = Image.new("RGB", (size, size))
    tw, th = tile.size
    for y in range(0, size, th):
        for x in range(0, size, tw):
            canvas.paste(tile, (x, y))
    return canvas


def hash2(ix: int, iy: int, seed: int = 0) -> float:
    n = math.sin((ix + seed * 17) * 127.1 + (iy + seed * 13) * 311.7) * 43758.5453
    return n - math.floor(n)


def value_noise(x: float, y: float, seed: int = 0, period: int | None = None) -> float:
    x0 = math.floor(x)
    y0 = math.floor(y)
    fx = x - x0
    fy = y - y0
    if period is not None:
        x0 %= period
        y0 %= period
        x1 = (x0 + 1) % period
        y1 = (y0 + 1) % period
    else:
        x1 = x0 + 1
        y1 = y0 + 1
    u = fade(fx)
    v = fade(fy)
    a = hash2(x0, y0, seed)
    b = hash2(x1, y0, seed)
    c = hash2(x0, y1, seed)
    d = hash2(x1, y1, seed)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v


def fbm(x: float, y: float, octaves: int = 4, seed: int = 0, period: float | None = None) -> float:
    total = 0.0
    amp = 0.55
    freq = 1.0
    norm = 0.0
    for i in range(octaves):
        p = int(period * freq) if period is not None else None
        total += value_noise(x * freq, y * freq, seed + i * 19, p) * amp
        norm += amp
        freq *= 2.05
        amp *= 0.5
    return total / norm if norm else 0.0


def wrap_u(u: float, target: float) -> float:
    d = abs(u - target)
    return min(d, 1.0 - d)


def height_to_normal(height: list[float], size: int, strength: float) -> Image.Image:
    out: list[tuple[int, int, int]] = []
    for y in range(size):
        for x in range(size):
            xl = height[y * size + ((x - 1) % size)]
            xr = height[y * size + ((x + 1) % size)]
            yd = height[((y - 1) % size) * size + x]
            yu = height[((y + 1) % size) * size + x]
            nx = (xl - xr) * strength
            ny = (yd - yu) * strength
            nz = 1.0
            length = math.sqrt(nx * nx + ny * ny + nz * nz) or 1.0
            nx /= length
            ny /= length
            nz /= length
            out.append(
                (
                    clamp255((nx * 0.5 + 0.5) * 255),
                    clamp255((ny * 0.5 + 0.5) * 255),
                    clamp255((nz * 0.5 + 0.5) * 255),
                )
            )
    img = Image.new("RGB", (size, size))
    img.putdata(out)
    return img


def luminance_height(img: Image.Image) -> list[float]:
    gray = ImageOps.grayscale(img)
    return [p / 255.0 for p in gray.getdata()]


def paint_belly(img: Image.Image) -> Image.Image:
    size = img.size[0]
    src = img.load()
    out = Image.new("RGB", img.size)
    dst = out.load()
    for y in range(size):
        v = y / (size - 1)
        for x in range(size):
            u = x / size
            du = wrap_u(u, 0.25)
            dv = v - 0.64
            belly = math.exp(-(du * du) / (2 * 0.13 * 0.13) - (dv * dv) / (2 * 0.17 * 0.17))
            belly = max(0.0, min(1.0, belly * 0.82))
            pole = fade(max(0.0, 1.0 - v / 0.08)) + fade(max(0.0, (v - 0.92) / 0.08))
            r, g, b = src[x, y]
            r = lerp(r, BELLY[0], belly)
            g = lerp(g, BELLY[1], belly)
            b = lerp(b, BELLY[2], belly)
            shade = 1.0 - pole * 0.08
            dst[x, y] = (clamp255(r * shade), clamp255(g * shade), clamp255(b * shade))
    return out


def build_fiber_tile(size: int, target: tuple[int, int, int]) -> Image.Image:
    swatch = extract_fiber_swatch()
    mid = make_tileable(swatch.resize((256, 256), Image.Resampling.LANCZOS))
    mid = color_match(mid, target, 0.62)
    mid = ImageEnhance.Contrast(mid).enhance(1.18)
    mid = ImageEnhance.Sharpness(mid).enhance(1.25)
    tiled = Image.blend(tile_to(mid, size), ImageChops.offset(tile_to(mid, size), size // 3, size // 5), 0.38)
    # Soft large-scale mottling so the repeat is less obvious
    pixels = list(tiled.getdata())
    period = 8
    painted: list[tuple[int, int, int]] = []
    for y in range(size):
        for x in range(size):
            n = fbm(x / size * period, y / size * period, 4, 5, period)
            t = (n - 0.5) * 0.08
            r, g, b = pixels[y * size + x]
            painted.append((clamp255(r * (1 + t)), clamp255(g * (1 + t * 0.9)), clamp255(b * (1 + t * 0.85))))
    tiled.putdata(painted)
    return tiled


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def gen_boogar(size: int = 512) -> None:
    albedo = paint_belly(build_fiber_tile(size, CORAL))
    save(albedo, OUT_BOOGAR / "albedo.png")
    height = luminance_height(albedo)
    save(height_to_normal(height, size, 3.4), OUT_BOOGAR / "normal.png")


def gen_floor(size: int = 512) -> None:
    fiber = build_fiber_tile(size, CREAM)
    fiber = ImageEnhance.Color(fiber).enhance(0.35)
    fiber = color_match(fiber, CREAM, 0.55)
    src = fiber.load()
    out = Image.new("RGB", (size, size))
    dst = out.load()
    period = 10
    for y in range(size):
        v = y / size
        for x in range(size):
            u = x / size
            edge = min(u, v, 1.0 - u, 1.0 - v)
            rim = fade(max(0.0, 1.0 - edge / 0.14))
            center = fade(max(0.0, 1.0 - math.hypot(u - 0.5, v - 0.5) / 0.58))
            n = fbm(u * period, v * period, 4, 11, period)
            speck = fbm(u * 18, v * 18, 3, 29, 18)
            r, g, b = src[x, y]
            rgb = (r, g, b)
            wash = [
                (PEACH, max(0.0, n - 0.48) * 0.22),
                (MINT, max(0.0, speck - 0.58) * 0.35),
                (PINK, max(0.0, fbm(u * 14, v * 14, 2, 41, 14) - 0.62) * 0.28),
                (SKY, max(0.0, fbm(u * 16 + 3, v * 16, 2, 17, 16) - 0.64) * 0.22),
                (LEMON, center * 0.1),
            ]
            for color, amt in wash:
                rgb = (
                    lerp(rgb[0], color[0], amt),
                    lerp(rgb[1], color[1], amt),
                    lerp(rgb[2], color[2], amt),
                )
            rgb = (
                rgb[0] * (1.0 - rim * 0.1 + center * 0.07),
                rgb[1] * (1.0 - rim * 0.1 + center * 0.06),
                rgb[2] * (1.0 - rim * 0.09 + center * 0.05),
            )
            dst[x, y] = (clamp255(rgb[0]), clamp255(rgb[1]), clamp255(rgb[2]))
    save(out, OUT_FLOOR / "silicone_albedo.png")
    height = luminance_height(out)
    # Add a soft cushion bulge for the tile
    for y in range(size):
        v = y / size
        for x in range(size):
            u = x / size
            edge = min(u, v, 1.0 - u, 1.0 - v)
            rim = fade(max(0.0, 1.0 - edge / 0.14))
            center = fade(max(0.0, 1.0 - math.hypot(u - 0.5, v - 0.5) / 0.58))
            height[y * size + x] += center * 0.18 - rim * 0.12
    save(height_to_normal(height, size, 2.6), OUT_FLOOR / "silicone_normal.png")


def main() -> None:
    gen_boogar(512)
    gen_floor(512)


if __name__ == "__main__":
    main()
