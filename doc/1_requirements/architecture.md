# アーキテクチャ概要

## 構成
- Node.js + Expressを用いたAPIサーバ
- EJSを用いたテンプレートエンジン
- SequelizeによるORM
- DBは開発時SQLite3、本番はPostgreSQL
- 開発支援として、対象パスへ固定 `session_token` を自動補完できる DevelopmentSession を備える

## 開発支援機能
- DevelopmentSession は、認証付き画面・API のローカル確認を容易にするための開発専用機能である。
- `ENABLE_DEV_SESSION=true` が明示され、かつ `DEV_SESSION_TOKEN` / `DEV_SESSION_USER_ID` / `DEV_SESSION_TTL_MS` / `DEV_SESSION_PATHS` が揃った場合のみ有効化する。
- 対象は `DEV_SESSION_PATHS` に列挙したパスに限定し、通常のヘッダ / Cookie によるセッション指定がある場合はそちらを優先する。
- 本番環境や公開環境では利用しないことを前提とし、固定トークンを秘匿情報として扱う。
