# ImportZipsPolicy テストケース（medium）

## 目的
- `ImportZips` CLI から `ImportZipsPolicy` の公開APIを利用したとき、
  判定仕様（拡張子/zip判定/終了コード）がアプリ統合文脈でも崩れないことを確認する。
- pure function の単体保証（small）だけでなく、呼び出し側のI/Oを含む実行経路で
  期待どおりの結果になることを担保する。

## テスト観点

### M-POLICY-01: ImportZips経路で`.jpg/.jpeg/.png/.gif/.webp`のみが画像として扱われる
- **前提**
  - 対象zip直下に `a.JPG`, `b.jpeg`, `c.png`, `d.gif`, `e.webp`, `f.bmp` を配置する。
- **操作**
  1. `npm run import -- <fixtureDir>` を実行する。
  2. ログと登録content件数を取得する。
- **期待結果**
  - `.JPG/.jpeg/.png/.gif/.webp` の5件が対象として処理される。
  - `.bmp` は非対応拡張子として無視される。
  - 成功時ログに登録content件数 `5` が記録される。

### M-POLICY-02: zip拡張子判定は大文字小文字非区別で適用される
- **前提**
  - `A.zip`, `B.ZIP`, `C.ZiP`, `D.txt` が同一ディレクトリ直下に存在する。
- **操作**
  - `npm run import -- <fixtureDir>` を実行する。
- **期待結果**
  - `A/B/C` は処理対象となる。
  - `D.txt` はスキップログが出力される。

### M-POLICY-03: 成功件数/失敗件数の集計から終了コードが決定される
- **前提**
  - 1件成功zip、1件失敗zip（破損画像を含む）を同一ディレクトリに配置する。
- **操作**
  - `npm run import -- <fixtureDir>` を実行し、プロセス終了コードを確認する。
- **期待結果**
  - 終了コードが `1`（一部成功）になる。
  - サマリに成功件数1/失敗件数1が出力される。

---

## medium テスト方針
- ログは全文一致ではなく、`zipファイル名`・`結果`・`理由`・`登録content件数` の主要項目を検証する。
- fixture は `__tests__/fixtures/importZips/` 配下を利用し、同一fixtureを ImportZips の medium/large と共有可能にする。
- small で検証済みの pure logic を重複検証しすぎず、「CLI 経由で呼ばれたとき壊れないか」を優先する。
