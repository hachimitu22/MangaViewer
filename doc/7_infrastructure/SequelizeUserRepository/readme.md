# SequelizeUserRepository 設計書

## 概要
`SequelizeUserRepository` は、`User` 集約の favorite / queue 状態を RDB に永続化する Sequelize 実装です。  
`user` テーブルを基点に、`favorite` と `queue` の中間テーブルへ現在状態を全置換で保存し、`findByUserId` で集約を再構築します。

## クラス
- 配置: `src/infrastructure/SequelizeUserRepository.js`
- クラス名: `SequelizeUserRepository`
- 継承: `IUserRepository`

## 公開メソッド
- `sync()`
  - テスト用補助として Sequelize モデルを同期する
- `save(user)`
  - `User` 集約を `user` / `favorite` / `queue` へ保存する
  - 既存 favorite / queue を削除して現状態で再作成する
- `findByUserId(userId)`
  - 指定ユーザーの favorite / queue を読み出して `User` 集約を復元する
  - ユーザー未登録時も空状態の `User` を返す

## 永続化方針
- `save` は `unitOfWorkContext.getCurrent()` が返す実行文脈トランザクションへ参加する
- `user` 行は `upsert` で作成または更新する
- `favorite` / `queue` は毎回 `destroy` 後に `bulkCreate` し、重複のない現在状態へ置き換える

## 復元方針
- `findByUserId` は `favorites` / `queueItems` を include して取得する
- 取得結果から `MediaId` を再生成し、`User` 集約へ `addFavorite` / `addQueue` で復元する
- `user` 行が存在しない場合は、指定 `userId` を持つ空の `User` を返して上位の操作継続を容易にする

## バリデーション方針
- `constructor` は `sequelize.transaction` と `unitOfWorkContext.getCurrent` を必須とする
- `save` は `User` インスタンスのみ受け付ける
- `findByUserId` は `UserId` インスタンスのみ受け付ける

## エラー方針
- 入力バリデーション違反は `Error` を送出する
- Sequelize 由来の例外は上位へ伝播する
