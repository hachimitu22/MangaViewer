# GetFavoriteSummariesService

## 概要
- 指定ユーザーのお気に入りメディアの概要一覧を取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct GetFavoriteSummariesInput #pink {
    + ユーザーID : string
}
```

## 出力

```plantuml
left to right direction

struct MediaTag #pink {
    + category : string
    + label : string
}

struct MediaOverview #pink {
    + mediaId : string
    + title : string
    + thumbnail : string
    + tags : array<MediaTag>
    + priorityCategories : array<string>
}

struct GetFavoriteSummariesOutput #pink {
    + mediaOverviews : array<MediaOverview>
}
```

## 振る舞い
- `userRepository` はユーザーIDからユーザーを取得し、お気に入りメディアID一覧の取得元となる。
- ユーザーが存在しない場合は空配列を返却する。
- お気に入りが0件の場合は空配列を返却する。
- `mediaQueryRepository` はお気に入りメディアID一覧を受け取り、各メディアの overview を取得する。

## エラー処理
- 入力が不正な場合はエラーとする。
- ユーザー取得またはメディア overview 取得に失敗した場合はエラーとする。

## シーケンス図

```plantuml
participant Controller
participant Application
participant UserRepository
participant MediaQueryRepository

Controller -> Application: GetFavoriteSummariesService
Application -> UserRepository: findByUserId(userId)
UserRepository --> Application: user | null

alt user が存在しない
  Application --> Controller: mediaOverviews = []
else user が存在する
  Application -> Application: favorite の mediaId 一覧を取得
  alt favorite が0件
    Application --> Controller: mediaOverviews = []
  else favorite が1件以上
    Application -> MediaQueryRepository: findOverviewsByMediaIds(mediaIds)
    MediaQueryRepository --> Application: mediaOverviews
    Application --> Controller: mediaOverviews
  end
end
```

## 責務
- Application Service は `userRepository` を利用してユーザーを取得し、お気に入りメディアID一覧を取り出す。
- Application Service は `mediaQueryRepository` を利用してメディア overview 一覧を取得する。
- overview の内容生成そのものは `mediaQueryRepository` に委譲する。
