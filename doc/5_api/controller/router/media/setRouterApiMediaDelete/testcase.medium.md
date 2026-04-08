# router (DELETE /api/media/:mediaId) テストケース

## テストケース一覧
- `DELETE /api/media/:mediaId` に **3ハンドラー**（認証→CSRF→削除）を順序どおり登録する。
- 登録済みハンドラーを順に実行すると認証・CSRF検証後に削除サービスが呼ばれる。

## 期待結果
- ハンドラー順: `SessionAuthMiddleware` → `CsrfProtectionMiddleware` → `MediaDeleteController`。
- 正常時は `200 + { code: 0 }`。
- 失敗時のレスポンス仕様は `MediaDeleteController` の定義（`400/500`）に従う。
