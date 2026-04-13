# router (POST /api/logout) テストケース

## テストケース一覧
- `POST /api/logout` に **3ハンドラー**（認証→CSRF→ログアウト）を登録する。
- 登録済みハンドラーを順に実行すると `logoutService` が呼ばれる。
- `logoutService` が不正な場合は初期化時に例外となる。

## 期待結果
- ハンドラー順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → `LogoutPostController`。
- ログアウト成功時は `200 + { code: 0 }`。
- 失敗時レスポンスは `LogoutPostController` の仕様（`200/401/500`）に従う。
