# SessionStateRegistrar 設計書

## 概要
`SessionStateRegistrar` は、ログイン成功後にセッションIDを再生成し、新しいセッショントークンを状態ストアへ登録するアダプターです。  
セッション固定攻撃を避けるため `session.regenerate` を完了させてからトークンを保存し、最終的に有効な `session` オブジェクトへ `session_token` を設定します。

## クラス
- 配置: `src/infrastructure/SessionStateRegistrar.js`
- クラス名: `SessionStateRegistrar`

## 公開メソッド
- `execute({ session, userId, ttlMs })`
  - `session.regenerate` によりセッションを再生成する
  - `sessionTokenGenerator` で新しいトークンを採番する
  - `sessionStateStore.save` に `{ sessionToken, userId, ttlMs }` を保存する
  - アクティブな `session` に `session_token` を設定し、ストアの戻り値を返す

## 登録方針
- トークンは既定で `crypto.randomUUID()` 由来の 32 文字英数字相当値をハイフン除去して生成する
- `session.regenerate` 完了前にはストア保存も `session_token` 更新も行わない
- `session.req.session` が差し替えられていれば、それを再生成後のアクティブセッションとして採用する
- ストア保存成功後にのみ `activeSession.session_token` を更新する

## 依存関係
- `sessionStateStore.save` を持つこと
- `sessionTokenGenerator` は非空文字列トークンを返す関数であること
- `session.regenerate(callback)` は `express-session` 互換APIであること

## エラー方針
- `session` / `userId` / `sessionTokenGenerator` / `sessionStateStore` の不正は `Error` を送出する
- `session.regenerate` 失敗時はストア保存も `session_token` 更新も行わずに reject する
- `sessionStateStore.save` の失敗はそのまま上位へ伝播し、`session_token` は更新しない
