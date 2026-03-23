# MediaDeleteController

## 概要
- `DELETE /api/media/:mediaId` のHTTPリクエストを受け取り、メディア削除処理を `DeleteMediaService` へ委譲する。
- パスパラメータ `req.params.mediaId` を検証し、妥当な場合のみ `DeleteMediaServiceInput` を生成して `execute` を呼び出す。
- 成功時は `code: 0`、入力不備・サービス失敗・想定外例外時は `code: 1` を返す。

## 対象API
- `DELETE /api/media/:mediaId`

## 責務
- 削除対象 `mediaId` の入力検証を行う。
- `DeleteMediaService` に渡す入力DTOを生成する。
- 削除結果を HTTP `200` の JSON レスポンスへ整形する。

## 入力パラメータ
| 項目 | 取得元 | 型 | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `mediaId` | `req.params.mediaId` | `string` | 必須 | 削除対象メディアID。空文字不可。 |

## バリデーション
- `mediaId` は `string` かつ空文字以外であること。
- 不正な場合は `DeleteMediaService` を呼び出さず失敗レスポンスを返す。

## 依存する application service
- [DeleteMediaService](/doc/4_application/media/command/DeleteMediaService/readme.md)
  - `DeleteMediaServiceInput`: `id` を保持する入力DTO。

## 成功時レスポンス
- 条件: `DeleteMediaService.execute` が正常終了する。
- HTTPステータス: `200`
- ボディ:

```json
{
  "code": 0
}
```

## 失敗時レスポンス
- `mediaId` 入力不備時: HTTP `200` + `{ "code": 1 }`
- `DeleteMediaService.execute` 失敗時: HTTP `200` + `{ "code": 1 }`

## 例外時の振る舞い
- `DeleteMediaService.execute` が例外を送出した場合は `catch` し、HTTP `200` + `{ "code": 1 }` を返す。
- DTO生成やレスポンス組み立て中の想定外例外も同じ失敗レスポンスに正規化する。

## 関連ドキュメント
- [Controllerテストケース](/doc/5_api/controller/api/MediaDeleteController/testcase.md)
