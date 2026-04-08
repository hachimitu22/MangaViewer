# router (favorite / queue API) テストケース

## テストケース一覧
- favorite / queue の4ルートを登録し、各ルートに **認証→CSRF→実処理** を設定する。
- favorite の `PUT/DELETE`、queue の `PUT/DELETE` で対応サービスが呼ばれる。
- サービス例外時は `next(error)` に委譲する。

## 期待結果
- 各ルートのミドルウェア順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → ハンドラー。
- 正常時は `200 + { code: 0 }`。
- 認証失敗は `401`、CSRF不一致は `403`（ミドルウェア仕様）となる。
