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

## 固定ユーザーseed運用

### 事前設定（環境変数）
固定ユーザーの認証情報はコードに直書きせず、以下の環境変数から注入する。

- 必須
  - `FIXED_LOGIN_USER_ID`（または `LOGIN_USER_ID`）
  - `FIXED_LOGIN_USERNAME`（または `LOGIN_USERNAME`）
  - `FIXED_LOGIN_PASSWORD` または `FIXED_LOGIN_PASSWORD_HASH`（`LOGIN_*` 系でも可）
- 禁止事項
  - `ALLOW_INSECURE_DEFAULT_LOGIN=true` は **ローカル開発を含め常時禁止**。
  - `admin/admin` のような弱いデフォルト認証を恒常運用しない。

`.env.example` には変数名のみを置き、実値は安全な共有手段（シークレットマネージャーなど）で管理すること。

### 初回起動時の必須設定手順
1. `.env` または Secret に `FIXED_LOGIN_USER_ID`（または `LOGIN_USER_ID`）を設定する。
2. `.env` または Secret に `FIXED_LOGIN_USERNAME`（または `LOGIN_USERNAME`）を設定する。
3. `.env` または Secret に `FIXED_LOGIN_PASSWORD` または `FIXED_LOGIN_PASSWORD_HASH`（`LOGIN_*` 系でも可）を設定する。
4. `APP_ORIGIN` を設定する（例: `http://127.0.0.1:3000`）。
5. `ALLOW_INSECURE_DEFAULT_LOGIN` を設定しない（または `false` を明示）ことを確認する。
6. `npm run start` で起動し、設定漏れや禁止設定があれば fail-close で起動失敗することを確認する。

### 移行手順（既存運用向け）
1. 既存の `.env` / Secret 設定に `*_LOGIN_USER_ID` / `*_LOGIN_USERNAME` / `*_LOGIN_PASSWORD or *_LOGIN_PASSWORD_HASH` を必ず追加する。
2. `ALLOW_INSECURE_DEFAULT_LOGIN` を未設定（または `false`）にする。
3. CI/CD で `npm run start` もしくは起動ヘルスチェックを実行し、設定漏れがあれば起動失敗で検知する。

### npm script の用途
- `npm run start`
  - 通常起動のみ（本番同等）。seed処理は実行しない。
- `npm run seed:user`
  - 固定ユーザー作成seedのみ実行する。
  - 開発・検証用途。`NODE_ENV=production` では即時失敗する。
- `npm run start:seeded`
  - `seed:user` を実行してから通常起動する。
  - 初期セットアップや手動確認用。

## 考慮不足

- [ ] ユーザー、管理者はどうやって追加する？

## 改良案

- [ ] 検索条件をメディア一覧で入力可能とする
- [ ] サーバー側のログ出力機能を追加
- [ ] しおり機能
- [ ] あとで見るのメディアを最後まで見たら一覧から削除する
- [ ] ビューアーからのお気に入り登録
