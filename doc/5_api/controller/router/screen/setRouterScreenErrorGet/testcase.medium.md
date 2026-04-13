# router (GET /screen/error) テストケース

## テストケース一覧
- [small: GET /screen/error に描画ハンドラーを登録する](#small-get-screenerror-に描画ハンドラーを登録する)
- [small: 登録済みハンドラーを実行すると描画データを組み立てる](#small-登録済みハンドラーを実行すると描画データを組み立てる)
- [medium: Express アプリで GET /screen/error を実行すると error.ejs を描画した HTML を返す](#medium-express-アプリで-get-screenerror-を実行すると-errorejs-を描画した-html-を返す)

## 責務分担
- **small**
  - `router.get` へ `/screen/error` とハンドラーが登録されることを確認する。
  - ハンドラーが `screen/error` に対してページタイトル・案内文言・主要導線を描画データとして渡すことを確認する。
- **medium**
  - Express アプリへ実際にルーターを組み込み、`GET /screen/error` で HTTP 200 / `text/html` を返すことを確認する。
  - `src/views/screen/error.ejs` が実際に描画され、案内文言と主要導線 (`/screen/login`、`/screen/summary`、`/screen/entry`) が HTML 応答本文へ出力されることを確認する。

---

### small: GET /screen/error に描画ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
- **操作**
  - `setRouterScreenErrorGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/error` である。
  - 第2引数に1つのハンドラーが設定される。

---

### small: 登録済みハンドラーを実行すると描画データを組み立てる
- **前提**
  - レスポンスオブジェクトで `status` / `render` をモック化する。
- **操作**
  - 登録済みハンドラーを実行する。
- **結果**
  - `screen/error` が案内メッセージと遷移リンクを含む表示データで描画される。

---

### medium: Express アプリで GET /screen/error を実行すると error.ejs を描画した HTML を返す
- **前提**
  - Express アプリに `setRouterScreenErrorGet` を登録する。
  - ビュー設定を `src/views` / `ejs` に向け、実際の `src/views/screen/error.ejs` を利用できるようにする。
- **操作**
  - `GET /screen/error` を実行する。
- **結果**
  - HTTP ステータスが `200` である。
  - `text/html` のレスポンスとして `src/views/screen/error.ejs` を描画した HTML が返る。
  - 応答本文に案内文言と主要導線 (`/screen/login`、`/screen/summary`、`/screen/entry`) が含まれる。
