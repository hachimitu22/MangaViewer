# MediaPatchController

## 概要
- `PATCH /api/media/:mediaId` のHTTPリクエストを受け取り、メディア更新処理を `UpdateMediaService` へ委譲する。
- `req.params.mediaId`、`req.body.title`、`req.body.tags`、`req.context.contentIds` を検証し、妥当な場合のみ `UpdateMediaServiceInput` を生成して `execute` を呼び出す。
- `priorityCategories` は `tags[n].category` を先頭から見た出現順で重複除去して生成する。
- 入力不備、サービス失敗、想定外例外はすべて HTTP `200` + `code: 1` で返す。

## 対象API
- `PATCH /api/media/:mediaId`

## 責務
- 更新API入力の妥当性確認を行う。
- `UpdateMediaServiceInput` に `id` / `title` / `contents` / `tags` / `priorityCategories` を設定する。
- 更新結果を HTTP `200` の JSON `{ code }` へ変換する。

## 入力パラメータ
| 項目 | 取得元 | 型 | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `mediaId` | `req.params.mediaId` | `string` | 必須 | 更新対象メディアID。空文字不可。 |
| `title` | `req.body.title` | `string` | 必須 | 更新後タイトル。空文字不可。 |
| `tags` | `req.body.tags` | `Array<object>` | 必須 | `{ category, label }` 配列。空配列は許可。 |
| `contentIds` | `req.context.contentIds` | `Array<string>` | 必須 | 紐付けるコンテンツID配列。1件以上、重複不可。 |

## バリデーション
- `mediaId` は `string` かつ空文字以外であること。
- `title` は `string` かつ空文字以外であること。
- `tags` は配列であること。
- `tags` の各要素はオブジェクトであり、`category` / `label` がともに `string` かつ空文字以外であること。
- `contentIds` は配列であり、1件以上含むこと。
- `contentIds` の各要素は `string` かつ空文字以外であること。
- `contentIds` は重複を許可しない。
- いずれかを満たさない場合は `UpdateMediaService` を呼び出さず失敗レスポンスを返す。

## 依存する application service
- [UpdateMediaService](/doc/4_application/media/command/UpdateMediaService/readme.md)
  - `UpdateMediaServiceInput`: `id` / `title` / `contents` / `tags` / `priorityCategories` を保持する入力DTO。

## 成功時レスポンス
- 条件: `UpdateMediaService.execute` が正常終了する。
- HTTPステータス: `200`
- ボディ:

```json
{
  "code": 0
}
```

## 失敗時レスポンス
- 入力不備時: HTTP `200` + `{ "code": 1 }`
- `UpdateMediaService.execute` 失敗時: HTTP `200` + `{ "code": 1 }`

## 例外時の振る舞い
- `UpdateMediaService.execute` が例外を送出した場合は `catch` し、HTTP `200` + `{ "code": 1 }` を返す。
- `priorityCategories` 生成や入力DTO生成中の想定外例外も外へ送出せず、失敗レスポンスへ変換する。

## 関連ドキュメント
- [Controllerテストケース](/doc/5_api/controller/api/MediaPatchController/testcase.medium.md)
