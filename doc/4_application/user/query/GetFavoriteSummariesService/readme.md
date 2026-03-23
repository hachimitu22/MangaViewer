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
}
```

## 出力

```plantuml
left to right direction

struct Output #pink {
    + mediaOverviews : array<MediaOverview>
}

struct MediaOverview {
    + mediaId : string
    + title : string
    + thumbnail : string
    + tags : array<object>
    + priorityCategories : array<string>
}
```

## 振る舞い
- `userRepository.findByUserId` で `userId` に対応するユーザーを取得する。
- ユーザーが存在しない場合は `Output({ mediaOverviews: [] })` を返す。
- ユーザーの `favorite` から `mediaId` 一覧を取得する。
- `favorite` が 0 件の場合は `Output({ mediaOverviews: [] })` を返す。
- `mediaQueryRepository.findOverviewsByMediaIds` で `mediaOverviews` を取得して返す。

## エラー処理
- 入力が `Input` でない場合はエラーとする。
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
  Controller <-- Application: Output(mediaOverviews = [])
else user が存在する
  Application -> Application: favorite から mediaId 一覧を生成
  alt favorite が 0 件
    Controller <-- Application: Output(mediaOverviews = [])
  else favorite が 1 件以上
    Application -> MediaQueryRepository: findOverviewsByMediaIds(mediaIds)
    Application <-- MediaQueryRepository: mediaOverviews
    Controller <-- Application: Output(mediaOverviews)
  end
end
```

## 責務
- お気に入り対象の `mediaId` 解決はユーザー集約から行う。
- 一覧描画向けの `mediaOverviews` 取得はクエリリポジトリに委譲する。
