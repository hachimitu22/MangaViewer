# SessionStateAuthAdapter 設計書

## 概要
`SessionStateAuthAdapter` は、セッショントークンからユーザーIDを解決する認証アダプターです。  
コントローラーやルーターで取得した `sessionToken` をセッション状態ストアへ委譲し、認証済みユーザーの識別子を返します。

## 命名の統一方針
- 実装クラス名: `SessionStateAuthAdapter`
- 実装ファイル名: `src/infrastructure/SessionStateAuthAdapter.js`
- 設計書ディレクトリ名: `doc/7_infrastructure/SessionStateAuthAdapter/`
- small テストファイル名: `__tests__/small/infrastructure/SessionStateAuthAdapter.test.js`

`execute` の責務は「認証判定そのもの」ではなく「セッション状態ストアを使う認証アダプター」であるため、`Resolver` ではなく既存実装と一致する `Adapter` を正とする。

## クラス
- 配置: `src/infrastructure/SessionStateAuthAdapter.js`
- クラス名: `SessionStateAuthAdapter`

## 公開メソッド
- `execute(sessionToken)`
  - `sessionStateStore.findUserIdBySessionToken(sessionToken)` を呼び出す
  - 取得できた `userId`、または未登録時の `undefined` を返す

## 依存関係
- `sessionStateStore.findUserIdBySessionToken` を必須とする
- セッション状態の保存方式はストア実装に委譲する

## エラー方針
- `sessionStateStore.findUserIdBySessionToken` を持たない依存はコンストラクタで `Error` を送出する
- `execute` 内ではストアの例外を握り潰さず上位へ伝播する
