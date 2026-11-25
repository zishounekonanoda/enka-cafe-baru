"""サイトで使う写真を images/大量の写真/ の元素材から縮小・WebP 化して images/web/ に書き出す。

元素材は大きすぎるので Git には入れていない (.gitignore)。
写真を差し替えたいときは下の SOURCES / HERO を編集して `python scripts/make-web-images.py` を実行する。
HEIC・DNG も読めるように `pip install pillow-heif rawpy` が必要。
"""
import io
from pathlib import Path

import pillow_heif
import rawpy
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

pillow_heif.register_heif_opener()

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "大量の写真"
OUT = ROOT / "images" / "web"

# 出力名: (元ファイル, 出力する幅のリスト, 切り抜き (左, 上, 右, 下) の割合 or None)
SOURCES = {
    "roastbeef-panini": ("Food・Drink/期間限定/IMG_4802.JPG", [960, 1600], (0.05, 0.1, 0.75, 0.9)),
    "roastbeef": ("Food・Drink/期間限定/IMG_4816.JPG", [720, 1200], (0.0, 0.1, 0.9, 0.95)),
    "melon-soda": ("Food・Drink/IMG_4378.JPG", [720, 1200], (0.25, 0.0, 0.85, 1.0)),
    "coffee": ("Food・Drink/ハンドドリップコーヒー.jpg", [720], (0.0, 0.3, 1.0, 0.95)),
    "gnocchi": ("Food・Drink/チーズソースのニョッキ.jpg", [720], (0.0, 0.15, 1.0, 0.85)),
    "panini": ("Food・Drink/パニーニ.jpg", [720], (0.0, 0.25, 1.0, 0.85)),
    "counter": ("店舗写真/LINE_ALBUM_2025.7.7_250707_11.jpg", [960, 1600], None),
    "bar-seats": ("店舗写真/LINE_ALBUM_2025.7.7_250707_4.jpg", [720, 1200], None),
    "tables": ("店舗写真/LINE_ALBUM_2025.7.7_250707_1.jpg", [720, 1200], None),
    "window-seats": ("店舗写真/LINE_ALBUM_2025.7.7_250707_15.jpg", [720, 1200], None),
    "dripper": ("店舗写真/LINE_ALBUM_2025.7.7_250707_10.jpg", [720], None),
    "signboard": ("店舗写真/LINE_ALBUM_2025.7.7_250707_30.jpg", [720], None),
    "storefront": ("店舗写真/LINE_ALBUM_2025.7.7_250707_27.jpg", [720], None),
    "arch": ("店舗写真/LINE_ALBUM_2025.7.7_250707_8.jpg", [720], None),
    "wood-wall-seats": ("店舗写真/LINE_ALBUM_2025.7.7_250707_47.jpg", [720], None),
    "wall-deco": ("店舗写真/IMG_4477.JPG", [720], (0.0, 0.2, 1.0, 0.75)),
    "glasses": ("店舗写真/IMG_4493.JPG", [720], (0.0, 0.1, 1.0, 0.7)),
    "panini-portrait": ("Food・Drink/期間限定/IMG_4805.JPG", [720], (0.0, 0.25, 1.0, 0.85)),
    # 黒い背景で撮った料理 (HEIC / DNG)
    "panini-trio": ("Food・Drink/IMG_7778.heic", [720, 1200], (0.05, 0.12, 0.95, 0.95)),
    "duck-confit": ("Food・Drink/IMG_7802.HEIC", [720], (0.0, 0.45, 1.0, 0.95)),
    "ajillo-duo": ("Food・Drink/IMG_7807.HEIC", [720, 1200], (0.0, 0.6, 1.0, 0.95)),
    "tomato-gnocchi": ("Food・Drink/IMG_7792.HEIC", [720], (0.0, 0.45, 1.0, 0.95)),
    "baldango": ("Food・Drink/IMG_7786.HEIC", [720], (0.0, 0.45, 1.0, 0.95)),
    "smoked-platter": ("Food・Drink/IMG_7782.heic", [720], (0.0, 0.45, 1.0, 0.8)),
    "parfait": ("Food・Drink/パフェ/IMG_4692.DNG", [720], (0.0, 0.05, 1.0, 0.95)),
    "hand-drip": ("Food・Drink/IMG_4484.DNG", [720], (0.0, 0.1, 1.0, 0.85)),
    "entrance-wall": ("店舗写真/LINE_ALBUM_2025.7.7_250707_36.jpg", [720], None),
    "window-view": ("店舗写真/LINE_ALBUM_2025.7.7_250707_18.jpg", [720], None),
    "table-row": ("店舗写真/LINE_ALBUM_2025.7.7_250707_13.jpg", [720], None),
}

