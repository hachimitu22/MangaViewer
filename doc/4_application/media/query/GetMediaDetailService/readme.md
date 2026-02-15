# GetMediaDetailService

## 概要
- 指定のメディアを取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct GetMediaDetailServiceInput #pink {
    + メディアID : string
}
```

## 出力

```plantuml
left to right direction

struct GetMediaDetailServiceOutput #pink {
    + メディア詳細 : MediaDetail
}

object MediaDetail {
    + メディアID : string
    + タイトル : string
    + コンテンツ一覧 : array<Content>
    + タグ一覧 : array<MediaDetailTag>
    + カテゴリー優先度 : array<string>
}

object Content {
    + コンテンツID
}

object MediaDetailTag {
    + カテゴリー名 : string
    + ラベル名 : string
}

Note right of MediaDetail
    カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

GetMediaDetailServiceOutput o- MediaDetail
MediaDetail o- Thumbnail
MediaDetail o- MediaDetailTag
```

## エラー処理
- リポジトリからの取得に失敗した場合は失敗とする
- メディアが存在しない場合は失敗とする

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: GetMediaDetailService
Application -> Infrastructure: メディア詳細取得
Application <-- Infrastructure: メディア詳細
Controller <-- Application: メディア詳細
```
