# MediaViewer 仕様書

## プロジェクト概要
MediaViewerは、漫画・動画などの複数種類のメディアを閲覧可能なWebアプリケーションです。

### 技術スタック
- Node.js + Express
- EJSテンプレート
- Sequelize ORM
- SQLite3（開発）
- PostgreSQL（本番）
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

## Docker運用（PostgreSQL）

### 構成
- `docker-compose.yml`
  - `app`: Node.js アプリケーション
  - `db`: PostgreSQL 16
- `Dockerfile`
  - 本番実行向け（`NODE_ENV=production`）
  - 依存は `npm ci --omit=dev` で導入

### 起動方法
1. プロジェクトルートで以下を実行する
   - `docker compose up --build -d`
2. アプリケーションにアクセスする
   - `http://localhost:3000`

### 停止方法
- `docker compose down`

### 注意事項
- Docker構成では DB を PostgreSQL として起動するため、アプリ側は `DATABASE_DIALECT=postgres` で起動する。
- DB接続は `DATABASE_URL` もしくは `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_NAME` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` で指定可能。
- `seed:user` は production 環境では禁止のため、Dockerの `app` コンテナ起動時には実行しない。

### GitHub Actionsでの確認
- `.github/workflows/docker-compose-ci.yml` で Docker Compose の起動確認を自動実行する。
- CI では `docker compose up --build -d` 後に `http://localhost:3000/screen/login` へ疎通し、HTTP 200 を確認する。
- 失敗時は `app` / `db` のログを出力する。

### 利用可能環境と禁止事項
- `seed:user` / `start:seeded` は **production環境での実行禁止**。
- seed実行時は、冒頭で production ガードが動作し、
  「固定認証情報の本番利用禁止」を含むエラーメッセージで停止する。

### 動作確認手順（短縮版）
1. 初回実行: `npm run seed:user`
   - 期待結果: ログに `作成` が出力され、固定ユーザーと認証情報ハッシュが作成される。
2. 再実行: `npm run seed:user`
   - 期待結果: 既存データは `既存スキップ`（または条件一致時の `限定更新`）となり、重複ユーザーは増えない。
3. 連続起動確認: `npm run start:seeded`
   - 期待結果: seed後に通常起動し、再実行時も重複作成しない。

## 考慮不足

- [ ] ユーザー、管理者はどうやって追加する？

## 改良案

- [ ] 検索条件をメディア一覧で入力可能とする
- [ ] サーバー側のログ出力機能を追加
- [ ] しおり機能
- [ ] あとで見るのメディアを最後まで見たら一覧から削除する
- [ ] ビューアーからのお気に入り登録
