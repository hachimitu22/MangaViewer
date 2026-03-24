# StaticLoginAuthenticator テストケース

## テストケース一覧
- [固定認証情報と一致する場合は userId を返す](#固定認証情報と一致する場合は-userid-を返す)
- [固定認証情報と一致しない場合は null を返す](#固定認証情報と一致しない場合は-null-を返す)
- [コンストラクター設定が不正な場合は例外となる](#コンストラクター設定が不正な場合は例外となる)
- [execute に不足値や型不一致が渡された場合は認証失敗として null を返す](#execute-に不足値や型不一致が渡された場合は認証失敗として-null-を返す)

---

## 固定認証情報と一致する場合は userId を返す
- **前提**
  - `username` / `password` / `userId` が非空文字列で設定されている
- **操作**
  - 固定値と同じ `username` / `password` で `execute` を呼び出す
- **結果**
  - 設定済みの `userId` が返る

---

## 固定認証情報と一致しない場合は null を返す
- **前提**
  - 認証器が正しい固定値で生成されている
- **操作**
  - `username` または `password` を固定値と異なる内容で `execute` する
- **結果**
  - `null` が返る

---

## コンストラクター設定が不正な場合は例外となる
- **前提**
  - `username` / `password` / `userId` のいずれかが空文字、未指定、文字列以外である
- **操作**
  - `new StaticLoginAuthenticator(...)` を実行する
- **結果**
  - 対応する `Error` が送出される

---

## execute に不足値や型不一致が渡された場合は認証失敗として null を返す
- **前提**
  - 認証器が正しい固定値で生成されている
- **操作**
  - `execute()`、`execute({ username: undefined, password: 'x' })`、`execute({ username: 1, password: [] })` などを実行する
- **結果**
  - 例外は送出されない
  - すべて `null` が返る
