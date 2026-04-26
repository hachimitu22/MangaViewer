# MediaViewer 仕様書

## プロジェクト概要
MediaViewerは、漫画・動画などの複数種類のメディアを閲覧可能なWebアプリケーションです。

### 技術スタック
- Node.js + Express
- EJSテンプレート
- Sequelize ORM
- SQLite3
- デプロイ先：Raspberry Pi（予定）

詳細は `requirements/` および `design/` を参照してください。

## 命名規則
- `doc/`・`src/`・`__tests__/` で同じユースケースを扱うファイル／ディレクトリは basename を一致させる。
- アプリケーションサービスを扱う設計書は、実装ファイル名に合わせて `GetQueueService` のように `Service` を含む名称で統一する。
- 見出し・シーケンス図・参照リンク・テストケース名も basename に合わせて一括更新し、差分抽出時に名称ゆれを残さない。

## 運用方針（管理者提供メディア閲覧サービス）

本サービスは「管理者が登録したメディアを閲覧者が参照する」運用を前提とする。
閲覧体験の中核はメディア一覧・詳細・ビューアーであり、ユーザー固有データ（固定ユーザーseed、個別ユーザー追加運用）には依存しない。

### 初期セットアップ
1. `APP_ORIGIN` を設定する（例: `http://127.0.0.1:3000`）。
2. 管理系更新 API 用に `ADMIN_API_TOKEN` を設定する。
3. `npm run start` で起動し、管理者経由でメディア登録・更新・削除が実行できることを確認する。

### npm script の用途
- `npm run start`
  - `.env` を読み込んで通常起動（本番同等）する。
- `npm run dev`
  - `.env.dev` を読み込んで開発起動する。
- `npm run start:test`
  - `.env.test` を読み込んでテスト用にサーバー起動する。

## 改良案

- [ ] 検索条件をメディア一覧で入力可能とする
- [ ] サーバー側のログ出力機能を追加
- [ ] しおり機能

## 管理系 API 認可ポリシー（暫定）
- `/api/media` 系の更新系 API（POST/PATCH/DELETE）は、通常ユーザーセッション認証ではなく管理者向けの別認可を使う。
- 現時点では `ADMIN_API_TOKEN` を `x-admin-token` または `Authorization: Bearer <token>` で照合する方式を採用する。
- `ADMIN_API_TOKEN` 未設定時は fail-close（常に 401）を維持し、意図せぬ公開を防ぐ。

