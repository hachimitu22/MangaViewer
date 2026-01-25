# GetFavorites

## 概要
- 指定ユーザーのお気に入り一覧を取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct GetFavoritesInput #pink {
    + ユーザーID : string
}
```

## 出力

```plantuml
left to right direction

struct GetFavoritesOutput #pink {
    + メディア一覧 : array<string>
}
```

## エラー処理
- お気に入り一覧の取得に失敗した場合はエラーとする

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: GetFavorites
Application -> Infrastructure: お気に入り一覧取得
Application <-- Infrastructure: お気に入り一覧
Controller <-- Application: お気に入り一覧
```

## 責務
- お気に入り一覧の取得はインフラ層に委譲する。
