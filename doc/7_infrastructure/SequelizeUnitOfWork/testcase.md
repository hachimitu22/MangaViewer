# SequelizeUnitOfWork テストケース

## テストケース一覧
- [run で開始した実行文脈内では getCurrent でトランザクションを取得できる](#run-で開始した実行文脈内では-getcurrent-でトランザクションを取得できる)
- [run 実行文脈の外では getCurrent は null を返す](#run-実行文脈の外では-getcurrent-は-null-を返す)
- [run 内で例外が発生した場合は rollback され例外が再送出される](#run-内で例外が発生した場合は-rollback-され例外が再送出される)
- [constructor は transaction 関数を持たない sequelize を受け取ると例外を送出する](#constructor-は-transaction-関数を持たない-sequelize-を受け取ると例外を送出する)
- [run は関数以外の引数を受け取ると例外を送出する](#run-は関数以外の引数を受け取ると例外を送出する)

---

### run で開始した実行文脈内では getCurrent でトランザクションを取得できる
- 前提
  - `SequelizeUnitOfWork` が有効な Sequelize で生成済みである
- 操作
  - `run(async () => { ... })` を実行し、コールバック内で `getCurrent()` を呼ぶ
- 期待結果
  - `getCurrent()` が `null` ではないトランザクションオブジェクトを返す

### run 実行文脈の外では getCurrent は null を返す
- 前提
  - `SequelizeUnitOfWork` が生成済みである
- 操作
  - `run` 実行前後に `getCurrent()` を呼ぶ
- 期待結果
  - いずれも `null` が返る

### run 内で例外が発生した場合は rollback され例外が再送出される
- 前提
  - `SequelizeUnitOfWork` が有効な Sequelize で生成済みである
- 操作
  - `run` のコールバック内で SQL を実行した後、意図的に例外を送出する
- 期待結果
  - `run` 呼び出しは例外で reject される
  - トランザクションは rollback され、保存したデータは残らない

### constructor は transaction 関数を持たない sequelize を受け取ると例外を送出する
- 前提
  - なし
- 操作
  - `new SequelizeUnitOfWork({ sequelize: {} })` を実行する
- 期待結果
  - `Error` が送出される

### run は関数以外の引数を受け取ると例外を送出する
- 前提
  - `SequelizeUnitOfWork` が生成済みである
- 操作
  - `run` に関数以外の値を渡して実行する
- 期待結果
  - `Error` が送出される
