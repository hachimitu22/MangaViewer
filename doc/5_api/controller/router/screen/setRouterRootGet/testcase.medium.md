# router (GET /) テストケース

## テストケース一覧
- [GET / にリダイレクトハンドラーを登録する](#get--にリダイレクトハンドラーを登録する)
- [GET / は /screen/summary へリダイレクトする](#get--は-screensummary-へリダイレクトする)

---

### GET / にリダイレクトハンドラーを登録する
- **前提**
  - `router.get` を利用できる Router を用意する。
- **操作**
  - `setRouterRootGet` を実行する。
- **結果**
  - `router.get` が `/` をパスとして1回登録される。

---

### GET / は /screen/summary へリダイレクトする
- **前提**
  - `GET /` を実行する。
- **操作**
  - ルーターを組み込んだ Express アプリへ HTTP リクエストする。
- **結果**
  - ステータスは 3xx を返す。
  - `Location` ヘッダーが `/screen/summary` になる。
