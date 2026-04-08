# MediaPostController

## 概要
- `POST /api/media` を受け取り、`RegisterMediaService` へ委譲する。
- 認証・CSRF検証・コンテンツ保存は前段ミドルウェアで完了している前提。

## バリデーション
- `title`: 非空 `string`
- `tags`: `{ category, label }` の配列
- `contentIds` (`req.context.contentIds`): 1件以上・非空文字・重複なし

## レスポンス仕様
- 成功: `200 + { code: 0, mediaId }`
- 入力不正: `400 + { message: 'Bad Request' }`
- 例外: `500 + { message: 'Internal Server Error' }`

## 関連
- [Controllerテストケース](/doc/5_api/controller/api/MediaPostController/testcase.medium.md)
