# SearchMedia

## 概要
- 条件に合うメディアを検索する。

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct SearchMediaInput #pink {
    + タイトル : string
    + タグ一覧 : array<TagInput>
    + ソート方法 : SortType
}

struct TagInput {
    + カテゴリー名 : string
    + ラベル名 : string
}

enum SortType {
    + 登録日順
    + 登録日逆順
    + タイトル順
    + タイトル逆順
    + ランダム
}

SearchMediaInput o- TagInput
SearchMediaInput o- SortType
```

## 出力

```plantuml
left to right direction

struct SearchMediaOutput #pink {
    + メディア一覧 : array<MediaOverview>
}

struct MediaOverview {
    + メディアID : string
    + タイトル : string
    + サムネイル : string
    + タグ一覧 : array<TagOutput>
    + カテゴリー優先度 : array<string>
}

struct TagOutput {
  + カテゴリー名 : string
  + ラベル名 : string
}

Note right of MediaOverview
  サムネイル：パス文字列
  カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

SearchMediaOutput o- MediaOverview
MediaOverview o- TagOutput
```

## エラー処理
- 検索失敗時はエラーとする。
  - 検索結果が0件の場合は失敗扱いしない。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: SearchMedia
Application -> Infrastructure: メディア検索
Application <-- Infrastructure: メディア一覧
Controller <-- Application: メディア一覧
```

## 責務
- 検索性能・取得方法の最適化はインフラ層に委譲する。