# ファーストビューのスライド。
# 名前: (元ファイル, PC用 (寄り, 中心x, 中心y), スマホ用 (寄り, 中心x, 中心y), 合成するか)
# 寄り = 元写真の横幅のうち何割を使うか。
# 合成する写真は、PC では右 64% に、スマホでは上 60% に料理を置き、残りは写真の端をぼかして伸ばす。
# 文字が重なる側 (PC の左・スマホの下) に料理がかからないようにするため。
HERO = {
    "hero-panini-trio": ("Food・Drink/IMG_7778.heic", (0.64, 0.55, 0.6), (0.6, 0.5, 0.62), True),
    "hero-counter": ("店舗写真/LINE_ALBUM_2025.7.7_250707_11.jpg", None, (1.0, 0.78, 0.5), False),
    "hero-duck": ("Food・Drink/IMG_7802.HEIC", (0.95, 0.5, 0.71), (0.72, 0.5, 0.71), True),
    "hero-parfait": ("Food・Drink/パフェ/IMG_4692.DNG", (1.0, 0.5, 0.4), (0.85, 0.5, 0.45), True),
    "hero-wood-wall": ("店舗写真/LINE_ALBUM_2025.7.7_250707_47.jpg", None, (1.0, 0.62, 0.5), False),
    "hero-ajillo": ("Food・Drink/IMG_7814.HEIC", (0.9, 0.5, 0.74), (0.68, 0.5, 0.74), True),
    "hero-smoked": ("Food・Drink/IMG_7782.heic", (1.0, 0.5, 0.6), (0.8, 0.5, 0.6), True),
}

LOGOS = {
    "logo-horizontal-white": ("店舗ロゴ/PNG/07.png", 640),
    "logo-horizontal-black": ("店舗ロゴ/PNG/02.png", 640),
    "logo-stacked-white": ("店舗ロゴ/PNG/06.png", 480),
}


def load(path):
    path = SRC / path
    if path.suffix.lower() == ".dng":
        # DNG には撮影時のフル解像度 JPEG が入っているので、それを使う
        with rawpy.imread(str(path)) as raw:
            image = Image.open(io.BytesIO(raw.extract_thumb().data))
            image.load()
    else:
        image = Image.open(path)
    return ImageOps.exif_transpose(image).convert("RGB")


def crop(image, box):
    if not box:
        return image
    w, h = image.size
    left, top, right, bottom = box
    return image.crop((int(w * left), int(h * top), int(w * right), int(h * bottom)))


def crop_aspect(image, aspect, zoom, cx, cy):
    w, h = image.size
    cw = zoom * w
    ch = cw / aspect
    if ch > h:
        ch, cw = h, h * aspect
    left = min(max(cx * w - cw / 2, 0), w - cw)
    top = min(max(cy * h - ch / 2, 0), h - ch)
    return image.crop((int(left), int(top), int(left + cw), int(top + ch)))


def feather(size, edge, side):
    w, h = size
    mask = Image.new("L", size, 255)
    draw = ImageDraw.Draw(mask)
    for i in range(edge):
        alpha = int(255 * i / edge)
        if side == "left":
            draw.line([(i, 0), (i, h)], fill=alpha)
        else:
            draw.line([(0, h - 1 - i), (w, h - 1 - i)], fill=alpha)
    return mask


def compose(image, size, spec, side):
    """料理を片側に置き、反対側は写真の端の色をぼかして伸ばした背景にする。"""
    w, h = size
    zoom, cx, cy = spec
    if side == "left":
        pw, ph = int(w * 0.64), h
        panel = crop_aspect(image, pw / ph, zoom, cx, cy).resize((pw, ph), Image.LANCZOS)
        edge = panel.crop((0, 0, 12, ph)).resize((w, h))
        pos = (w - pw, 0)
    else:
        pw, ph = w, int(h * 0.6)
        panel = crop_aspect(image, pw / ph, zoom, cx, cy).resize((pw, ph), Image.LANCZOS)
        edge = panel.crop((0, ph - 12, pw, ph)).resize((w, h))
        pos = (0, 0)
    out = ImageEnhance.Brightness(edge.resize((16, 16)).resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(min(w, h) // 12))).enhance(0.6)
    out.paste(panel, pos, feather((pw, ph), int(min(w, h) * 0.2), side))
    return out


def save_hero(name, image, desktop, mobile, composed):
    for width in (1280, 1920):
        size = (width, width * 9 // 16)
        if composed:
            slide = compose(image, size, desktop, "left")
        else:
            slide = ImageOps.fit(image, size, centering=(0.5, 0.5))
        slide.save(OUT / f"{name}-{width}.webp", "WEBP", quality=74, method=6)
    size = (800, 1100)
    if composed:
        slide = compose(image, size, mobile, "bottom")
    else:
        slide = ImageOps.fit(image, size, centering=mobile[1:])
    slide.save(OUT / f"{name}-m.webp", "WEBP", quality=74, method=6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (path, widths, box) in SOURCES.items():
        image = crop(load(path), box)
        for width in widths:
            resized = image.copy()
            resized.thumbnail((width, width * 3))
            resized.save(OUT / f"{name}-{width}.webp", "WEBP", quality=78, method=6)
    for name, (path, width) in LOGOS.items():
        logo = Image.open(SRC / path).convert("RGBA")
        logo = logo.crop(logo.getbbox())
        logo.thumbnail((width, width))
        logo.save(OUT / f"{name}.webp", "WEBP", quality=90, method=6)
        logo.save(OUT / f"{name}.png", optimize=True)

    for name, (path, desktop, mobile, composed) in HERO.items():
        save_hero(name, load(path), desktop, mobile, composed)

    # SNS 共有用 (WebP 非対応のクローラ向けに JPEG)
    og = ImageOps.fit(load(HERO["hero-panini-trio"][0]), (1200, 630), centering=(0.5, 0.6))
    og.save(OUT / "og.jpg", "JPEG", quality=82, optimize=True, progressive=True)


if __name__ == "__main__":
    main()
