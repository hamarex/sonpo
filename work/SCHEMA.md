# data.js スキーマ（参考アプリ ~/develop/gaimuin/docs/data.js 踏襲）

※ 参考アプリは `gaimuin/app/` ではなく `gaimuin/docs/`（index.html, logic.js, data.js）に実在した。
最終 data.js は `window.DATA = { "chapters": [ Chapter, ... ] };`（JSON互換）。

## 分割ルール（part_N.js）
各 `work/part_N.js` は **章オブジェクトの配列** を CommonJS で出力する:
    module.exports = [ Chapter, Chapter, ... ];
（JSON互換のリテラルで。関数・コメント不要。コメントを書くなら通常のJSコメントでよい）
結合時に chapters を `no` 昇順に並べる。章番号と担当（暫定。変更時は連絡）:

| part | 章no | 章タイトル（暫定） | 区分 |
|---|---|---|---|
| part_1 | 1 損害保険の基本（保険の仕組み・損害保険の種類・約款/商品概論） / 2 保険業法・募集規制・コンプライアンス（募集コンプライアンス、個人情報保護、反社排除、保険法 等） | 基礎単位 |
| part_2 | 3 自動車保険（自賠責・任意保険・対人/対物/人身傷害/車両・等級・ノンフリート） | 商品単位 |
| part_3 | 4 火災保険 / 5 地震保険 | 商品単位 |
| part_4 | 6 傷害・疾病保険（傷害保険・医療保険・所得補償 等）/ 7 賠償責任保険・その他（海上・新種・個人賠償・PL・サイバー 等） | 商品単位 |

## Chapter
```
{
  no: 1,                       // number、章番号（上表）
  title: "章タイトル",
  headingCount: 0,             // number（UI未使用。lessons[].sections の総数でよい）
  basePages: 0,                // number（UI未使用。pages の総数でよい）
  lessons: [ Lesson, ... ],    // 各章 3〜6レッスン程度
  ox:  [ Ox, ... ],            // ○×問題（章末テスト＆模擬試験＆ページ内クイズ）
  mc:  [ Mc, ... ]             // 五肢選択（章末テスト＆模擬試験）
}
```

## Lesson
```
{
  id: "c01-l01",               // "c" + 章2桁 + "-l" + 連番2桁
  title: "レッスン名",
  sections: ["見出し1", "見出し2", ...],   // string[]（= pages[].title と同順）
  html: "<h4>見出し1</h4>...",             // string、全ページ本文の連結（見出し <h4> 付き）。レッスン全文
  pages: [ Page, ... ]
}
```
## Page
```
{
  id: "c01-l01-p01",           // lessonId + "-p" + 連番2桁
  title: "見出し1",
  cont: false,                 // boolean（長い節の続きページなら true。通常 false）
  html: "<ul><li><b class=\"key\">重要語</b>…</li></ul>",   // 本文HTML（<h4>は含めない）
  oxIds: ["c01-ox-01","c01-ox-02"]  // string[]、このページ直後に出す確認クイズ（Ox.id）。無ければ []
}
```
- 使えるHTMLタグ: h4/h5/p/ul/li/b/table/tr/th/td/br。強調は `<b class="key">重要語</b>`、ひっかけは `<b class="trap">…</b>`。
- 本文に `<script>` や外部リソースは禁止。

## Ox（○×）
```
{
  id: "c01-ox-01",             // "c" + 章2桁 + "-ox-" + 章内連番2桁以上（章内で一意）
  text: "問題文（1文）。",
  answer: true,                // boolean（true=○）
  explain: "解説1文（HTML可）", // string
  sec: "見出し1",               // string、所属ページ/節の title（= Page.title と完全一致）
  lesson: "c01-l01"            // string、所属レッスンID
}
```
- 各 Ox は、sec に一致する Page の oxIds に必ず含める（Page.oxIds ⇔ Ox の対応を保つ）。
- ○と×のバランスは概ね半々。

## Mc（五肢選択・組合せ型/正誤型）
```
{
  id: "c01-mc-01",             // "c" + 章2桁 + "-mc-" + 章内連番2桁以上
  stem: "【組合せ型】… 正しいものの組合せとして正しいものはどれか。",
  items: [ {label:"イ", text:"…"}, {label:"ロ", text:"…"}, {label:"ハ", text:"…"}, {label:"ニ", text:"…"} ],  // 通常4つ（イロハニ）。単純択一なら items は [] 可
  choices: ["イ・ロ","イ・ハ","ロ・ハ","ロ・ニ","ハ・ニ"],   // **ちょうど5つ**（string[]）
  answer: 4,                   // number、**1始まり**の正解番号（1〜5。choices[answer-1] が正解。例: 上の例は "ロ・ニ"）
  explain: ["イ：× 理由","ロ：○ 理由", ...],   // string[]（HTML可）。items と同順で 1項目1要素。items 空なら解説文を1〜2要素
  tip: "試験でのコツ・消去法（1文。無ければ空文字 \"\" ）"
}
```
- 章ごとの目安: Ox 60〜120問、Mc 8〜10問（模擬試験は全章からOx40問+Mc10問を章比例で抽出）。
- Ox/Mc とも ID は全体で重複禁止。文字列内の `"` はエスケープ。
- 事実は最新の法令・約款・協会資料に基づき、断定できない数値は避けるか注記する。

## 検証
`node work/validate.js`（作成予定）で、重複ID・必須フィールド・型・choices長=5・answer範囲(1〜5)・oxIds⇔Ox整合・sec一致 を検査する。
`node work/validate.js work/part_1.js` のように単体でも検査可能にする。
