# SequelizeUnitOfWork テストケース

## テストケース一覧
- [run は callback の戻り値を返し非同期境界をまたいでも getCurrent を維持する](#run-は-callback-の戻り値を返し非同期境界をまたいでも-getcurrent-を維持する)
- [run 内例外は sequelize.transaction へ伝播し rollback 側の分岐を通す](#run-内例外は-sequelizetransaction-へ伝播し-rollback-側の分岐を通す)
- [constructor / run は不正入力で例外を送出する](#constructor--run-は不正入力で例外を送出する)

---

### run は callback の戻り値を返し非同期境界をまたいでも getCurrent を維持する
- 前提
  - `SequelizeUnitOfWork` が有効な Sequelize 互換オブジェクトで生成済みである
- 操作
  - `run(async () => { await Promise.resolve(); return value; })` を実行し、コールバック内外で `getCurrent()` を確認する
- 期待結果
  - コールバック内では `getCurrent()` が実行文脈を返す
  - `run` の戻り値はコールバック戻り値と一致する
  - コールバック外では `getCurrent()` は `null` に戻る

### run 内例外は sequelize.transaction へ伝播し rollback 側の分岐を通す
- 前提
  - `sequelize.transaction` の rollback 分岐を観測できるスタブを用意する
- 操作
  - `run` 内で例外を送出する
- 期待結果
  - `run` は reject される
  - 例外が `sequelize.transaction` へ伝播し rollback 側の処理が実行される

### constructor / run は不正入力で例外を送出する
- 前提
  - なし
- 操作
  - `transaction` 関数を持たない `sequelize` を渡して生成する
  - `run` に関数以外を渡して実行する
- 期待結果
  - いずれも `Error` が送出される
