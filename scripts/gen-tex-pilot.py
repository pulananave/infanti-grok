#!/usr/bin/env python3
"""Bake Boogar v2 albedo/normal from the official Coral Pudge character sheet.

v1 (#20) only sampled sheet colors into a tileable fiber swatch. v2 projects
sheet artwork into a UV atlas so face, belly, limbs and claws read on the mesh.

Atlas (1024, flipY=true → v=1 at PNG top), islands in UV (v=0 bottom):

    body     u 0.00–1.00  v 0.50–1.00   equirectangular unwrap (front @ u=0.25)
    arm      u 0.02–0.23  v 0.27–0.48   posed arm from the sheet
    leg      u 0.27–0.48  v 0.27–0.48   posed leg
    ear      u 0.52–0.73  v 0.27–0.48   bear ear
    claw     u 0.77–0.98  v 0.27–0.48   dark resin claw
    hand     u 0.02–0.23  v 0.02–0.23   palm
    earInner u 0.27–0.48  v 0.02–0.23   lighter inner-ear / belly
    fiber    u 0.52–0.73  v 0.02–0.23   plush fill (reference)
    face     u 0.77–0.98  v 0.02–0.23   raw expression crop (reference)

Keep `src/theme/boogarAtlas.ts` ISLANDS in sync with ISLANDS below.

    python3 scripts/gen-tex-pilot.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
REF_FIBER = ROOT / "scripts" / "refs" / "boogar-fiber.png"
SHEET = ROOT / "scripts" / "refs" / "boogar-character.png"
SHEET_FALLBACK = Path("/tmp/sheets/pack/pack/boogar/boogar-character.png")
OUT_BOOGAR = ROOT / "public" / "textures" / "boogar"
OUT_FLOOR = ROOT / "public" / "textures" / "floor"
DEBUG = Path("/tmp/boogar-atlas-debug")

CORAL = (255, 140, 115)  # #FF8C73
BELLY = (255, 182, 160)  # #FFB6A0
CREAM = (252, 246, 236)
MINT = (186, 236, 214)
PEACH = (255, 210, 186)
SKY = (186, 226, 255)
PINK = (255, 196, 220)
LEMON = (255, 236, 170)
INK = (42, 1, 45)  # #2A012D

# Official 768×1376 Coral Pudge sheet (release jelly-character-sheets).
CROPS = {
    "front": (16, 104, 236, 274),
    "three_quarter": (248, 104, 436, 274),
    "side": (440, 104, 556, 274),
    "rear": (556, 104, 756, 274),
    "face_neutral": (21, 346, 204, 546),
    "pose_left": (29, 1088, 369, 1339),
    "materials": (397, 1048, 713, 1341),
}

# u0, v0, u1, v1  — v=0 at bottom (Three.js / flipY=true).
ISLANDS: dict[str, tuple[float, float, float, float]] = {
    "body": (0.00, 0.50, 1.00, 1.00),
    "arm": (0.02, 0.27, 0.23, 0.48),
    "leg": (0.27, 0.27, 0.48, 0.48),
    "ear": (0.52, 0.27, 0.73, 0.48),
    "claw": (0.77, 0.27, 0.98, 0.48),
    "hand": (0.02, 0.02, 0.23, 0.23),
    "earInner": (0.27, 0.02, 0.48, 0.23),
    "fiber": (0.52, 0.02, 0.73, 0.23),
    "face": (0.77, 0.02, 0.98, 0.23),
}

ATLAS = 1024


def fade(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3.0 - 2.0 * t)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def clamp255(v: float) -> int:
    return max(0, min(255, int(round(v))))


def load_sheet() -> Image.Image:
    path = SHEET if SHEET.exists() else SHEET_FALLBACK
    if not path.exists():
        raise SystemExit(f"Missing Boogar sheet at {SHEET} (or {SHEET_FALLBACK})")
    print(f"sheet {path}")
    return Image.open(path).convert("RGB")


def is_page(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    avg = (r + g + b) / 3
    return mx - mn < 18 and 190 <= avg <= 245


def is_frame(r: int, g: int, b: int) -> bool:
    return r < 45 and g < 45 and b < 45


def is_character(r: int, g: int, b: int) -> bool:
    if r > 155 and 55 < g < 215 and b < 205 and r > g - 8:
        return True
    if r < 110 and g < 90 and b < 110:
        return True
    if r > 200 and g > 165 and b > 145 and r - b < 90:
        return True
    return False


def rgba_from_sheet(im: Image.Image, box: tuple[int, int, int, int], drop_frame: bool = False) -> Image.Image:
    crop = im.crop(box).convert("RGBA")
    src = crop.load()
    w, h = crop.size
    for y in range(h):
        for x in range(w):
            r, g, b, _ = src[x, y]
            if drop_frame and is_frame(r, g, b):
                src[x, y] = (r, g, b, 0)
            elif is_page(r, g, b) or not is_character(r, g, b):
                src[x, y] = (r, g, b, 0)
    return crop


def feather_alpha(im: Image.Image, radius: int = 6) -> Image.Image:
    out = im.copy()
    alpha = out.split()[-1].filter(ImageFilter.GaussianBlur(radius=radius))
    out.putalpha(alpha)
    return out


def opaque_bbox(im: Image.Image, t: int = 12) -> tuple[int, int, int, int] | None:
    src = im.load()
    w, h = im.size
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if src[x, y][3] > t:
                if x < minx:
                    minx = x
                if y < miny:
                    miny = y
                if x > maxx:
                    maxx = x
                if y > maxy:
                    maxy = y
    if maxx < 0:
        return None
    return minx, miny, maxx + 1, maxy + 1


def trim_alpha(im: Image.Image, pad: int = 2) -> Image.Image:
    box = opaque_bbox(im)
    if not box:
        return im
    x0, y0, x1, y1 = box
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(im.size[0], x1 + pad)
    y1 = min(im.size[1], y1 + pad)
    return im.crop((x0, y0, x1, y1))


def isolate_torso(im: Image.Image, rx=0.36, ry=0.46, cy_t=0.42) -> Image.Image:
    """Keep the central body ellipse; drop arms, legs and ear nubs."""
    box = opaque_bbox(im)
    if not box:
        return im
    x0, y0, x1, y1 = box
    cx = (x0 + x1) * 0.5
    cy = y0 + (y1 - y0) * cy_t
    aw = (x1 - x0) * rx
    ah = (y1 - y0) * ry
    out = im.copy()
    src = im.load()
    dst = out.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            a = src[x, y][3]
            if a == 0:
                continue
            u = (x - cx) / max(aw, 1)
            v = (y - cy) / max(ah, 1)
            if u * u + v * v > 1.0:
                dst[x, y] = (src[x, y][0], src[x, y][1], src[x, y][2], 0)
    return out


def isolate_head(im: Image.Image) -> Image.Image:
    """Expression tile: drop the black frame, page, and ear nubs."""
    boxed = trim_alpha(im)
    return isolate_torso(boxed, rx=0.48, ry=0.42, cy_t=0.55)


def extract_ear(sheet: Image.Image) -> Image.Image:
    return rgba_from_sheet(sheet, (31, 354, 91, 401))


def extract_pose_part(sheet: Image.Image, kind: str) -> Image.Image:
    boxes = {
        "arm": (287, 1093, 369, 1178),
        "leg": (42, 1233, 137, 1339),
        "hand": (301, 1093, 369, 1158),
    }
    return rgba_from_sheet(sheet, boxes[kind])


def extract_material_circles(sheet: Image.Image) -> tuple[Image.Image, Image.Image]:
    fiber = rgba_from_sheet(sheet, (410, 1060, 520, 1170))
    claw = rgba_from_sheet(sheet, (405, 1218, 500, 1308))
    return fiber, claw


def extract_fiber_swatch() -> Image.Image:
    if REF_FIBER.exists():
        return Image.open(REF_FIBER).convert("RGB")
    sheet = load_sheet()
    fiber, _ = extract_material_circles(sheet)
    rgb = Image.new("RGB", fiber.size, CORAL)
    rgb.paste(fiber.convert("RGB"), mask=fiber.split()[-1])
    REF_FIBER.parent.mkdir(parents=True, exist_ok=True)
    rgb.save(REF_FIBER)
    return rgb


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
    canvas = Image.new("RGB", (size, size))
    tw, th = img.size
    for y in range(0, size, th):
        for x in range(0, size, tw):
            canvas.paste(img, (x, y))
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


def build_fiber_tile(size: int, target: tuple[int, int, int]) -> Image.Image:
    swatch = extract_fiber_swatch()
    mid = make_tileable(swatch.resize((256, 256), Image.Resampling.LANCZOS))
    mid = color_match(mid, target, 0.62)
    mid = ImageEnhance.Contrast(mid).enhance(1.18)
    mid = ImageEnhance.Sharpness(mid).enhance(1.25)
    tiled = Image.blend(tile_to(mid, size), ImageChops.offset(tile_to(mid, size), size // 3, size // 5), 0.38)
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


def island_px(name: str, size: int) -> tuple[int, int, int, int]:
    u0, v0, u1, v1 = ISLANDS[name]
    x0 = int(round(u0 * size))
    x1 = int(round(u1 * size))
    y0 = int(round((1.0 - v1) * size))
    y1 = int(round((1.0 - v0) * size))
    return x0, y0, x1, y1


class Sprite:
    def __init__(self, im: Image.Image):
        self.im = im.convert("RGBA")
        self.w, self.h = self.im.size
        self.px = self.im.load()
        box = opaque_bbox(self.im) or (0, 0, self.w, self.h)
        self.x0, self.y0, self.x1, self.y1 = box
        self.cx = (self.x0 + self.x1) * 0.5
        self.cy = (self.y0 + self.y1) * 0.5
        self.rx = max(1.0, (self.x1 - self.x0) * 0.5)
        self.ry = max(1.0, (self.y1 - self.y0) * 0.5)

    def sample(self, nx: float, ny: float) -> tuple[int, int, int, int]:
        """Sample with bilinear filter. `nx, ny` in [-1, 1] (y up)."""
        u = self.cx + nx * self.rx
        v = self.cy - ny * self.ry
        if u < -1 or v < -1 or u > self.w or v > self.h:
            return (0, 0, 0, 0)
        x0 = int(math.floor(u))
        y0 = int(math.floor(v))
        x1 = x0 + 1
        y1 = y0 + 1
        fx = u - x0
        fy = v - y0

        def at(x: int, y: int) -> tuple[int, int, int, int]:
            if x < 0 or y < 0 or x >= self.w or y >= self.h:
                return (0, 0, 0, 0)
            return self.px[x, y]

        c00 = at(x0, y0)
        c10 = at(x1, y0)
        c01 = at(x0, y1)
        c11 = at(x1, y1)
        out = [0.0, 0.0, 0.0, 0.0]
        for i in range(4):
            out[i] = (
                c00[i] * (1 - fx) * (1 - fy)
                + c10[i] * fx * (1 - fy)
                + c01[i] * (1 - fx) * fy
                + c11[i] * fx * fy
            )
        return (clamp255(out[0]), clamp255(out[1]), clamp255(out[2]), clamp255(out[3]))


def sphere_xyz(u: float, v: float) -> tuple[float, float, float]:
    """Three.js SphereGeometry default: u=0 at −X, u=0.25 at +Z (front)."""
    theta = u * math.tau
    phi = (1.0 - v) * math.pi
    sp = math.sin(phi)
    x = -math.cos(theta) * sp
    y = math.cos(phi)
    z = math.sin(theta) * sp
    return x, y, z


def rotate_yaw(x: float, z: float, yaw: float) -> tuple[float, float]:
    c, s = math.cos(yaw), math.sin(yaw)
    return x * c + z * s, -x * s + z * c


def project_views(
    width: int,
    height: int,
    views: list[tuple[Sprite, float]],
    fiber: Image.Image,
    extra: list[tuple[Sprite, float, float, float]] | None = None,
) -> Image.Image:
    """Bake an equirectangular unwrap. `extra` is (sprite, yaw, y_shift, radius)."""
    out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    dst = out.load()
    fib = fiber.resize((width, height), Image.Resampling.LANCZOS).load()
    extra = extra or []
    for y in range(height):
        v = 1.0 - (y + 0.5) / height
        for x in range(width):
            u = (x + 0.5) / width
            px, py, pz = sphere_xyz(u, v)
            acc = [0.0, 0.0, 0.0, 0.0]
            for sprite, yaw in views:
                lx, lz = rotate_yaw(px, pz, -yaw)
                if lz <= 0.02:
                    continue
                wgt = max(0.0, lz) ** 1.65
                r, g, b, a = sprite.sample(lx, py)
                if a < 4:
                    continue
                aw = (a / 255.0) * wgt
                acc[0] += r * aw
                acc[1] += g * aw
                acc[2] += b * aw
                acc[3] += aw
            for sprite, yaw, y_shift, radius in extra:
                lx, lz = rotate_yaw(px, pz, -yaw)
                if lz <= 0.04:
                    continue
                ny = (py - y_shift) / radius
                nx = lx / radius
                if nx * nx + ny * ny > 1.05:
                    continue
                wgt = max(0.0, lz) ** 1.2
                r, g, b, a = sprite.sample(nx, ny)
                if a < 4:
                    continue
                aw = (a / 255.0) * max(0.4, wgt) * 1.7
                acc[0] += r * aw
                acc[1] += g * aw
                acc[2] += b * aw
                acc[3] += aw
            fr, fg, fb = fib[x, y]
            if acc[3] > 0.02:
                t = min(1.0, acc[3])
                dst[x, y] = (
                    clamp255(lerp(fr, acc[0] / acc[3], t)),
                    clamp255(lerp(fg, acc[1] / acc[3], t)),
                    clamp255(lerp(fb, acc[2] / acc[3], t)),
                    255,
                )
            else:
                dst[x, y] = (fr, fg, fb, 255)
    return out.convert("RGB")


def cover_island(atlas: Image.Image, name: str, sprite: Image.Image, fallback: tuple[int, int, int]) -> None:
    x0, y0, x1, y1 = island_px(name, atlas.size[0])
    w, h = x1 - x0, y1 - y0
    base = Image.new("RGB", (w, h), fallback)
    spr = trim_alpha(sprite.convert("RGBA"))
    if spr.size[0] > 0 and spr.size[1] > 0:
        fitted = ImageOps.contain(spr, (max(1, w - 8), max(1, h - 8)), Image.Resampling.LANCZOS)
        bg = Image.new("RGBA", (w, h), (*fallback, 255))
        px = (w - fitted.size[0]) // 2
        py = (h - fitted.size[1]) // 2
        bg.alpha_composite(fitted, (px, py))
        base = bg.convert("RGB")
    atlas.paste(base, (x0, y0))


def fill_island(atlas: Image.Image, name: str, img: Image.Image) -> None:
    x0, y0, x1, y1 = island_px(name, atlas.size[0])
    atlas.paste(img.resize((x1 - x0, y1 - y0), Image.Resampling.LANCZOS), (x0, y0))


def paint_belly_equirect(img: Image.Image) -> Image.Image:
    """Lighter belly oval on the lower front (u=0.25, v≈0.36)."""
    out = img.copy()
    src = img.load()
    dst = out.load()
    w, h = img.size
    for y in range(h):
        v = 1.0 - (y + 0.5) / h
        for x in range(w):
            u = (x + 0.5) / w
            du = min(abs(u - 0.25), 1.0 - abs(u - 0.25))
            dv = v - 0.36
            belly = math.exp(-(du * du) / (2 * 0.11 * 0.11) - (dv * dv) / (2 * 0.12 * 0.12))
            belly = max(0.0, min(1.0, belly * 0.55))
            if belly < 0.02:
                continue
            r, g, b = src[x, y]
            dst[x, y] = (
                clamp255(lerp(r, BELLY[0], belly)),
                clamp255(lerp(g, BELLY[1], belly)),
                clamp255(lerp(b, BELLY[2], belly)),
            )
    return out


def paint_limb_break(img: Image.Image, tip="bottom") -> Image.Image:
    """Darker distal end so limb islands show the sheet's claw color break."""
    out = img.copy()
    src = img.load()
    dst = out.load()
    w, h = img.size
    for y in range(h):
        t = y / max(h - 1, 1)
        if tip == "bottom":
            amt = fade(max(0.0, (t - 0.72) / 0.28)) * 0.82
        else:
            amt = fade(max(0.0, (0.28 - t) / 0.28)) * 0.82
        for x in range(w):
            r, g, b = src[x, y]
            dst[x, y] = (
                clamp255(lerp(r, INK[0], amt)),
                clamp255(lerp(g, INK[1], amt)),
                clamp255(lerp(b, INK[2], amt)),
            )
    return out


