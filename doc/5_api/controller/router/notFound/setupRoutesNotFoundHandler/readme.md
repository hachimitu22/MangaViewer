# router (未定義ルート共通 404 ハンドラー)

## 概要
- `src/app/setupRoutes.js` の末尾で登録される共通 404 ハンドラーを対象にした設計書。
- 既存の screen / api ルートのいずれにも一致しなかったリクエストを受け取り、JSON の 404 応答を返す。
- 画面遷移用 URL と API URL を区別せず、最後段の共通フォールバックとして適用する。

## 対象
- `setupRoutes` 内で `app.use((_req, res) => { ... })` として登録される未定義ルート処理

## 発火条件
- `setupRoutes` で登録済みの screen ルート、および api ルートのいずれにも一致しないこと。
- `app.use(router)` を通過した後もレスポンスが確定していないこと。

## レスポンス仕様
- HTTP ステータスコードは `404`。
- レスポンスボディは JSON で、形式は `{ "message": "Not Found" }`。
- Content-Type は Express の `res.json()` により `application/json` となる。

## 適用範囲
- `/screen/...` のような画面ルートでも、対応する定義が存在しなければ本ハンドラーが応答する。
- `/api/...` のような API ルートでも、対応する定義が存在しなければ本ハンドラーが応答する。
- したがって未定義ルート時の 404 応答は、画面/API を問わず共通仕様として扱う。

## 関連テスト
- `__tests__/small/app/createApp.test.js` の統合テストで、画面系未定義ルートと API 系未定義ルートの双方が同一の 404 JSON 応答になることを継続確認する。

## 関連ドキュメント
- [small テスト観点](/doc/5_api/controller/router/notFound/setupRoutesNotFoundHandler/testcase.small.md)
- [medium テスト観点](/doc/5_api/controller/router/notFound/setupRoutesNotFoundHandler/testcase.medium.md)
