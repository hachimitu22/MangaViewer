# InMemorySessionStateStore 設計書

## 概要
`InMemorySessionStateStore` は、セッショントークンとユーザーIDの対応をプロセス内メモリに保持するインフラ実装です。  
ログイン時に発行した `sessionToken` を保存し、認証時には `sessionToken` から `userId` を逆引きします。  
有効期限は TTL ミリ秒単位で管理し、参照時または明示的な purge 実行時に期限切れデータを削除します。

## クラス
- 配置: `src/infrastructure/InMemorySessionStateStore.js`
- クラス名: `InMemorySessionStateStore`

## 公開メソッド
- `save({ sessionToken, userId, ttlMs })`
  - セッション状態をメモリ上へ保存する
  - `expiresAt = clock() + ttlMs` を計算して保持する
  - 保存結果として `{ sessionToken, userId, expiresAt }` を返す
- `findUserIdBySessionToken(sessionToken)`
  - 期限切れセッションを purge したうえで、対応する `userId` を返す
  - 未登録または期限切れの場合は `undefined` を返す
- `delete(sessionToken)`
  - 指定トークンの状態を削除し、`Map#delete` の結果を返す
- `purgeExpired()`
  - 現在時刻以前に失効したセッションを一括削除する

## 状態管理方針
- 内部ストレージは `Map<sessionToken, { userId, expiresAt }>` を用いる
- `clock` はテスト容易性のため差し替え可能で、既定値は `Date.now()` である
- `findUserIdBySessionToken` 実行時に自動 purge するため、失効データは参照を契機に自然に除去される

## バリデーション方針
- `sessionToken` は空文字でない文字列を必須とする
- `userId` は空文字でない文字列を必須とする
- `ttlMs` は 1 以上の整数を必須とする

## エラー方針
- 入力バリデーション違反は `Error` を送出する
- 永続化先がメモリのみのため、I/O 起因の回復処理は持たない
