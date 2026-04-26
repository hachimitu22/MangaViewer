# router (GET /screen/viewer/:mediaId/:mediaPage) テストケース

## テストケース一覧
- [GET /screen/viewer/:mediaId/:mediaPage に描画ハンドラーを登録する](#get-screenviewermediaidmediapage-に描画ハンドラーを登録する)
- [登録済みハンドラーを実行するとビューアー画面を描画する](#登録済みハンドラーを実行するとビューアー画面を描画する)
- [コントローラーで異常系結果を受けた場合はエラー画面へ遷移する](#コントローラーで異常系結果を受けた場合はエラー画面へ遷移する)

---

### GET /screen/viewer/:mediaId/:mediaPage に描画ハンドラーを登録する
- **前提**
  - `router.get` をモック化する。
  - `getMediaContentWithNavigationService` は有効な依存を注入する。
- **操作**
  - `setRouterScreenViewerGet` を実行する。
- **結果**
  - `router.get` が1回呼ばれる。
  - 第1引数が `/screen/viewer/:mediaId/:mediaPage` である。
  - 第2引数以降にハンドラーが設定される。

---

### 登録済みハンドラーを実行するとビューアー画面を描画する
- **前提**
  - `getMediaContentWithNavigationService.execute` は表示対象コンテンツと前後ページ情報を返す。
- **操作**
  - 登録済みハンドラーを実行する。
- **結果**
  - ビューアー取得処理が `mediaId` / `mediaPage` を使って実行される。
  - `screen/viewer` が `content` / `previousPage` / `nextPage` を含む表示データで描画される。
  - `content.id` は `/contents/...` の公開パスとして描画モデルへ渡される。

---

### コントローラーで異常系結果を受けた場合はエラー画面へ遷移する
- **前提**
  - `getMediaContentWithNavigationService.execute` がメディア未存在・ページ未存在、または例外送出となる結果を返す。
- **操作**
  - 描画ハンドラーを実行する。
- **結果**
  - `/screen/error` へのリダイレクトに委譲される。

## medium テストで担保する観点
- `__tests__/medium/controller/router/screen/setRouterScreenViewerGet.test.js` では、Express アプリへ当該ルーターを登録した状態で `GET /screen/viewer/:mediaId/:mediaPage` を実行し、HTML を返せることを担保する。
- medium テストでは `FoundResult` を返した際に `screen/viewer` テンプレートが描画され、`pageTitle`、表示中コンテンツ、前後ページ導線がレスポンスへ反映されることを担保する。
- medium テストでは先頭ページで `previousPage` が `null` になり、前ページ導線なしで描画されることを担保する。
- medium テストでは `MediaNotFoundResult` と `ContentNotFoundResult` の双方で `/screen/error` へ `301` リダイレクトされることを担保する。
