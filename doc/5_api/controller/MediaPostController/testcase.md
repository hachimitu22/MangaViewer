# MediaPostController テストケース

## テストケース一覧
- [contentIdsを使ってメディア登録に成功する](#contentidsを使ってメディア登録に成功する)
- [tagsが空配列でもメディア登録に成功する](#tagsが空配列でもメディア登録に成功する)
- [重複タグを含んでもメディア登録に成功する](#重複タグを含んでもメディア登録に成功する)
- [contentIdsの順序を維持して処理される](#contentidsの順序を維持して処理される)
- [RegisterMediaServiceが失敗した場合はcode=1を返す](#registermediaserviceが失敗した場合はcode1を返す)
- [titleが空文字の場合は登録失敗を返す](#titleが空文字の場合は登録失敗を返す)
- [titleがstring以外の場合は登録失敗を返す](#titleがstring以外の場合は登録失敗を返す)
- [tagsが未設定の場合は登録失敗を返す](#tagsが未設定の場合は登録失敗を返す)
- [tagsが配列以外の場合は登録失敗を返す](#tagsが配列以外の場合は登録失敗を返す)
- [tags配列要素がnullの場合は登録失敗を返す](#tags配列要素がnullの場合は登録失敗を返す)
- [tags配列要素がオブジェクト以外の場合は登録失敗を返す](#tags配列要素がオブジェクト以外の場合は登録失敗を返す)
- [tagsのcategoryがstring以外の場合は登録失敗を返す](#tagsのcategoryがstring以外の場合は登録失敗を返す)
- [tagsのcategoryが空文字の場合は登録失敗を返す](#tagsのcategoryが空文字の場合は登録失敗を返す)
- [tagsのlabelがstring以外の場合は登録失敗を返す](#tagsのlabelがstring以外の場合は登録失敗を返す)
- [tagsのlabelが空文字の場合は登録失敗を返す](#tagsのlabelが空文字の場合は登録失敗を返す)
- [contentIdsが未設定の場合は登録失敗を返す](#contentidsが未設定の場合は登録失敗を返す)
- [contentIdsが配列以外の場合は登録失敗を返す](#contentidsが配列以外の場合は登録失敗を返す)
- [contentIdsが空配列の場合は登録失敗を返す](#contentidsが空配列の場合は登録失敗を返す)
- [contentIds要素がstring以外の場合は登録失敗を返す](#contentids要素がstring以外の場合は登録失敗を返す)
- [contentIds要素が空文字の場合は登録失敗を返す](#contentids要素が空文字の場合は登録失敗を返す)
- [contentIdsに重複がある場合は登録失敗を返す](#contentidsに重複がある場合は登録失敗を返す)
- [想定外例外発生時も失敗レスポンス形式を維持する](#想定外例外発生時も失敗レスポンス形式を維持する)

---

## 正常系

### contentIdsを使ってメディア登録に成功する

- **前提**
  - `title` は `string` かつ空文字ではない。
  - `tags` は配列であり、要素数は0以上である。
  - `tags` 指定時は各要素が `{ category: string, label: string }` であり、`category` / `label` は空文字ではない。
  - `contentIds` は1件以上で、各要素は `string` かつ空文字ではない（要素数1以上）。
  - `contentIds` に重複はない。
  - `RegisterMediaService` が成功し `mediaId` を返す。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` に `title` / `tags` / `contentIds` を渡して呼び出す。
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

### tagsが空配列でもメディア登録に成功する

- **前提**
  - `title` は `string` かつ空文字ではない。
  - `tags` は空配列（要素数0）である。
  - `contentIds` は1件以上で、各要素は `string` かつ空文字ではない（要素数1以上）。
  - `contentIds` に重複はない。
  - `RegisterMediaService` が成功する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

### 重複タグを含んでもメディア登録に成功する

- **前提**
  - `title` は `string` かつ空文字ではない。
  - 同一 `category` + `label` のタグ重複を含む。
  - 各タグの `category` / `label` は `string` かつ空文字ではない。
  - `contentIds` は1件以上で、各要素は `string` かつ空文字ではない（要素数1以上）。
  - `contentIds` に重複はない。
  - `RegisterMediaService` は成功する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディに `code: 0` と `mediaId` を含む。

---

### contentIdsの順序を維持して処理される

- **前提**
  - 順序付きの `contentIds` が設定されている。
  - `contentIds` の順序は `contents[n].position` の順序と一致している。
  - `RegisterMediaService` は受け取った順序を維持して処理する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` に `contentIds` が順序を保持したまま渡される。

---

## 異常系

### RegisterMediaServiceが失敗した場合はcode=1を返す

- **前提**
  - 入力値はすべて有効である。
  - `RegisterMediaService` が失敗を返す。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### titleが空文字の場合は登録失敗を返す

- **前提**
  - `title` が空文字である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### titleがstring以外の場合は登録失敗を返す

- **前提**
  - `title` が `string` 以外（`null` / `number` / `array` など）である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tagsが未設定の場合は登録失敗を返す

- **前提**
  - `tags` が未設定である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tagsが配列以外の場合は登録失敗を返す

- **前提**
  - `tags` が配列以外（`string` / `object` / `number` など）である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tags配列要素がnullの場合は登録失敗を返す

- **前提**
  - `tags` 配列の要素に `null` が含まれる。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tags配列要素がオブジェクト以外の場合は登録失敗を返す

- **前提**
  - `tags` 配列の要素に `string` / `number` などオブジェクト以外が含まれる。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tagsのcategoryがstring以外の場合は登録失敗を返す

- **前提**
  - `tags[0].category` が `string` 以外である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tagsのcategoryが空文字の場合は登録失敗を返す

- **前提**
  - `tags[0].category` が空文字である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tagsのlabelがstring以外の場合は登録失敗を返す

- **前提**
  - `tags[0].label` が `string` 以外である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### tagsのlabelが空文字の場合は登録失敗を返す

- **前提**
  - `tags[0].label` が空文字である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### contentIdsが未設定の場合は登録失敗を返す

- **前提**
  - `contentIds` が設定されていない。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### contentIdsが配列以外の場合は登録失敗を返す

- **前提**
  - `contentIds` が配列以外（`string` / `object` / `number` など）である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### contentIdsが空配列の場合は登録失敗を返す

- **前提**
  - `contentIds` が空配列（要素数0）である。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### contentIds要素がstring以外の場合は登録失敗を返す

- **前提**
  - `contentIds` の要素に `string` 以外（`null` / `number` / `object` など）が含まれる。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### contentIds要素が空文字の場合は登録失敗を返す

- **前提**
  - `contentIds` の要素に空文字が含まれる。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### contentIdsに重複がある場合は登録失敗を返す

- **前提**
  - `contentIds` が同一要素を複数含む。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - `RegisterMediaService` を呼び出さない。
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。

---

### 想定外例外発生時も失敗レスポンス形式を維持する

- **前提**
  - Controller内部で想定外例外が発生する。
- **操作**
  - `MediaPostController` を実行する。
- **結果**
  - HTTPステータス `200` を返す。
  - レスポンスボディは `code: 1` となり、`mediaId` を含まない。
