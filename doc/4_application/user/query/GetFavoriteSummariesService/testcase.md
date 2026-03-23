# GetFavoriteSummariesService テストケース

## お気に入りメディアの概要一覧を取得できる
- **前提**
  - ユーザーに複数のお気に入りメディアが登録されている
  - `userRepository` がユーザーを返す
  - `mediaQueryRepository` が `mediaId`, `title`, `thumbnail`, `tags`, `priorityCategories` を含む overview 一覧を返す
  - 認証済みである
- **操作**
  - `GetFavoriteSummariesInput` にユーザーIDを指定して実行する
- **結果**
  - `mediaOverviews` にお気に入りメディアの概要一覧が格納される
  - エラーは発生しない

---

## ユーザーが存在しない場合は空配列を返す
- **前提**
  - `userRepository` が `null` を返す
  - 認証済みである
- **操作**
  - `GetFavoriteSummariesInput` にユーザーIDを指定して実行する
- **結果**
  - `mediaOverviews` に空配列が返却される
  - `mediaQueryRepository` は呼び出されない
  - エラーは発生しない

---

## お気に入りが0件の場合は空配列を返す
- **前提**
  - `userRepository` がお気に入り0件のユーザーを返す
  - 認証済みである
- **操作**
  - `GetFavoriteSummariesInput` にユーザーIDを指定して実行する
- **結果**
  - `mediaOverviews` に空配列が返却される
  - `mediaQueryRepository` は呼び出されない
  - エラーは発生しない

---

## メディア overview 取得に失敗した場合はエラーとなる
- **前提**
  - `userRepository` がユーザーを返す
  - `mediaQueryRepository` が例外を返す
  - 認証済みである
- **操作**
  - `GetFavoriteSummariesService` を実行する
- **結果**
  - エラーが返却される
