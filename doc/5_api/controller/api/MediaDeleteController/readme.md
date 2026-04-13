# MediaDeleteController

## 概要
- `DELETE /api/media/:mediaId` を受け取り、`DeleteMediaService` へ委譲する。
- 認証・CSRF検証は前段ミドルウェアで完了している前提。

## バリデーション
- `mediaId`: 非空 `string`

## レスポンス仕様
- 成功: `200 + { code: 0 }`
- 入力不正: `400 + { message: 'Bad Request' }`
- 例外: `500 + { message: 'Internal Server Error' }`

## 関連
- [Controllerテストケース](/doc/5_api/controller/api/MediaDeleteController/testcase.medium.md)
