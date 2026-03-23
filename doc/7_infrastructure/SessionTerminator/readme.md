# SessionTerminator 設計書

## 概要
`SessionTerminator` は、ログアウト時にセッション状態ストアと `express-session` の両方を終了させるアダプターです。  
保持中の `session.session_token` を無効化してから `session.destroy` を呼び出し、セッションの論理状態と実体を整合的に破棄します。

## クラス
- 配置: `src/infrastructure/SessionTerminator.js`
- クラス名: `SessionTerminator`

## 公開メソッド
- `execute({ session })`
  - `session.session_token` を取得してセッション状態ストアから削除する
  - ストア削除成功時のみ `session.destroy` を await する
  - 正常終了時は `true`、トークン不正またはストア削除失敗時は `false` を返す

## 終了方針
- `sessionStateStore.delete(sessionToken)` が `true` を返した場合のみ `session.destroy` を実行する
- `session.session_token` が存在しない、または空文字の場合はセッション破棄処理を進めず `false` を返す
- `session.destroy` はコールバックAPIを Promise 化して扱う

## 依存関係
- `sessionStateStore.delete` を持つオブジェクトを受け取る
- `session.destroy` は `express-session` 互換のコールバック形式を想定する

## エラー方針
- `sessionStateStore.delete` を持たない依存はコンストラクタで `Error` を送出する
- `session` がオブジェクトでない場合は `Error` を送出する
- `session.destroy` が存在しない、または `session.destroy` 自体が失敗した場合は reject する
