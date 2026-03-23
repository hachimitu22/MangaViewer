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
  - `mediaQueryRepository.findOverviewsByMediaIds` は呼ばれない
  - エラーは発生しない

## medium テスト方針
- medium では favorite 永続化結果をもとに `mediaOverviews` が返ることを確認し、単純値オブジェクトは上位層経由で間接保証する。
