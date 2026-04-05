# router (GET /) テストケース

## テストケース一覧
- [GET / にリダイレクトハンドラーを登録する](#get--にリダイレクトハンドラーを登録する)
- [未認証アクセス時は /screen/login へリダイレクトする](#未認証アクセス時は-screenlogin-へリダイレクトする)
- [認証済みアクセス時は /screen/summary へリダイレクトする](#認証済みアクセス時は-screensummary-へリダイレクトする)

---

### GET / にリダイレクトハンドラーを登録する
- **前提**
  - `router.get` を利用できる Router を用意する。
- **操作**
  - `setRouterRootGet` を実行する。
- **結果**
  - `router.get` が `/` をパスとして1回登録される。

---

### 未認証アクセス時は /screen/login へリダイレクトする
- **前提**
  - セッショントークンなしで `GET /` を実行する。
- **操作**
  - ルーターを組み込んだ Express アプリへ HTTP リクエストする。
- **結果**
  - ステータスは 3xx を返す。
  - `Location` ヘッダーが `/screen/login` になる。

---

### 認証済みアクセス時は /screen/summary へリダイレクトする
- **前提**
  - `SessionStateAuthAdapter` と in-memory store で有効トークンを登録する。
  - 有効トークンを付与して `GET /` を実行する。
- **操作**
  - ルーターを組み込んだ Express アプリへ HTTP リクエストする。
- **結果**
  - ステータスは 3xx を返す。
  - `Location` ヘッダーが `/screen/summary` になる。
