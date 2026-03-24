# SessionStateAuthAdapter テストケース

## テストケース一覧
- [execute は sessionToken に紐づく userId を返す](#execute-は-sessiontoken-に紐づく-userid-を返す)
- [sessionStateStore が不正な場合は初期化時に例外となる](#sessionstatestore-が不正な場合は初期化時に例外となる)

---

### execute は sessionToken に紐づく userId を返す
- 前提
  - `sessionStateStore.findUserIdBySessionToken` が `userId` を返す
- 操作
  - `execute(sessionToken)` を実行する
- 期待結果
  - ストアへ `sessionToken` が渡される
  - 対応する `userId` で resolve する

### sessionStateStore が不正な場合は初期化時に例外となる
- 前提
  - なし
- 操作
  - `findUserIdBySessionToken` を持たない `sessionStateStore` で生成する
- 期待結果
  - コンストラクタで `Error` が送出される
