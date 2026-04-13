# MediaPatchController テストケース

## テスト観点
- 正常系: 有効入力で `200 + { code: 0 }`。
- バリデーション異常: 不正入力時は `400 + { message: 'Bad Request' }`。
- サービス例外: 例外時は `500 + { message: 'Internal Server Error' }`。

## 正常系
### mediaId・title・tags・contentIdsを使ってメディア更新に成功する
- **前提**: `mediaId/title/tags/contentIds` が有効。
- **結果**:
  - `UpdateMediaServiceInput` を生成して `UpdateMediaService.execute` を呼ぶ。
  - `200` と `{ "code": 0 }` を返す。

### priorityCategoriesはtags.categoryの出現順で重複なく生成される
- **前提**: `tags` に同一 category を複数含む。
- **結果**: `priorityCategories` は出現順重複除去となる。

## 異常系
### UpdateMediaServiceが失敗した場合は500を返す
- **前提**: 入力は有効、`UpdateMediaService.execute` が例外を送出。
- **結果**: `500` と `{ "message": "Internal Server Error" }` を返す。

### 入力不正の場合は400を返す
- **対象**: `mediaId` 未設定/空文字、`title` 空文字/型不正、`tags` 未設定/型不正/要素不正、`contentIds` 未設定/空配列/重複。
- **結果**:
  - `UpdateMediaService` を呼び出さない。
  - `400` と `{ "message": "Bad Request" }` を返す。
