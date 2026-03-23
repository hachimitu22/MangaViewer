# MediaPatchController テストケース

## テスト観点
- 正常系: 有効な `mediaId` / `title` / `tags` / `contentIds` で `code=0` を返す。
- 入力不備: 各入力値の不足・型不正・重複時はサービスを呼ばず `code=1` を返す。
- サービス失敗: `UpdateMediaService` 例外時は `code=1` を返す。
- 想定外例外: 失敗レスポンス形式を維持する。

## 正常系

### mediaId・title・tags・contentIdsを使ってメディア更新に成功する
- **前提**
  - `mediaId` と `title` が空文字ではない `string`。
  - `tags` が妥当な `{ category, label }` 配列である。
  - `contentIds` が1件以上の重複しない `string` 配列である。
  - `UpdateMediaService.execute` が正常終了する。
- **操作**
  - `MediaPatchController.execute` を実行する。
- **結果**
  - `UpdateMediaServiceInput` に `id` / `title` / `contents` / `tags` / `priorityCategories` を設定してサービスを呼び出す。
  - HTTPステータス `200` と `{"code":0}` を返す。

### priorityCategoriesはtags.categoryの出現順で重複なく生成される
- **前提**
  - `tags` に同一 `category` を複数回含む。
- **操作**
  - `MediaPatchController.execute` を実行する。
- **結果**
  - `priorityCategories` は `tags.category` を先頭から見た順で重複除去した配列となる。

## 異常系

### UpdateMediaServiceが失敗した場合はcode=1を返す
- **前提**
  - 入力値はすべて有効である。
  - `UpdateMediaService.execute` が例外を送出する。
- **操作**
  - `MediaPatchController.execute` を実行する。
- **結果**
  - HTTPステータス `200` と `{"code":1}` を返す。

### mediaIdが未設定の場合は更新失敗を返す
### mediaIdが空文字の場合は更新失敗を返す
### titleが空文字の場合は更新失敗を返す
### titleがstring以外の場合は更新失敗を返す
### tagsが未設定の場合は更新失敗を返す
### tagsが配列以外の場合は更新失敗を返す
### tags配列要素がnullの場合は更新失敗を返す
### tagsのcategoryが空文字の場合は更新失敗を返す
### tagsのlabelが空文字の場合は更新失敗を返す
### contentIdsが未設定の場合は更新失敗を返す
### contentIdsが空配列の場合は更新失敗を返す
### contentIdsに重複がある場合は更新失敗を返す
- **前提**
  - 見出しに記載した不正入力が存在する。
- **操作**
  - `MediaPatchController.execute` を実行する。
- **結果**
  - `UpdateMediaService` を呼び出さない。
  - HTTPステータス `200` と `{"code":1}` を返す。

### 想定外例外発生時も失敗レスポンス形式を維持する
- **前提**
  - Controller内部で想定外例外が発生する。
- **操作**
  - `MediaPatchController.execute` を実行する。
- **結果**
  - 例外を外へ送出せず、HTTPステータス `200` と `{"code":1}` を返す。
