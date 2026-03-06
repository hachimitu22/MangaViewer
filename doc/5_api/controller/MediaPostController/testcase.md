# MediaPostController テストケース

## テストケース一覧
- [ミドルウェアで設定されたcontentIdsを使ってメディア登録に成功する](#ミドルウェアで設定されたcontentidsを使ってメディア登録に成功する)
- [tags未指定null含むでもメディア登録に成功する](#tags未指定null含むでもメディア登録に成功する)
- [tagsが空配列でもメディア登録に成功する](#tagsが空配列でもメディア登録に成功する)
- [重複タグを含んでもメディア登録に成功する](#重複タグを含んでもメディア登録に成功する)
- [RegisterMediaServiceが失敗した場合はcode=1を返す](#registermediaserviceが失敗した場合はcode1を返す)
- [titleが空文字の場合は登録失敗を返す](#titleが空文字の場合は登録失敗を返す)
- [tags配列要素がnullの場合は登録失敗を返す](#tags配列要素がnullの場合は登録失敗を返す)
- [tagsのcategoryが空文字の場合は登録失敗を返す](#tagsのcategoryが空文字の場合は登録失敗を返す)
- [tagsのlabelが空文字の場合は登録失敗を返す](#tagsのlabelが空文字の場合は登録失敗を返す)
- [contentIdsが未設定の場合は登録失敗を返す](#contentidsが未設定の場合は登録失敗を返す)
- [contentIdsが空配列の場合は登録失敗を返す](#contentidsが空配列の場合は登録失敗を返す)
- [contentIdsの順序を維持して処理される](#contentidsの順序を維持して処理される)
- [contentIdsの型不正時は登録失敗を返す](#contentidsの型不正時は登録失敗を返す)
- [想定外例外発生時も失敗レスポンス形式を維持する](#想定外例外発生時も失敗レスポンス形式を維持する)

---

## 正常系

### ミドルウェアで設定されたcontentIdsを使ってメディア登録に成功する

- **前提**
  - `title` が空文字ではない。
  - `tags` が指定される場合、各要素の `category` / `label` は空文字ではない。
  - リクエストコンテキストに1件以上の `contentIds` が設定されている。
  - `RegisterMediaService` が成功し `mediaId` を返す。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` に `title` / `tags` / `contentIds` を渡して呼び出す。
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

### tags未指定null含むでもメディア登録に成功する

- **前提**
  - `title` が空文字ではない。
  - `tags` は未指定（`null` を含む）である。
  - リクエストコンテキストに1件以上の `contentIds` が設定されている。
  - `RegisterMediaService` が成功する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

### tagsが空配列でもメディア登録に成功する

- **前提**
  - `title` が空文字ではない。
  - `tags` は空配列である。
  - リクエストコンテキストに1件以上の `contentIds` が設定されている。
  - `RegisterMediaService` が成功する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

### 重複タグを含んでもメディア登録に成功する

- **前提**
  - 同一 `category` + `label` のタグ重複を含む。
  - 各タグの `category` / `label` は空文字ではない。
  - リクエストコンテキストに1件以上の `contentIds` が設定されている。
  - `RegisterMediaService` は成功する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

## 異常系

### RegisterMediaServiceが失敗した場合はcode=1を返す

- **前提**
  - リクエストコンテキストに1件以上の `contentIds` が設定されている。
  - `RegisterMediaService` が失敗を返す。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### titleが空文字の場合は登録失敗を返す

- **前提**
  - `title` が空文字である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### tags配列要素がnullの場合は登録失敗を返す

- **前提**
  - `tags` 配列の要素に `null` が含まれる。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### tagsのcategoryが空文字の場合は登録失敗を返す

- **前提**
  - `tags[0].category` が空文字である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### tagsのlabelが空文字の場合は登録失敗を返す

- **前提**
  - `tags[0].label` が空文字である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### contentIdsが未設定の場合は登録失敗を返す

- **前提**
  - リクエストコンテキストに `contentIds` が設定されていない。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### contentIdsが空配列の場合は登録失敗を返す

- **前提**
  - リクエストコンテキストの `contentIds` が空配列である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### contentIdsの順序を維持して処理される

- **前提**
  - リクエストコンテキストに順序付きの `contentIds` が設定されている。
  - `RegisterMediaService` は受け取った順序を維持して処理する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` に `contentIds` が順序を保持したまま渡される。

---

### contentIdsの型不正時は登録失敗を返す

- **前提**
  - `contentIds` が配列ではない、または要素型が不正である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。

---

### 想定外例外発生時も失敗レスポンス形式を維持する

- **前提**
  - Controller内部で想定外例外が発生する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となる。
