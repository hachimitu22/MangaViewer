# setupMiddleware 設計書

## 概要
- `src/app/setupMiddleware.js` は、Express アプリケーション全体へ共通適用するミドルウェアを登録する。
- 本ドキュメントでは、ビュー設定とリクエストパーサー設定のみを扱う。

## 対象実装
- 実装: `src/app/setupMiddleware.js`

## 入力

### `env`
| 項目 | 用途 |
| --- | --- |
| `contentRootDirectory` | `/contents` に静的配信するディレクトリ |

### `dependencies`
- 現行実装では利用しないが、`createApp` からシグネチャを統一して受け取る。
- 将来、共通ミドルウェアへ依存オブジェクトを注入する拡張余地として保持する。

## ビュー・パーサー設定
- `views` ディレクトリを `src/views` に設定する。
- `view engine` を `ejs` に設定する。
- `env.contentRootDirectory` が指定されている場合、`/contents` 配下に `express.static(env.contentRootDirectory)` を登録する。
- `express.json()` を登録し、JSON リクエストボディを解釈可能にする。
- `express.urlencoded({ extended: true })` を登録し、フォーム投稿を解釈可能にする。

## 後続ミドルウェアへの契約
- 本モジュールは共通基盤設定のみを担当し、認証・認可の判定は扱わない。
- 認証が必要な場合は、別途ルーティング層で適切なミドルウェアを明示的に適用する。

## 関連ドキュメント
- [createDependencies 設計書](/doc/4_application/app/createDependencies/readme.md)
- [createApp 設計書](/doc/4_application/app/createApp/readme.md)
