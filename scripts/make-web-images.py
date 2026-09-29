"""サイトで使う写真を images/大量の写真/ の元素材から縮小・WebP 化して images/web/ に書き出す。

元素材は大きすぎるので Git には入れていない (.gitignore)。
写真を差し替えたいときは下の SOURCES を編集して `python scripts/make-web-images.py` を実行する。
"""
from pathlib import Path

from PIL import Image, ImageOps

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
}

LOGOS = {
    "logo-horizontal-white": ("店舗ロゴ/PNG/07.png", 640),
    "logo-horizontal-black": ("店舗ロゴ/PNG/02.png", 640),
    "logo-stacked-white": ("店舗ロゴ/PNG/06.png", 480),
}


def crop(image, box):
    if not box:
        return image
    w, h = image.size
    left, top, right, bottom = box
    return image.crop((int(w * left), int(h * top), int(w * right), int(h * bottom)))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (path, widths, box) in SOURCES.items():
        image = crop(ImageOps.exif_transpose(Image.open(SRC / path)).convert("RGB"), box)
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

    # SNS 共有用 (WebP 非対応のクローラ向けに JPEG)
    og = crop(ImageOps.exif_transpose(Image.open(SRC / SOURCES["roastbeef-panini"][0])).convert("RGB"), (0.0, 0.18, 0.8, 0.82))
    og = ImageOps.fit(og, (1200, 630))
    og.save(OUT / "og.jpg", "JPEG", quality=82, optimize=True, progressive=True)


if __name__ == "__main__":
    main()
