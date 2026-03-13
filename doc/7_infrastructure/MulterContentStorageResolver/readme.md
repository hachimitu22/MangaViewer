# MulterContentStorageResolver 設計書

## 目的
`IContentStorageResolver.js` の具象クラスとして、`multer()` の戻り値を利用したアップロード処理を提供する。

## クラス
- クラス名: `MulterContentStorageResolver`
- 配置: `src/infrastructure/MulterContentStorageResolver.js`

## 入力仕様
- コンストラクタは `multer()` の戻り値を受け取る。
- `multer()` の戻り値でない場合はエラーを送出する。

## 振る舞い
- `resolveSingle(fieldName = 'contents')` で単一ファイルアップロード用の Express ミドルウェアを返す。
- `fieldName` に対応するファイルがアップロードされた場合、以下を設定する。
  - `contentId`: `UUID` のハイフンを除去した32文字の文字列
  - `req.file.filename`: `contentId` と同じ値
  - `req.file.contentId`: `contentId` と同じ値
  - `req.contentId`: `contentId` と同じ値
- `fieldName` にファイルが存在しない場合は `contentId` を設定しない。

## 設計判断
- UUID生成は Node.js 標準の `crypto.randomUUID()` を利用し、外部依存を増やさない。
- `multer.memoryStorage()` でもファイル名情報を扱えるよう、`req.file` に `filename` / `contentId` を付与する。
- 生成した `contentId` を `req` にも載せることで、後続処理の実装を簡素化する。
