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

- `FIXED_LOGIN_USER_ID`
- `FIXED_LOGIN_USERNAME`
- `FIXED_LOGIN_PASSWORD`

`.env.example` には変数名のみを置き、実値は安全な共有手段（シークレットマネージャーなど）で管理すること。

### npm script の用途
- `npm run start`
  - 通常起動のみ（本番同等）。seed処理は実行しない。
- `npm run seed:user`
  - 固定ユーザー作成seedのみ実行する。
  - 開発・検証用途。`NODE_ENV=production` では即時失敗する。
- `npm run start:seeded`
  - `seed:user` を実行してから通常起動する。
  - 初期セットアップや手動確認用。

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
