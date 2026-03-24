# createDependencies テスト観点

## medium 観点

### 4) 依存配線経由のログイン成立とセッション解決
（対応テスト: `__tests__/medium/app/createDependencies.login.test.js`）

**前提**
- `loginUsername` / `loginPassword` / `loginUserId` / `loginSessionTtlMs` を明示した `env` で `createDependencies` を生成する。
- `session.regenerate` を持つセッションオブジェクトを用意する。

**操作**
1. `await dependencies.ready` で初期化完了を待つ。
2. `Query`（username/password/session）を使って `dependencies.loginService.execute(...)` を実行する。
3. 返却された `sessionToken` を `dependencies.authResolver.execute(sessionToken)` に渡す。

**期待結果**
- `LoginSucceededResult` が返る。
- ログイン結果コードが成功値であり、`sessionToken` が期待形式（32 桁 hex）で採番される。
- セッションオブジェクトに `session_token` が格納される。
- `authResolver` が `sessionToken` から `loginUserId` を解決できる。

---

## メンテナンス方針
- 仕様変更時は、まず `readme.md` を更新し、その変更が検証対象に影響する場合のみ本書の該当観点を更新する。
- テスト追加時は「どの観点を担保するテストか」を本書へ対応付け、重複と抜け漏れを防ぐ。
