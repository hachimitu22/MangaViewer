# router (POST /api/media) テストケース

## テストケース一覧
- `POST /api/media` に **4ハンドラー**（前処理→検証→保存→登録）を順序どおり登録する。
- 登録済みハンドラーを順に実行すると前処理・検証・保存・登録が連携する。
- `saveAdapter` が不正な場合は初期化時に例外となる。

## 期待結果
- ハンドラー順: `GuardMiddleware` → `CsrfProtectionMiddleware` → `ContentSaveMiddleware` → `MediaPostController`。
- リクエストにはルーターで要求されるヘッダー情報とCSRF検証情報を付与する。
- 正常時は `200 + { code: 0, mediaId }`。
