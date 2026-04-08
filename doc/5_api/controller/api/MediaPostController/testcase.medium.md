# MediaPostController テストケース

## テスト観点
- 正常系: 有効入力で `200 + { code: 0, mediaId }`。
- バリデーション異常: 不正入力時は `400 + { message: 'Bad Request' }`。
- サービス例外: 例外時は `500 + { message: 'Internal Server Error' }`。

## 正常系
### contentIdsを使ってメディア登録に成功する
- **前提**: `title/tags/contentIds` が有効。
- **結果**:
  - `RegisterMediaService` に `title/tags/contentIds/priorityCategories` を渡す。
  - `200` と `{ "code": 0, "mediaId": "..." }` を返す。

### tagsが空配列でもメディア登録に成功する
- **結果**: `200` と `{ "code": 0, "mediaId": "..." }` を返す。

### 重複タグを含んでもメディア登録に成功する
- **結果**: `priorityCategories` は category の出現順重複除去。

### contentIdsの順序を維持して処理される
- **結果**: `RegisterMediaService` へ順序を維持して渡す。

## 異常系
### RegisterMediaServiceが失敗した場合は500を返す
- **前提**: 入力は有効、サービスが例外送出。
- **結果**: `500` と `{ "message": "Internal Server Error" }` を返す。

### 入力不正の場合は400を返す
- **対象**: `title` 空文字/型不正、`tags` 未設定/型不正/要素不正、`contentIds` 未設定/型不正/空配列/要素不正/重複。
- **結果**:
  - `RegisterMediaService` を呼び出さない。
  - `400` と `{ "message": "Bad Request" }` を返す。

### 想定外例外発生時は500を返す
- **結果**: `500` と `{ "message": "Internal Server Error" }` を返す。
