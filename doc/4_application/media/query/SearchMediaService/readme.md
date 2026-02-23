# SearchMediaService

## 概要
- 条件に合うメディアを検索する。
- 検索で取得できる件数は20件までとする。

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
    + タイトル : string
    + タグ一覧 : array<InputTag>
    + ソート方法 : InputSortType
    + 取得開始位置 : number
    + 取得数 : number
}

Note right of Input
    デフォルト値
        タイトル: なし
        タグ一覧 : なし
        ソート方法 : 登録日新しい順
        取得開始位置 : 必須
        取得数 : 必須
End Note

object InputTag {
    + カテゴリー名 : string
    + ラベル名 : string
}

enum InputSortType {
    + 登録日新しい順
    + 登録日古い順
    + タイトル順
    + タイトル逆順
    + ランダム
}

Input o- InputTag
Input o- InputSortType
```

## 出力

```plantuml
left to right direction

struct Output #pink {
    + メディア一覧 : array<MediaOverview>
    + 検索結果合計数 : number
}

struct MediaOverview {
    + メディアID : string
    + タイトル : string
    + サムネイル : string
    + タグ一覧 : array<MediaOverviewTag>
    + カテゴリー優先度 : array<string>
}

struct MediaOverviewTag {
    + カテゴリー名 : string
    + ラベル名 : string
}

Note right of MediaOverview
    サムネイル：パス文字列
    カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

Output o- MediaOverview
MediaOverview o- MediaOverviewTag
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

Controller -> Application: SearchMediaService
Application -> Infrastructure: メディア検索
Application <-- Infrastructure: メディア一覧
Controller <-- Application: メディア一覧
```
