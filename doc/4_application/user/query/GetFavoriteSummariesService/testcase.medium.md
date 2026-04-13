# GetFavoriteSummariesService テストケース

## favorite を mediaOverviews に変換して返す
- **前提**
  - 対象ユーザーが存在する
  - ユーザーに複数の favorite が登録されている
  - `mediaQueryRepository.findOverviewsByMediaIds` が対応する `mediaOverviews` を返す
- **操作**
  - `Input` に `userId` を指定して実行する
- **結果**
  - `userRepository.findByUserId` が `userId` で呼ばれる
  - `mediaQueryRepository.findOverviewsByMediaIds` が favorite の `mediaId` 配列で呼ばれる
  - `Output.mediaOverviews` に favorite 件数分のメディア概要が格納される
  - `Output.totalCount` に favorite 総件数が格納される
  - エラーは発生しない

---

## sort=title_asc を指定するとタイトル昇順で返す
- **前提**
  - 対象ユーザーが存在する
  - favorite にタイトル順が不規則な複数件のメディアが登録されている
- **操作**
  - `Input` に `sort=title_asc` を指定して実行する
- **結果**
  - `Output.mediaOverviews` がタイトル昇順に並ぶ
  - `Output.totalCount` は全件数を保持する
  - エラーは発生しない

---

## page=2 を指定すると 21 件目以降のみ返す
- **前提**
  - 対象ユーザーが存在する
  - favorite が 21 件以上登録されている
- **操作**
  - `Input` に `page=2` を指定して実行する
- **結果**
  - `Output.mediaOverviews` には 21 件目以降のページ分だけが格納される
  - `Output.totalCount` は全件数を保持する
  - エラーは発生しない

---

## favorite が 0 件の場合は空配列を返す
- **前提**
  - 対象ユーザーが存在する
  - ユーザーの favorite が 0 件である
- **操作**
  - `Input` に `userId` を指定して実行する
- **結果**
  - `Output.mediaOverviews` として空配列が返る
  - `Output.totalCount` は 0 になる
  - `mediaQueryRepository.findOverviewsByMediaIds` は呼ばれない
  - エラーは発生しない

---

## user が存在しない場合は空配列を返す
- **前提**
  - `userRepository.findByUserId` が `null` を返す
- **操作**
  - `Input` に `userId` を指定して実行する
- **結果**
  - `Output.mediaOverviews` として空配列が返る
  - `Output.totalCount` は 0 になる
  - `mediaQueryRepository.findOverviewsByMediaIds` は呼ばれない
  - エラーは発生しない

## medium テスト方針
- medium では favorite 永続化結果をもとに `mediaOverviews` が返ることを確認し、単純値オブジェクトは上位層経由で間接保証する。