def dump_debug(name: str, im: Image.Image) -> None:
    DEBUG.mkdir(parents=True, exist_ok=True)
    im.save(DEBUG / f"{name}.png")


def gen_boogar(size: int = ATLAS) -> None:
    sheet = load_sheet()
    fiber_rgb = build_fiber_tile(512, CORAL)
    belly_fiber = build_fiber_tile(256, BELLY)

    front = isolate_torso(rgba_from_sheet(sheet, CROPS["front"]), rx=0.34, ry=0.48, cy_t=0.44)
    side = isolate_torso(rgba_from_sheet(sheet, CROPS["side"]), rx=0.42, ry=0.50, cy_t=0.42)
    rear = isolate_torso(rgba_from_sheet(sheet, CROPS["rear"]), rx=0.34, ry=0.48, cy_t=0.44)
    face = isolate_head(rgba_from_sheet(sheet, CROPS["face_neutral"], drop_frame=True))
    fiber_circle, claw_circle = extract_material_circles(sheet)
    ear = extract_ear(sheet)
    arm = extract_pose_part(sheet, "arm")
    leg = extract_pose_part(sheet, "leg")
    hand = extract_pose_part(sheet, "hand")

    for name, im in (
        ("front", front),
        ("side", side),
        ("rear", rear),
        ("face", face),
        ("ear", ear),
        ("arm", arm),
        ("leg", leg),
        ("hand", hand),
        ("fiber_circle", fiber_circle),
        ("claw_circle", claw_circle),
    ):
        dump_debug(name, im)

    views = [
        (Sprite(front), 0.0),
        (Sprite(side), math.radians(90)),
        (Sprite(ImageOps.mirror(side)), math.radians(-90)),
        (Sprite(rear), math.pi),
    ]
    # High-res neutral face on the upper front of the sphere (y≈+0.16).
    extras = [(Sprite(feather_alpha(face, 4)), 0.0, 0.12, 0.7)]
    body = project_views(size, size // 2, views, fiber_rgb, extras)
    body = paint_belly_equirect(body)
    dump_debug("body_unwrap", body)

    atlas = Image.new("RGB", (size, size), CORAL)
    atlas.paste(body, (0, 0))
    fill_island(atlas, "fiber", fiber_rgb)
    fill_island(atlas, "earInner", belly_fiber)
    cover_island(atlas, "arm", paint_limb_break(arm.convert("RGB"), "top"), CORAL)
    # Re-paint arm from the RGBA crop so the posed sheet arm is visible.
    cover_island(atlas, "arm", arm, CORAL)
    cover_island(atlas, "leg", leg, CORAL)
    cover_island(atlas, "ear", ear, CORAL)
    cover_island(atlas, "claw", claw_circle, INK)
    cover_island(atlas, "hand", hand, CORAL)
    cover_island(atlas, "face", face, CORAL)

    # Darker distal band on the arm/leg islands (capsule v≈0 is the tip).
    ax0, ay0, ax1, ay1 = island_px("arm", size)
    atlas.paste(paint_limb_break(atlas.crop((ax0, ay0, ax1, ay1)), "bottom"), (ax0, ay0))
    lx0, ly0, lx1, ly1 = island_px("leg", size)
    atlas.paste(paint_limb_break(atlas.crop((lx0, ly0, lx1, ly1)), "bottom"), (lx0, ly0))

    atlas = atlas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=55, threshold=4))
    save(atlas, OUT_BOOGAR / "albedo.png")

    height = luminance_height(atlas)
    # Extra fiber relief so the plush still reads under stage lights.
    fib_h = luminance_height(fiber_rgb.resize((size, size), Image.Resampling.LANCZOS))
    for i, hgt in enumerate(height):
        height[i] = hgt * 0.72 + fib_h[i] * 0.28
    save(height_to_normal(height, size, 2.8), OUT_BOOGAR / "normal.png")

    preview = atlas.copy()
    draw = ImageDraw.Draw(preview)
    for name in ISLANDS:
        x0, y0, x1, y1 = island_px(name, size)
        draw.rectangle([x0, y0, x1 - 1, y1 - 1], outline=(40, 40, 40))
        draw.text((x0 + 6, y0 + 6), name, fill=(20, 20, 20))
    dump_debug("atlas_labeled", preview)


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
    gen_boogar(ATLAS)
    if not (OUT_FLOOR / "silicone_albedo.png").exists():
        gen_floor(512)
    else:
        print("keeping existing floor maps")


if __name__ == "__main__":
    main()
