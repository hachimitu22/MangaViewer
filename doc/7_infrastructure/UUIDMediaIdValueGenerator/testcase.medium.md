# UUIDMediaIdValueGenerator テストケース

## テストケース一覧
- [generate はハイフンなし 32 文字の UUID を返す](#generate-はハイフンなし-32-文字の-uuid-を返す)
- [generate は呼び出しごとに異なる値を返す](#generate-は呼び出しごとに異なる値を返す)

---

### generate はハイフンなし 32 文字の UUID を返す
- 前提
  - `UUIDMediaIdValueGenerator` のインスタンスが生成済みである
- 操作
  - `generate()` を実行する
- 期待結果
  - 返却値が `^[0-9a-f]{32}$` に一致する
  - 返却値にハイフンが含まれない

### generate は呼び出しごとに異なる値を返す
- 前提
  - `UUIDMediaIdValueGenerator` のインスタンスが生成済みである
- 操作
  - `generate()` を 2 回実行する
- 期待結果
  - 1 回目と 2 回目の返却値が異なる
