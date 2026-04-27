# AGENTS.md

このファイルは、MangaViewer リポジトリで作業するエージェント向けの運用ガイドです。

## 1. スコープ
- この `AGENTS.md` の適用範囲は **リポジトリ全体**（`/workspace/MangaViewer` 配下）です。
- より深い階層に別の `AGENTS.md` がある場合は、そちらを優先します。

## 2. 基本方針
- 既存の設計・命名・構成に合わせ、**最小差分**で対応する。
- 迷う場合は、`doc/README.md` と既存実装（`src/`）の整合性を優先する。
- 大規模リファクタは依頼がない限り行わない。
- 公開インターフェースや API 契約は、依頼がない限り変更しない。
- セキュリティ関連（認証・セッション・環境変数）は既存の fail-close 方針を維持する。

## 3. 変更時の分類

| 分類 | 内容 |
| --- | --- |
| Commands | ビルド・テスト・デプロイコマンド（フラグ込みで具体的に） |
| Testing | テストフレームワーク、実行方法、必須テスト項目 |
| Project Structure | ディレクトリ構造とその役割 |
| Code Style | 命名規則・フォーマット規約・コードスニペット例 |
| Git Workflow | ブランチ命名規則、コミットメッセージフォーマット |

### Commands
- 開発起動: `npm run dev`  
  実体: `cross-env ENV_FILE=.env.dev nodemon ./scripts/start-server.js --watch ./src --watch ./scripts/start-server.js`
- 本番同等起動: `npm run start`  
  実体: `cross-env ENV_FILE=.env node ./scripts/start-server.js`
- テスト用サーバー起動: `npm run start:test`  
  実体: `cross-env ENV_FILE=.env.test NODE_ENV=test node ./scripts/start-server.js`
- 単体テスト（small）: `npm run test:small`  
  実体: `cross-env NODE_ENV=test LOG_OUTPUTS=memory jest small`
- 結合テスト（medium）: `npm run test:medium`  
  実体: `cross-env NODE_ENV=test LOG_OUTPUTS=memory jest medium`
- E2E テスト（large）: `npm run test:e2e` / `npm run test:large`  
  実体: `cross-env NODE_ENV=test LOG_OUTPUTS=memory playwright test`
- 全テスト: `npm run test:all`  
  実体: `npm run test:small && npm run test:medium && npm run test:large`
- カバレッジ付き全テスト: `npm run test:all:coverage`  
  実体: `cross-env NODE_ENV=test LOG_OUTPUTS=memory jest __tests__/ --coverage`
- API ドキュメント生成: `npm run make-api`  
  実体: `node ./node_modules/aglio/bin/aglio.js -i ./doc/5_api/openapi/openapi.yaml -o ./doc/5_api/openapi/openapi.html`
- API ドキュメントプレビュー: `npm run watch-api`  
  実体: `node ./node_modules/aglio/bin/aglio.js -i ./doc/5_api/openapi/openapi.yaml -s`
- 固定ユーザー seed 実行: `npm run seed:user`  
  実体: `node ./scripts/seed-fixed-user.js`
- seed 後に起動: `npm run start:seeded`  
  実体: `npm run seed:user && npm run start`
- ZIP インポート: `npm run import`  
  実体: `node ./scripts/ImportZips.js`

### Testing
- テストフレームワーク:
  - 単体・結合: Jest
  - E2E: Playwright
- 実行方法:
  - レイヤ単位・粒度単位で `small` / `medium` / `large(e2e)` を使い分ける。
  - PR 前の最低ラインは、変更箇所に対応するテスト層（small/medium/large）を実行する。
  - 横断的変更時は `npm run test:all` を優先する。
- 必須テスト項目（変更内容に応じて）:
  - 認証・セッション関連変更: `__tests__/large/e2e/auth` と該当 small/medium。
  - 画面遷移・表示変更: `__tests__/large/e2e/navigation`, `viewer`, `detail`, `summary` の該当ケース。
  - 取り込み・登録系変更: `importZips`, `entry`, `edit`, `favorite-queue` の該当ケース。
  - API/ミドルウェア変更: `__tests__/medium/controller` と `__tests__/small/controller` の該当ケース。

### Project Structure
- 実装本体: `src/`
  - `domain/`: ドメインモデル（メディア・ユーザー）
  - `application/`: ユースケース実装（command/query/app）
  - `infrastructure/`: ORM・認証などの外部依存実装
  - `controller/`: ルーター、ミドルウェア、画面/API コントローラー
  - `views/`: EJS テンプレート
  - `shared/`: 共通ヘルパー
  - `app/`: アプリケーション起動・DI 構成
- スクリプト: `scripts/`
  - `start-server.js`, `seed-fixed-user.js`, `ImportZips.js`
- テスト: `__tests__/`
  - `small/`, `medium/`, `large/e2e/` で粒度を分割
  - `helpers/` はテスト補助
- ドキュメント: `doc/`
  - 仕様・設計・API ドキュメントを配置

### Code Style
- 命名・ドキュメント整合:
  - `doc/`・`src/`・`__tests__/` で同一ユースケースの basename を可能な限り一致させる。
  - アプリケーションサービスの設計書名は実装名に合わせて `*Service` を含める。
  - 名称変更時は見出し・図・参照リンク・テストケース名の名称ゆれを残さない。
- 実装スタイル:
  - 既存レイヤ構成（domain/application/infrastructure/controller/views）を崩さない。
  - 1 変更 1 目的を守り、機能追加とリファクタを混在させない。
  - 依頼がない限り、公開 API・外部契約・永続化フォーマットを変更しない。
- コードスニペット例（命名と配置の方針）:

```text
src/application/media/query/GetQueueService.js
__tests__/medium/application/media/GetQueueService.test.js
doc/.../GetQueueService.md
```

### Git Workflow
- ブランチ命名規則:
  - 既存運用ブランチを継続利用し、必要時は `type/short-description`（例: `docs/update-agents-guide`）を推奨。
- コミットメッセージフォーマット（必須）:
  - 全て日本語で記述する。
  - 1行目: `プレフィックス: コミットによって達成する要件、仕様`
    - プレフィックス: `docs` / `feat` / `fix` / `refactor` / `style` / `test`
  - 2行目: 空行
  - 3行目以降: 変更内容の詳細、特に **why（なぜ必要か）** を記述する。
- PR 本文の目安:
  - 目的（何を解決するか）
  - 変更点（何をどう変えたか）
  - 影響範囲（どこに影響するか）
  - 確認手順（レビューアが再現する方法）

## 4. セキュリティ運用（固定ユーザー seed）
- 固定ユーザー認証情報は環境変数で管理し、コードへ直書きしない。
- `ALLOW_INSECURE_DEFAULT_LOGIN=true` はローカル開発を含め常時禁止。
- 初回起動・移行時は `doc/README.md` の固定ユーザー seed 手順に従い、設定漏れ時に fail-close で起動失敗することを確認する。

以上。運用で不足が見えたら随時更新する。
