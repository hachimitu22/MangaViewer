# アプリケーションサービス

## サービス一覧
### メディア
- command
  - [RegisterMediaService](./media/command/RegisterMediaService/readme.md)
  - [UpdateMediaService](./media/command/UpdateMediaService/readme.md)
  - [DeleteMediaService](./media/command/DeleteMediaService/readme.md)
- query
  - [SearchMediaService](./media/query/SearchMediaService/readme.md)
  - [GetMediaDetailService](./media/query/GetMediaDetailService/readme.md)
  - [GetMediaContentWithNavigationService](./media/query/GetMediaContentWithNavigationService/readme.md)
- port
  - [IMediaIdValueGenerator](./media/port/IMediaIdValueGenerator/readme.md)
  - [IMediaRepository](./media/port/IMediaRepository/readme.md)
  - [IMediaQueryRepository](./media/port/IMediaQueryRepository/readme.md)

## 実行コンテキスト設計方針
- 境界は Application Service の `execute` で開始する。
- Repository は実行コンテキストを引数で受け取らず、コンテキストオブジェクトから取得する。
- Application 層では `transaction` という語を使用せず、`unitOfWork` / `workContext` などの語彙を用いる。
