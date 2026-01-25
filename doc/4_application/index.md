# アプリケーションサービス

## サービス一覧
### メディア
- command
  - [RegisterMedia](./media/command/RegisterMedia/readme.md)
  - [UpdateMedia](./media/command/UpdateMedia/readme.md)
  - [DeleteMedia](./media/command/DeleteMedia/readme.md)
  - [UploadContent](./media/command/UploadContent/readme.md)
- query
  - [SearchMedia](./media/query/SearchMedia/readme.md)
  - [GetMedia](./media/query/GetMedia/readme.md)
  - [GetMediaPage](./media/query/GetMediaPage/readme.md)
  - [GetCategories](./media/query/GetCategories/readme.md)
  - [GetTags](./media/query/GetTags/readme.md)

### ユーザー
- command
  - [AddFavorite](./user/command/AddFavorite/readme.md)
  - [RemoveFavorite](./user/command/RemoveFavorite/readme.md)
  - [AddQueue](./user/command/AddQueue/readme.md)
  - [RemoveQueue](./user/command/RemoveQueue/readme.md)
- query
  - [GetFavorites](./user/query/GetFavorites/readme.md)
  - [GetQueue](./user/query/GetQueue/readme.md)

---

## テストケース一覧

|   サービス名   |                     テストケース名                     |
| -------------- | ------------------------------------------------------ |
| DeleteMedia    | 指定したメディアを削除できる                           |
| DeleteMedia    | 存在するメディアIDを指定した場合に削除が成功する       |
| DeleteMedia    | 指定されたメディアが存在しない場合は削除できない       |
| DeleteMedia    | Repository で削除処理に失敗した場合は削除できない      |
| RegisterMedia  | メディアを登録できる                                   |
| RegisterMedia  | タグが重複していても登録できる                         |
| RegisterMedia  | コンテンツ一覧が無効なため登録に失敗する               |
| RegisterMedia  | カテゴリー優先度に矛盾があるため登録に失敗する         |
| RegisterMedia  | メディアの永続化に失敗した場合はエラーとなる           |
| UpdateMedia    | メディアを正常に更新できる                             |
| UpdateMedia    | タグが重複していても正常に更新される                   |
| UpdateMedia    | メディアが存在しない場合はエラーとなる                 |
| UpdateMedia    | 無効なコンテンツが含まれる場合はエラーとなる           |
| UpdateMedia    | カテゴリー優先度に矛盾がある場合はエラーとなる         |
| UpdateMedia    | 永続化に失敗した場合はエラーとなる                     |
| UploadContent  | コンテンツを保存できる                                 |
| UploadContent  | 複数コンテンツをまとめて保存できる                     |
| UploadContent  | コンテンツ保存に失敗した場合はエラーとなる             |
| UploadContent  | 空のコンテンツ一覧を指定した場合はエラーとなる         |
| UploadContent  | 無効なパスが含まれている場合はエラーとなる             |
| SearchMedia    | 条件に一致するメディア一覧を取得できる                 |
| SearchMedia    | 複数条件（タグ・カテゴリーなど）で検索できる           |
| SearchMedia    | ソート条件を指定して取得できる                         |
| SearchMedia    | ページング条件を指定して取得できる                     |
| SearchMedia    | 検索結果が0件でも空配列を返す                          |
| SearchMedia    | ページング範囲外でも空配列を返す                       |
| SearchMedia    | 最大件数制限が正しく適用される                         |
| SearchMedia    | ソート未指定時はデフォルト順で返る                     |
| SearchMedia    | ページ情報（総件数・現在ページ等）が正しく返る         |
| SearchMedia    | 不正なページング条件の場合は取得できない               |
| SearchMedia    | Repository（ReadModel）取得に失敗した場合は失敗する    |
| GetMedia       | 指定したメディアIDの詳細を取得できる                   |
| GetMedia       | タグ・カテゴリー・コンテンツ情報を含めて取得できる     |
| GetMedia       | 表示用DTO形式で取得できる（ドメインを返さない）        |
| GetMedia       | 存在しないメディアIDの場合は取得できない               |
| GetMedia       | Repository（ReadModel）取得に失敗した場合は失敗する    |
| GetMediaPage   | 指定したメディアIDとページ番号でコンテンツを取得できる |
| GetMediaPage   | 最初のページを取得できる                               |
| GetMediaPage   | 最後のページを取得できる                               |
| GetMediaPage   | ページング用情報（総ページ数等）を取得できる           |
| GetMediaPage   | ページ番号が範囲内であれば取得できる                   |
| GetMediaPage   | ページ番号が範囲外の場合は取得できない                 |
| GetMediaPage   | 存在しないメディアIDの場合は取得できない               |
| GetMediaPage   | Repository（ReadModel）取得に失敗した場合は失敗する    |
| GetCategories  | 登録済みカテゴリー一覧を取得できる                     |
| GetCategories  | 優先度順でカテゴリー一覧を取得できる                   |
| GetCategories  | カテゴリーが存在しない場合は空配列を返す               |
| GetCategories  | Repository（ReadModel）取得に失敗した場合は失敗する    |
| GetTags        | 登録済みタグ一覧を取得できる                           |
| GetTags        | カテゴリー別にタグ一覧を取得できる                     |
| GetTags        | 指定カテゴリーのタグが存在しない場合は空配列を返す     |
| GetTags        | Repository（ReadModel）取得に失敗した場合は失敗する    |
| AddFavorite    | メディアをお気に入りに追加できる                       |
| AddFavorite    | ユーザーが存在しない場合はエラーとなる                 |
| AddFavorite    | メディアが存在しない場合はエラーとなる                 |
| AddFavorite    | 同じメディアを複数回お気に入りに追加できない           |
| AddFavorite    | 永続化に失敗した場合はエラーとなる                     |
| RemoveFavorite | お気に入りからメディアを削除できる                     |
| RemoveFavorite | ユーザーが存在しない場合はエラーとなる                 |
| RemoveFavorite | メディアが存在しない場合はエラーとなる                 |
| RemoveFavorite | お気に入りしていないメディアは削除できない             |
| RemoveFavorite | 永続化に失敗した場合はエラーとなる                     |
| AddQueue       | メディアをあとで見るに追加できる                       |
| AddQueue       | ユーザーが存在しない場合はエラーとなる                 |
| AddQueue       | メディアが存在しない場合はエラーとなる                 |
| AddQueue       | 同じメディアを複数回あとで見るに追加できない           |
| AddQueue       | 永続化に失敗した場合はエラーとなる                     |
| RemoveQueue    | あとで見るからメディアを削除できる                     |
| RemoveQueue    | ユーザーが存在しない場合はエラーとなる                 |
| RemoveQueue    | メディアが存在しない場合はエラーとなる                 |
| RemoveQueue    | あとで見るに追加していないメディアは削除できない       |
| RemoveQueue    | 永続化に失敗した場合はエラーとなる                     |
