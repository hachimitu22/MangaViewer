# ImportZips テストケース（small）

## 目的
- `ImportZips` のオーケストレーションロジックを small で高速に検証し、
  medium/e2e でしか検出できない回帰の混入を防ぐ。
- 依存（`fileAccess` / `zipHandler` / `contentStorage` / `registerMediaService` / `logger`）をモック化し、
  1テスト1振る舞いで終了コード・呼び出し契約・継続制御を観測可能にする。

## 対象
- 事前チェック失敗時の即時終了
- zip 0件時の正常終了
- zip内画像の抽出と basename 自然順登録
- 画像0件zipの失敗継続
- zip処理例外時の失敗継続

---

## テストケース一覧
- [S-IMP-01: 事前チェック失敗時は終了コード3/4を返しzip処理を開始しない](#s-imp-01-事前チェック失敗時は終了コード34を返しzip処理を開始しない)
- [S-IMP-02: zipが0件なら終了コード0を返す](#s-imp-02-zipが0件なら終了コード0を返す)
- [S-IMP-03: zip内の有効画像をbasename自然順で登録し成功をカウントする](#s-imp-03-zip内の有効画像をbasename自然順で登録し成功をカウントする)
- [S-IMP-04: 有効画像が0件のzipは失敗として継続する](#s-imp-04-有効画像が0件のzipは失敗として継続する)
- [S-IMP-05: zip処理で例外が発生しても失敗として継続する](#s-imp-05-zip処理で例外が発生しても失敗として継続する)

---

## ケース詳細

### S-IMP-01: 事前チェック失敗時は終了コード3/4を返しzip処理を開始しない
- **前提**
  - `inspectTarget` が `{ ok: false }` 相当（例: `missing-arg`）を返す状態。
- **操作**
  - `ImportZips.execute(new Query({ targetDir }))` を実行する。
- **期待結果**
  - 終了コード `3`（または条件に応じて `4`）を返す。
  - `listDirectEntries` は呼び出されない。
  - 事前チェック失敗ログが出力される。

### S-IMP-02: zipが0件なら終了コード0を返す
- **前提**
  - 直下エントリが非zipのみ（例: `README.md`, ディレクトリ）。
- **操作**
  - `ImportZips.execute(...)` を実行する。
- **期待結果**
  - 終了コード `0` を返す。
  - `successCount=0`, `failureCount=0`, `totalZipCount=0`。
  - 非zipスキップログが出力される。

### S-IMP-03: zip内の有効画像をbasename自然順で登録し成功をカウントする
- **前提**
  - `my.book.v1.zip` に `10.jpeg`, `2.jpeg`, `1.jpeg`（直下画像）と非対象エントリが混在する。
- **操作**
  - `ImportZips.execute(...)` を実行する。
- **期待結果**
  - `contentStorage.saveFromZipEntries` が `['1.jpeg','2.jpeg','10.jpeg']` の順で呼ばれる。
  - `registerMediaService.execute` の title が `my.book.v1` になる。
  - 処理結果は `successCount=1`, `failureCount=0`, `exitCode=0`。

### S-IMP-04: 有効画像が0件のzipは失敗として継続する
- **前提**
  - 先頭zipは非画像のみ、後続zipは成功可能な画像を含む。
- **操作**
  - `ImportZips.execute(...)` を実行する。
- **期待結果**
  - 先頭zipは失敗として `failureCount` が増える。
  - 後続zipの処理は継続される。
  - 全体結果は一部成功（`exitCode=1`）となる。

### S-IMP-05: zip処理で例外が発生しても失敗として継続する
- **前提**
  - 先頭zipで `zipHandler.listEntries` が例外を投げ、後続zipは成功可能。
- **操作**
  - `ImportZips.execute(...)` を実行する。
- **期待結果**
  - 例外zipは失敗カウントされ、エラーログが出力される。
  - 後続zipは継続実行される。
  - 全体結果は一部成功（`exitCode=1`）となる。

---

## 関連ドキュメント
- [ImportZips 設計書](/doc/4_application/app/ImportZips/readme.md)
- [ImportZipsPolicy 設計書](/doc/4_application/app/ImportZipsPolicy/readme.md)
- [ImportZips テストケース（medium）](/doc/4_application/app/ImportZips/testcase.medium.md)
- [ImportZips テストケース（large）](/doc/4_application/app/ImportZips/testcase.large.md)
