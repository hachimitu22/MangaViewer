# E2E テストケース（large）

## 目的

管理者が事前に提供したメディアを、利用者が UI 上で検索・一覧確認・閲覧できる主要フローを、HTTP エンドポイントと画面操作の両面から回帰確認する。

## 前提条件

- テスト実行前にアプリケーションが起動できること
- 閲覧対象のメディアデータが事前投入されていること
- テストデータ投入/クリーンアップ手段が利用可能であること

## テストケース一覧

### TC-E2E-001: 一覧画面で検索・並び替え・ページングが機能する

- 対応テスト: `__tests__/large/e2e/summary/summary-search-sort-pagination.large.test.js`
- 観点:
  - 検索条件入力の反映
  - 並び順変更の反映
  - ページ移動時の表示整合

### TC-E2E-002: ビューアーのページ遷移と URL パラメータ整合が機能する

- 対応テスト: `__tests__/large/e2e/viewer/viewer-navigation.large.test.js`
- 観点:
  - 一覧から `/screen/viewer/:mediaId/:mediaPage` へ遷移できる
  - `mediaPage=1` から次ページへ進み、前ページへ戻れる
  - 先頭ページで前ページ移動不可、末尾ページで次ページ移動不可の表示制御
  - URL パラメータ（mediaId, mediaPage）と画面表示（画像/ページ番号）の一致

### TC-E2E-003: 検索画面で条件作成し一覧条件へ正しく引き継げる

- 対応テスト: `__tests__/large/e2e/search/search-to-summary.large.test.js`
- 観点:
  - `/screen/search` でタイトル・start/size・sort・複数タグを入力して検索実行できる
  - `/screen/summary` の URL クエリ（`title`, `tags`, `start`, `size`, `sort`, `summaryPage`）に条件が反映される
  - 一覧の「現在の検索条件」チップ表示と結果件数が入力条件に整合する

## 判定基準

- 各シナリオで期待する HTTP ステータス・画面遷移・表示要素が一致すること
- 画面状態の遷移が期待どおりであること

## メンテナンス方針

- `__tests__/large/e2e/` にシナリオを追加した場合、本書へ同名観点を追記する
- シナリオ名はテストファイルの basename と対応づけ、追跡しやすくする
