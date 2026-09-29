"""手書き風フォント (fonts/59314.ttf, 約5.5MB) から見出しに使う文字だけを抜き出して
fonts/enka-hand.woff2 を作る。

見出しの文言やメニューの大分類名を変えて文字が抜けたら、`npm run build:font` で作り直す。
(Firestore から読み込む文字でフォントに無いものは、ゴシック体で表示される)
"""
import re
from pathlib import Path

from fontTools import subset

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ["index.html", "menu.html", "src/menu-data.js", "src/menu-page.js"]

KANA_AND_ASCII = (
    "".join(chr(c) for c in range(0x20, 0x7F))
    + "".join(chr(c) for c in range(0x3041, 0x3097))  # ひらがな
    + "".join(chr(c) for c in range(0x30A1, 0x30FB))  # カタカナ
    + "ー・、。「」『』（）！？～〜：／＆＋－０１２３４５６７８９"
)


def main():
    text = "".join((ROOT / name).read_text(encoding="utf-8") for name in SOURCES)
    kanji = "".join(sorted(set(re.findall(r"[一-鿿々]", text))))
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = subset.load_font(str(ROOT / "fonts" / "59314.ttf"), options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=KANA_AND_ASCII + kanji)
    subsetter.subset(font)
    out = ROOT / "fonts" / "enka-hand.woff2"
    subset.save_font(font, str(out), options)
    print(f"{out.name}: {out.stat().st_size // 1024} KB ({len(kanji)} kanji)")


if __name__ == "__main__":
    main()
