# router (POST /api/media) テストケース

## テストケース一覧
- `POST /api/media` に **4ハンドラー**（認証→CSRF→保存→登録）を順序どおり登録する。
- 登録済みハンドラーを順に実行すると認証・CSRF検証・保存・登録が連携する。
- `authResolver` / `saveAdapter` が不正な場合は初期化時に例外となる。

## 期待結果
- ハンドラー順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → `ContentSaveMiddleware` → `MediaPostController`。
- リクエストには `session_token` と `csrf_token`（Cookie由来）および `X-CSRF-Token` / `Origin` が必要。
- 正常時は `200 + { code: 0, mediaId }`。
