export const defaultMenuData = {
  updatedAt: null,
  groups: [
    {
      id: "lunch",
      navLabel: "ランチ",
      title: "ランチメニュー",
      label: "11:00〜16:00（ラストオーダー 15:30）",
      icon: "fa-solid fa-sun text-amber-700",
      theme: "amber",
      sections: [
        {
          id: "lunch-panini",
          title: "パニーニ",
          items: [
            { name: "燻製 鴨肉のロースト", price: "¥1080（ハーフサイズ ¥600）", note: "" },
            { name: "自家製燻製チーズとベーコン", price: "¥1120（ハーフサイズ ¥650）", note: "ソースなし -¥30" },
            { name: "スモークサーモンとクリームチーズ", price: "¥1190（ハーフサイズ ¥690）", note: "" },
            { name: "パニーニ（パンのみ／バター付き）", price: "¥590（ハーフサイズ ¥390）", note: "藤沢産はちみつ付き +¥100" }
          ],
          notes: []
        },
        {
          id: "lunch-gnocchi",
          title: "ニョッキ",
          items: [
            { name: "セミドライトマトのニョッキ", price: "¥1080", note: "" },
            { name: "チーズソースのニョッキ", price: "¥1180", note: "" },
            { name: "サラダセット", price: "+¥250", note: "" },
            { name: "ドリンクセット", price: "+¥350", note: "" },
            { name: "サラダ＋ドリンクセット", price: "+¥450", note: "" }
          ],
          notes: ["パニーニまたはニョッキのみセットにできます。"]
        },
        {
          id: "lunch-salad",
          title: "サラダ",
          items: [
            { name: "燻製ベーコンのシーザーサラダ（約2人前）", price: "¥1000", note: "" },
            { name: "気まぐれサラダ（約2人前）", price: "¥800", note: "" }
          ],
          notes: []
        },
        {
          id: "lunch-side",
          title: "サイドメニュー",
          items: [
            { name: "燻製ポテトチップス", price: "¥470", note: "" },
            { name: "大人の駄菓子 ～瞬間燻製～", price: "¥470", note: "内容は日替わりです。" },
            { name: "バケット（4枚）", price: "¥350", note: "" },
            { name: "オリーブ", price: "¥390", note: "" }
          ],
          notes: []
        },
        {
          id: "lunch-set-drink",
          title: "セットドリンク",
          items: [
            { name: "コカ・コーラ / ジンジャーエール / メロンソーダ / リンゴジュース", price: "", note: "" },
            { name: "ウーロン茶 / 紅茶（ホット・アイス） / コーヒー（ホット・アイス）", price: "", note: "" }
          ],
          notes: []
        }
      ]
    },
    {
      id: "dolce",
      navLabel: "スイーツ",
      title: "スイーツメニュー",
      label: "昼夜共通",
      icon: "fa-solid fa-ice-cream text-pink-600",
      theme: "pink",
      sections: [
        {
          id: "dolce-sweets",
          title: "スイーツ",
          items: [
            { name: "アイス（バニラ・チョコ）", price: "¥450", note: "" },
            { name: "季節のアイス（内容はおたずねください）", price: "¥490", note: "" },
            { name: "アフォガード", price: "¥690", note: "" },
            { name: "自家製コーヒーゼリー（丁寧にハンドドリップしたコーヒーで）", price: "¥540", note: "" },
            { name: "アイス乗せ コーヒーゼリー", price: "¥710", note: "" },
            { name: "自家製レアチーズプリン・キャラメリゼ・カラメルソース・ベリーソース", price: "¥600", note: "" }
          ],
          notes: ["店主一人の場合、ご提供まで時間を頂くことがあります。", "コーヒーゼリーやプリンは数量限定です。"]
        },
        {
          id: "dolce-parfait",
          title: "パフェ",
          items: [
            { name: "自家製コーヒーゼリーのパフェ", price: "¥790", note: "" },
            { name: "ミックスベリーパフェ", price: "¥790", note: "" },
            { name: "自家製プリンパフェ", price: "¥860", note: "" },
            { name: "ドリンクセット", price: "+¥300", note: "" },
            { name: "コーヒーみりんトッピング（アルコール）", price: "+¥150", note: "" }
          ],
          notes: ["セットドリンク: コーラ / ジンジャーエール / メロンソーダ / リンゴジュース / ウーロン茶 / 紅茶（ホット・アイス） / コーヒー（ホット・アイス）"]
        },
        {
          id: "dolce-float",
          title: "フロート",
          items: [
            { name: "クリームソーダ", price: "¥750", note: "" },
            { name: "コーラフロート", price: "¥750", note: "" },
            { name: "コーヒーフロート", price: "¥790", note: "" },
            { name: "ココアフロート", price: "¥830", note: "" }
          ],
          notes: []
        }
      ]
    },
    {
      id: "drink",
      navLabel: "ドリンク",
      title: "ドリンクメニュー",
      label: "昼夜共通",
      icon: "fa-solid fa-mug-saucer text-amber-700",
      theme: "amber",
      sections: [
        {
          id: "drink-hot-coffee",
          title: "ホットコーヒー",
          items: [
            { name: "ホットコーヒー", price: "¥550", note: "" },
            { name: "アメリカーノ", price: "¥550", note: "" },
            { name: "カフェ・ラテ", price: "¥690", note: "" },
            { name: "カプチーノ", price: "¥690", note: "" },
            { name: "フラットホワイト", price: "¥690", note: "" },
            { name: "ラテ・マキアート", price: "¥690", note: "" }
          ],
          notes: []
        },
        {
          id: "drink-tea-cocoa",
          title: "紅茶・ココア",
          items: [
            { name: "紅茶", price: "¥650", note: "" },
            { name: "ローズヒップティー", price: "¥700", note: "" },
            { name: "カモミールティー", price: "¥700", note: "" },
            { name: "ホットココア", price: "¥710", note: "" }
          ],
          notes: []
        },
        {
          id: "drink-hand-drip",
          title: "ハンドドリップコーヒー",
          items: [
            { name: "ブレンド", price: "¥710", note: "苦み、酸味、香り、コクのバランスが取れたブレンド" },
            { name: "ペルー", price: "¥710", note: "柔らかなコクと優しい苦みで深煎りが苦手な方にもおすすめ" },
            { name: "インド", price: "¥710", note: "深煎りのキレのある苦み、スパイス香" },
            { name: "季節限定（内容はおたずねください）", price: "¥750", note: "" }
          ],
          notes: []
        },
        {
          id: "drink-cold",
          title: "冷たいドリンク",
          items: [
            { name: "ハンドドリップ アイスコーヒー", price: "¥730", note: "" },
            { name: "アイスコーヒー", price: "¥550", note: "" },
            { name: "アイスティー", price: "¥650", note: "" },
            { name: "コカ・コーラ", price: "¥470", note: "" },
            { name: "ジンジャーエール", price: "¥470", note: "" },
            { name: "ドルチェポップ レモネード（約2杯分）", price: "¥930", note: "" },
            { name: "ノンアルコールビール キリン グリーンズフリー", price: "¥750", note: "" },
            { name: "スパークリングコーヒー", price: "¥720", note: "" },
            { name: "アイス カフェ・ラテ", price: "¥690", note: "" },
            { name: "アイスカプチーノ", price: "¥690", note: "" },
            { name: "アイスココア", price: "¥710", note: "" },
            { name: "メロンソーダ", price: "¥470", note: "" },
            { name: "カルピス", price: "¥470", note: "" },
            { name: "リンゴジュース", price: "¥470", note: "" },
            { name: "ウーロン茶", price: "¥470", note: "" }
          ],
          notes: []
        }
      ]
    },
    {
      id: "alcohol",
      navLabel: "お酒",
      title: "アルコールメニュー",
      label: "昼夜共通",
      icon: "fa-solid fa-wine-glass text-purple-600",
      theme: "purple",
      sections: [
        {
          id: "alcohol-beer",
          title: "ビール",
          items: [
            { name: "キリン一番搾り 中ジョッキ", price: "¥820", note: "" },
            { name: "ハートランド", price: "¥800", note: "" },
            { name: "クラフトビール（岩手県）", price: "¥1390", note: "ベアレン シュバルツ / ベアレン クラシック" }
          ],
          notes: []
        },
        {
          id: "alcohol-sour",
          title: "サワー",
          items: [
            { name: "レモン", price: "¥650", note: "" },
            { name: "レモン 無糖", price: "¥650", note: "" },
            { name: "グレープフルーツ", price: "¥650", note: "" },
            { name: "カシス", price: "¥650", note: "" },
            { name: "カルピス", price: "¥650", note: "" },
            { name: "はちみつレモン", price: "¥680", note: "" },
            { name: "ナガノパープル", price: "¥700", note: "" }
          ],
          notes: []
        },
        {
          id: "alcohol-whisky",
          title: "ウィスキー",
          items: [
            { name: "ティーチャーズ", price: "¥650", note: "" },
            { name: "デュワーズ", price: "¥670", note: "" },
            { name: "ジェムソン", price: "¥720", note: "" },
            { name: "陸", price: "¥750", note: "" },
            { name: "余市", price: "¥1230", note: "" },
            { name: "Enka特製 コーヒーウィスキー", price: "¥780", note: "" }
          ],
          notes: ["ロック / ストレート / ハイボールは各銘柄価格。コークハイ / ジンジャーハイは +¥50。", "トッピング: 燻製（スモークウィスキー） +¥150"]
        },
        {
          id: "alcohol-sake",
          title: "日本酒（一合）",
          items: [
            { name: "東光 超辛口純米吟醸（山形県）", price: "¥940", note: "" },
            { name: "百十郎 大辛口純米酒（岐阜県）", price: "¥810", note: "" },
            { name: "月山 芳醇辛口純米酒（島根県）", price: "¥810", note: "" }
          ],
          notes: []
        },
        {
          id: "alcohol-wine-other",
          title: "ワイン / その他",
          items: [
            { name: "赤 ボトル", price: "¥3700", note: "" },
            { name: "赤 グラス", price: "¥680", note: "" },
            { name: "白 ボトル", price: "¥3700", note: "" },
            { name: "白 グラス", price: "¥680", note: "" },
            { name: "スパークリングワイン（ボトルのみ）", price: "¥3900", note: "" },
            { name: "梅酒（ロック / 炭酸 / 水割り）", price: "¥600", note: "" }
          ],
          notes: []
        }
      ]
    },
    {
      id: "dinner",
      navLabel: "ディナー",
      title: "ディナーメニュー",
      label: "18:00〜23:00（料理ラストオーダー 22:00、ドリンクラストオーダー 22:30）",
      icon: "fa-solid fa-utensils text-emerald-700",
      theme: "emerald",
      sections: [
        {
          id: "dinner-main",
          title: "メイン料理",
          items: [
            { name: "牛肉100％ 店内仕込みバルダンゴ（チーズクリームソース）", price: "¥1540", note: "" },
            { name: "鴨肉のコンフィ", price: "¥1730", note: "コンフィは提供までお時間がかかります" }
          ],
          notes: []
        },
        {
          id: "dinner-smoke",
          title: "燻製料理",
          items: [
            { name: "日替わり 燻製盛り合わせ", price: "¥1530", note: "" },
            { name: "燻製盛り合わせ ハーフサイズ", price: "¥890", note: "" },
            { name: "燻製チーズのハチミツ掛け", price: "¥560", note: "" },
            { name: "燻製ポテトチップス", price: "¥480", note: "" },
            { name: "大人の駄菓子 ～瞬間燻製～", price: "¥480", note: "内容は日替わりです。" },
            { name: "燻製どんぐり（うずらの卵）", price: "¥470", note: "" },
            { name: "燻製ナッツ", price: "¥450", note: "" }
          ],
          notes: ["燻製盛り合わせは日により内容が変わります。内容はおたずねください。"]
        },
        {
          id: "dinner-gnocchi",
          title: "ニョッキ",
          items: [
            { name: "セミドライトマトのニョッキ", price: "¥1260", note: "" },
            { name: "チーズソースのニョッキ", price: "¥1320", note: "" }
          ],
          notes: []
        },
        {
          id: "dinner-ajillo",
          title: "アヒージョ",
          items: [
            { name: "ベーコンのアヒージョ", price: "¥650", note: "" },
            { name: "砂肝のアヒージョ", price: "¥650", note: "" },
            { name: "あさりアヒージョ", price: "¥600", note: "" },
            { name: "燻製チーズ", price: "¥250", note: "追加具材" },
            { name: "エビ", price: "¥250", note: "追加具材" },
            { name: "ジャガイモ", price: "¥200", note: "追加具材" },
            { name: "キノコ", price: "¥200", note: "追加具材" },
            { name: "ブロッコリー", price: "¥200", note: "追加具材" }
          ],
          notes: ["メインを1種類、追加具材を2〜3種類お選びください。アヒージョにバケットはついておりません。", "例: あさり+キノコ+ブロッコリー ¥1000〜 / ベーコン+ジャガイモ+ブロッコリー ¥1050〜 / 砂肝+エビ+ブロッコリー ¥1100〜"]
        },
        {
          id: "dinner-salad",
          title: "サラダ",
          items: [
            { name: "燻製ベーコンのシーザーサラダ（2〜3人前）", price: "¥1170", note: "" },
            { name: "気まぐれサラダ（2〜3人前）", price: "¥890", note: "" }
          ],
          notes: []
        },
        {
          id: "dinner-side",
          title: "サイドメニュー",
          items: [
            { name: "枝豆のペペロン炒め", price: "¥720", note: "" },
            { name: "枝豆のペペロン炒め 辛口", price: "¥720", note: "" },
            { name: "辛味+", price: "¥100", note: "" },
            { name: "バケット（4枚）", price: "¥380", note: "" },
            { name: "オリーブ", price: "¥400", note: "" }
          ],
          notes: ["辛味は別途お選びいただけます。"]
        }
      ]
    },
    {
      id: "takeaway",
      navLabel: "テイクアウト",
      title: "テイクアウトメニュー",
      label: "11:00〜15:30",
      icon: "fa-solid fa-bag-shopping text-orange-700",
      theme: "orange",
      sections: [
        {
          id: "takeaway-panini",
          title: "パニーニ",
          items: [
            { name: "燻製 鴨肉のロースト", price: "¥1100（ハーフサイズ ¥620）", note: "" },
            { name: "自家製燻製チーズとベーコン", price: "¥1140（ハーフサイズ ¥670）", note: "ソースなし -¥30" },
            { name: "スモークサーモンとクリームチーズ", price: "¥1210（ハーフサイズ ¥710）", note: "" },
            { name: "パニーニ（パンのみ／バター付き）", price: "¥590（ハーフサイズ ¥390）", note: "" },
            { name: "セットドリンク", price: "+¥400", note: "コカ・コーラ / ジンジャーエール / ウーロン茶 / コーヒー（ホット・アイス） / メロンソーダ / リンゴジュース / 紅茶（ホット・アイス +¥50）" }
          ],
          notes: ["テイクアウトはご注文をいただいてからお作りするため、少々お時間をいただく場合がございます。"]
        },
        {
          id: "takeaway-drink",
          title: "ドリンク",
          items: [
            { name: "ホットコーヒー", price: "¥580", note: "" },
            { name: "アイスコーヒー", price: "¥580", note: "" },
            { name: "紅茶", price: "¥680", note: "" },
            { name: "アイスティー", price: "¥680", note: "" },
            { name: "カフェ・ラテ", price: "¥720", note: "" },
            { name: "アイス カフェ・ラテ", price: "¥720", note: "" },
            { name: "コカ・コーラ", price: "¥500", note: "" },
            { name: "ジンジャーエール", price: "¥500", note: "" },
            { name: "メロンソーダ", price: "¥500", note: "" },
            { name: "リンゴジュース", price: "¥500", note: "" },
            { name: "ウーロン茶", price: "¥500", note: "" }
          ],
          notes: []
        }
      ]
    }
  ]
};
