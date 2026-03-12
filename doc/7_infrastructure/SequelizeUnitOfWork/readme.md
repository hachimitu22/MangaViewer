# SequelizeUnitOfWork 設計書

## 概要
`SequelizeUnitOfWork` は、Sequelize のトランザクションと `AsyncLocalStorage` を組み合わせて、アプリケーションサービス境界で開始した実行文脈をインフラ層から参照可能にするクラスです。  
Repository は `getCurrent()` で現在の実行文脈（トランザクション）を取得し、同一文脈に参加して永続化処理を行います。

## クラス
- 配置: `src/infrastructure/SequelizeUnitOfWork.js`
- クラス名: `SequelizeUnitOfWork`

## 公開メソッド
- `run(work)`
  - Sequelize のトランザクションを開始し、`work` を実行する
  - 実行中のトランザクションを `AsyncLocalStorage` に保持する
  - `work` が例外を送出した場合はロールバックされ、例外を上位へ伝播する
- `getCurrent()`
  - 現在の実行文脈に紐づくトランザクションを返す
  - 実行文脈外では `null` を返す

## 初期化方針
- `constructor({ sequelize })` は `sequelize.transaction` 関数の存在を必須とする
- `sequelize` が不正な場合は `Error` を送出する

## 実行文脈方針
- `run(work)` の中で `getCurrent()` を呼ぶと、同一トランザクションオブジェクトを取得できる
- `run(work)` 実行後に `getCurrent()` を呼ぶと `null` になる
- `work` 引数が関数でない場合は `Error` を送出する

## エラー方針
- 引数バリデーション違反（`sequelize` 不正 / `work` 不正）は `Error` を送出する
- `work` 内の例外は握り潰さず上位へ再送出する
