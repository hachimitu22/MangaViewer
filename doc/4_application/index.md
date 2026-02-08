# アプリケーションサービス

## サービス一覧
### メディア
- command
  - [RegisterMediaService](./media/command/RegisterMediaService/readme.md)
  - [UpdateMediaService](./media/command/UpdateMediaService/readme.md)
  - [DeleteMediaService](./media/command/DeleteMediaService/readme.md)
- query
  - [SearchMediaService](./media/query/SearchMediaService/readme.md)
  - [GetMediaService](./media/query/GetMediaService/readme.md)
  - [GetMediaPageService](./media/query/GetMediaPageService/readme.md)
  - [GetCategoriesService](./media/query/GetCategoriesService/readme.md)
  - [GetTagsService](./media/query/GetTagsService/readme.md)
- port
  - [IMediaIdValueGenerator](./media/port/IMediaIdValueGenerator/readme.md)
  - [IMediaRepository](./media/port/IMediaRepository/readme.md)
  - [IMediaQueryRepository](./media/port/IMediaQueryRepository/readme.md)

### ユーザー
- command
  - [AddFavorite](./user/command/AddFavorite/readme.md)
  - [RemoveFavorite](./user/command/RemoveFavorite/readme.md)
  - [AddQueue](./user/command/AddQueue/readme.md)
  - [RemoveQueue](./user/command/RemoveQueue/readme.md)
- query
  - [GetFavorites](./user/query/GetFavorites/readme.md)
  - [GetQueue](./user/query/GetQueue/readme.md)
