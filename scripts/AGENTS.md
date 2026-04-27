# AGENTS.md (scripts)

このファイルのスコープは `scripts/` 配下です。ルート `AGENTS.md` より本ファイルを優先します。

## 目的
- 起動・seed・取り込み系スクリプトの安全性を維持する。

## 運用ルール
- `start-server.js`
  - `.env` 系の読み込み仕様（`ENV_FILE`）を壊さない。
  - 起動失敗すべき条件は fail-close で維持する。
- `seed-fixed-user.js`
  - 本番での誤実行防止（`NODE_ENV=production` 失敗）を維持する。
  - 認証情報の直書きは禁止。環境変数注入を前提とする。
- `ImportZips.js`
  - 入力ファイルの扱いは既存バリデーション方針に合わせる。

## 変更時の注意
- npm scripts（`package.json`）の実体コマンドと齟齬を出さない。
- CLI 引数や環境変数名を変える場合は、`doc/README.md` とルート `AGENTS.md` を同時更新する。
