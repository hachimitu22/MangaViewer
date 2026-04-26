# E2E テストケース（large）

## 目的

画面遷移をまたぐ主要ユーザーフローを、HTTP エンドポイントと UI 操作の両面から回帰確認する。

## 前提条件

- テスト実行前にアプリケーションが起動できること
- 管理者APIトークンを利用できること
- テストデータ投入/クリーンアップ手段が利用可能であること

## テストケース一覧

### TC-E2E-001: 初期画面からメディア一覧へ遷移できる

- 対応テスト: `__tests__/large/e2e/auth/auth-to-summary.large.test.js`
- 観点:
  - 初期画面の表示
  - 初期導線から `/screen/summary` へ遷移できること
  - 一覧画面の主要要素表示

### TC-E2E-002: 一覧画面で検索・並び替え・ページングが機能する

- 対応テスト: `__tests__/large/e2e/summary/summary-search-sort-pagination.large.test.js`
- 観点:
  - 検索条件入力の反映
  - 並び順変更の反映
  - ページ移動時の表示整合

### TC-E2E-004: 画面ナビゲーションが機能する

- 対応テスト: `__tests__/large/e2e/navigation/navigation-and-exit.large.test.js`
- 観点:
  - ナビゲーションリンク遷移
  - 保護画面へのアクセス制御
  - 画面間の遷移整合

### TC-E2E-005: 認可境界で拒否と許可が切り替わる

- 対応テスト: `__tests__/large/e2e/auth/auth-guard.large.test.js`
- 観点:
  - 条件充足後に同一 API / 画面アクセスが許可されること

### TC-E2E-006: ビューアーのページ遷移と URL パラメータ整合が機能する

- 対応テスト: `__tests__/large/e2e/viewer/viewer-navigation.large.test.js`
- 観点:
  - 一覧から `/screen/viewer/:mediaId/:mediaPage` へ遷移できる
  - `mediaPage=1` から次ページへ進み、前ページへ戻れる
  - 先頭ページで前ページ移動不可、末尾ページで次ページ移動不可の表示制御
  - URL パラメータ（mediaId, mediaPage）と画面表示（画像/ページ番号）の一致

### TC-E2E-007: 不正なルートパラメータでエラー画面に遷移し復帰できる

- 対応テスト: `__tests__/large/e2e/error/invalid-route-params.large.test.js`
- 観点:
  - 存在しない `mediaId` での `/screen/detail/:mediaId` / `/screen/viewer/:mediaId/:mediaPage` のエラー遷移
  - `mediaPage=0` や過大ページ番号での `/screen/viewer/:mediaId/:mediaPage` のエラー遷移
  - エラー画面からナビゲーションリンク経由で `/screen/summary` に安全に復帰できること
  - 未定義パスで定義済みの HTTP ステータス (`404`) とレスポンスボディを返すこと

### TC-E2E-008: 登録画面からメディアを新規登録し、一覧・詳細へ反映できる

- 対応テスト: `__tests__/large/e2e/entry/entry-create-media.large.test.js`
- 観点:
  - `/screen/entry` でタイトル・タグ・コンテンツ追加 UI（ドラッグ&ドロップ/ファイル選択）が操作できる
  - `POST /api/media` で登録成功（`200`）し、新規 `mediaId` を取得できる
  - 登録後に `/screen/summary` と `/screen/detail/:mediaId` でタイトル・タグ・先頭コンテンツが表示される

### TC-E2E-009: 編集画面でメディア更新（タイトル・タグ・コンテンツ順序）が反映される

- 対応テスト: `__tests__/large/e2e/edit/edit-update-media.large.test.js`
- 観点:
  - `/screen/edit/:mediaId` で既存データ（タイトル・タグ・コンテンツ）が初期表示される
  - `PATCH /api/media/:mediaId` で更新成功（`200`）し、変更内容が詳細/一覧/ビューアーに反映される
  - コンテンツの並び替え（上へ/下へ）結果が `/screen/viewer/:mediaId/:mediaPage` のページ順に反映される

### TC-E2E-010: 編集画面からメディア削除後に各導線で参照不可になる

- 対応テスト: `__tests__/large/e2e/edit/edit-delete-media.large.test.js`
- 観点:
  - `/screen/edit/:mediaId` から `DELETE /api/media/:mediaId` を実行し成功（`200`）する
  - 削除後、`/screen/summary` から対象カードが消える
  - 削除済み `mediaId` への `/screen/detail/:mediaId` / `/screen/viewer/:mediaId/:mediaPage` 直接アクセスでエラー遷移する

### TC-E2E-011: 検索画面から条件作成して一覧条件へ正しく引き継げる

- 対応テスト: `__tests__/large/e2e/search/search-to-summary.large.test.js`
- 観点:
  - `/screen/search` でタイトル・start/size・sort・複数タグを入力して検索実行できる
  - `/screen/summary` の URL クエリ（`title`, `tags`, `start`, `size`, `sort`, `summaryPage`）に条件が反映される
  - 一覧の「現在の検索条件」チップ表示と結果件数が入力条件に整合する

### TC-E2E-013: 初期導線失敗時に遷移せずエラーメッセージを表示する

- 対応テスト: `__tests__/large/e2e/auth/auth-failure.large.test.js`
- 観点:
  - 誤った認証情報で `POST /api/auth` を送信した際に失敗コード（`code: 1`）を受け取る
  - `/screen/auth` に留まり、`/screen/summary` へ遷移しない
  - 初期画面に失敗メッセージが表示され、再入力可能な状態を維持する


### TC-E2E-014: 認可境界の未カバー導線（viewer/search と API post/exit）を検証する

- 対応テスト: `__tests__/large/e2e/auth/auth-guard-uncovered-routes.large.test.js`
- 観点:
  - 条件未充足で `/screen/viewer/:mediaId/:mediaPage` と `/screen/search` へ直接アクセスした際に `401` で拒否される
  - 条件充足後は同一導線が許可される

### TC-E2E-015: 画面で利用する各APIの異常系で画面内メッセージ表示と再操作ができる

- 対応テスト: `__tests__/large/e2e/error/api-error-message-and-retry.large.test.js`（新規追加対象）
- 観点:
  - `/screen/auth` で `POST /api/auth` が失敗した場合、遷移せずエラーメッセージを表示して再入力・再実行できる
  - `/screen/entry` で `POST /api/media` が失敗した場合、入力値を保持したままエラーメッセージを表示し再実行できる
  - `/screen/edit/:mediaId` で `PATCH /api/media/{mediaId}` または `DELETE /api/media/{mediaId}` が失敗した場合、同一画面でエラーメッセージを表示し再実行できる
  - ナビゲーターから `POST /api/navigation-exit` が失敗した場合、表示中の画面にエラーメッセージを表示し、画面が操作不能にならない

## 判定基準

- 各シナリオで期待する HTTP ステータス・画面遷移・表示要素が一致すること
- 画面状態の遷移が期待どおりであること

## メンテナンス方針

- `__tests__/large/e2e/` にシナリオを追加した場合、本書へ同名観点を追記する
- シナリオ名はテストファイルの basename と対応づけ、追跡しやすくする
