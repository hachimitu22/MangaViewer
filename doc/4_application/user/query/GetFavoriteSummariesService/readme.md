# GetFavoriteSummariesService

## 概要
- 指定ユーザーのお気に入り一覧を `mediaOverviews` として取得する。
- ユーザーが存在しない場合、またはお気に入り件数が 0 件の場合は空配列を返す。

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct Input #pink {
    + userId : string
    + sort : string = "date_asc"
    + page : number = 1
}
```

- `userId`
  - 必須。空文字以外の文字列であること。
- `sort`
  - 省略時の既定値は `date_asc`。
  - 許可値は `date_asc` / `date_desc` / `title_asc` / `title_desc` のみ。
- `page`
  - 省略時の既定値は `1`。
  - 1 以上の整数であること。

## 出力

```plantuml
left to right direction

struct Output #pink {
    + mediaOverviews : array<MediaOverview>
    + totalCount : number
}

struct MediaOverview {
    + mediaId : string
    + title : string
    + thumbnail : string
    + tags : array<object>
    + priorityCategories : array<string>
}
```

- `mediaOverviews`
  - 1 ページあたり 20 件（`PAGE_SIZE=20`）を上限として返す。
  - `page` が総ページ数を超える場合は空配列を返す。
- `totalCount`
  - ページング適用前（全 favorite 件数）の件数を返す。
  - `mediaOverviews` が空配列でも、該当ユーザーに favorite が存在する場合は全件数を保持する。

## 振る舞い
- `userRepository.findByUserId` で `userId` に対応するユーザーを取得する。
- ユーザーが存在しない場合は `Output({ mediaOverviews: [], totalCount: 0 })` を返す。
- ユーザーの `favorite` から `mediaId` 一覧を取得する。
- `favorite` が 0 件の場合は `Output({ mediaOverviews: [], totalCount: 0 })` を返す。
- `mediaQueryRepository.findOverviewsByMediaIds` で `mediaOverviews` を取得する。
- 取得した `mediaOverviews` を `sort` 指定で並び替える。
  - `date_desc`: favorite 追加順（新しい順）
  - `date_asc`: favorite 追加順の逆順（古い順）
  - `title_asc`: `title` 昇順（同一タイトル時は `mediaId` 昇順）
  - `title_desc`: `title` 降順（同一タイトル時は `mediaId` 昇順）
- `page` と `PAGE_SIZE=20` を用いて、`(page-1)*20` から 20 件を返す。
- `Output.totalCount` にはページング前件数、`Output.mediaOverviews` にはページング後配列を設定して返す。

## エラー処理
- 入力が `Input` でない場合はエラーとする。
- `Input` のバリデーションに違反（`userId` が空、`sort` が許可値外、`page` が 1 以上の整数でない）の場合はエラーとする。
- ユーザー取得または `mediaOverviews` 取得に失敗した場合はエラーとする。

## シーケンス図

```plantuml
participant Controller
participant Application
participant UserRepository
participant MediaQueryRepository

Controller -> Application: execute(Input)
Application -> UserRepository: findByUserId(userId)
Application <-- UserRepository: user | null
alt user が存在しない
  Controller <-- Application: Output(mediaOverviews = [], totalCount = 0)
else user が存在する
  Application -> Application: favorite から mediaId 一覧を生成
  alt favorite が 0 件
    Controller <-- Application: Output(mediaOverviews = [], totalCount = 0)
  else favorite が 1 件以上
    Application -> MediaQueryRepository: findOverviewsByMediaIds(mediaIds)
    Application <-- MediaQueryRepository: mediaOverviews
    Application -> Application: sort 指定で並び替え
    Application -> Application: page と PAGE_SIZE=20 で slice
    Controller <-- Application: Output(mediaOverviews(page分), totalCount(全件))
  end
end
```

## 責務
- お気に入り対象の `mediaId` 解決はユーザー集約から行う。
- 一覧描画向けの `mediaOverviews` 取得はクエリリポジトリに委譲する。
