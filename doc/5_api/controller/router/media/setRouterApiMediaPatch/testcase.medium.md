# router (PATCH /api/media/:mediaId) テストケース

## テストケース一覧
- `PATCH /api/media/:mediaId` に **4ハンドラー**（認証→CSRF→保存→更新）を順序どおり登録する。
- 登録済みハンドラーを順に実行すると認証・CSRF検証・保存・更新が連携する。

## 期待結果
- ハンドラー順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → `ContentSaveMiddleware` → `MediaPatchController`。
- 正常時は `200 + { code: 0 }`。
- 入力不正時のレスポンス仕様は `MediaPatchController` の定義（`400 + Bad Request`）に従う。
