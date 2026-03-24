# LoginPostController

## 概要
- `POST /api/login` のHTTPリクエストを受け取り、ログイン処理を `LoginService` へ委譲する。
- `req.body.username` / `req.body.password` / `req.session` を検証し、妥当な場合のみ `LoginService.Query` を生成して `execute` を呼び出す。
- `LoginService` の戻り値が `LoginSucceededResult` のときだけ `session_token` Cookie を発行し、レスポンスは常に HTTP `200` で `code` を返す。
- 入力不備、サービス失敗、想定外例外はすべて失敗レスポンス `code: 1` に正規化する。

## 対象API
- `POST /api/login`

## 責務
- ログインAPIの入力値を検証する。
- `LoginService` に渡す `username` / `password` / `session` を組み立てる。
- ログイン成功時のみ `session_token` Cookie を `httpOnly: true`, `path: '/'` で設定する。
- 成功・失敗を `json` レスポンス `{ code }` に変換する。

## 入力パラメータ
| 項目 | 取得元 | 型 | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `username` | `req.body.username` | `string` | 必須 | 空文字不可。 |
| `password` | `req.body.password` | `string` | 必須 | 空文字不可。 |
| `session` | `req.session` | `object` | 必須 | セッションオブジェクト。 |

## バリデーション
- `username` は `string` かつ空文字以外であること。
- `password` は `string` かつ空文字以外であること。
- `session` が存在すること。
- 上記を満たさない場合は `LoginService` を呼び出さず、失敗レスポンスを返す。

## 依存する application service
- [LoginService](/doc/4_application/user/command/LoginService/readme.md)
  - `Query`: `username` / `password` / `session` を保持する入力DTO。
  - `LoginSucceededResult`: 成功時結果。`sessionToken` と `code: 0` を持つ。
  - 失敗時結果: `code: 1` を持つ結果オブジェクト。

## 成功時レスポンス
### ログイン成功
- 条件: `LoginService` が `LoginSucceededResult` を返す。
- HTTPステータス: `200`
- Cookie:
  - `session_token=<sessionToken>`
  - `httpOnly: true`
  - `path: '/'`
- ボディ:

```json
{
  "code": 0
}
```

### 認証失敗
- 条件: `LoginService` が失敗結果を返す。
- HTTPステータス: `200`
- Cookie: 発行しない。
- ボディ:

```json
{
  "code": 1
}
```

## 失敗時レスポンス
- 入力不備時: HTTP `200` + `{ "code": 1 }`
- `LoginService` の失敗結果返却時: HTTP `200` + `{ "code": 1 }`

## 例外時の振る舞い
- `LoginService.execute` が例外を送出した場合は `catch` し、HTTP `200` + `{ "code": 1 }` を返す。
- Cookie設定処理を含む `execute` 内の想定外例外も同様に失敗レスポンスへ変換する。

## 関連ドキュメント
- [Controllerテストケース](/doc/5_api/controller/api/LoginPostController/testcase.medium.md)
