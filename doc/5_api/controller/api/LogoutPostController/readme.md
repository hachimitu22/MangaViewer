# LogoutPostController

## 概要
- `POST /api/logout` のHTTPリクエストを受け取り、ログアウト処理を `LogoutService` へ委譲する。
- `req.session` の存在のみを確認し、妥当な場合は `LogoutService.Query` を生成して `execute` を呼び出す。
- `LogoutService` の結果コードをそのまま返し、入力不備や例外は失敗レスポンス `code: 1` に統一する。

## 対象API
- `POST /api/logout`

## 責務
- ログアウトAPIに必要な `session` の存在を確認する。
- `LogoutService` に対して `session` を渡す。
- 成功・失敗レスポンスを HTTP `200` の JSON `{ code }` に変換する。

## 入力パラメータ
| 項目 | 取得元 | 型 | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `session` | `req.session` | `object` | 必須 | ログアウト対象のセッション。 |

## バリデーション
- `session` が存在すること。
- 未設定の場合は `LogoutService` を呼び出さず、失敗レスポンスを返す。

## 依存する application service
- [LogoutService](/doc/4_application/user/command/LogoutService/readme.md)
  - `Query`: `session` を保持する入力DTO。
  - 成功時結果: `code: 0` を持つ。
  - 失敗時結果: `code: 1` を持つ。

## 成功時レスポンス
### ログアウト成功
- 条件: `LogoutService` が成功結果を返す。
- HTTPステータス: `200`
- ボディ:

```json
{
  "code": 0
}
```

## 失敗時レスポンス
- `session` 未設定時: HTTP `200` + `{ "code": 1 }`
- `LogoutService` が失敗結果を返した時: HTTP `200` + `{ "code": 1 }`

## 例外時の振る舞い
- `LogoutService.execute` が例外を送出した場合は `catch` し、HTTP `200` + `{ "code": 1 }` を返す。
- 想定外例外は外へ再送出せず、ログアウト失敗として扱う。

## 関連ドキュメント
- [Controllerテストケース](/doc/5_api/controller/api/LogoutPostController/testcase.md)
