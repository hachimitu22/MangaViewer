# GetCategories

## 概要
- カテゴリー一覧を取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力
なし

## 出力

```plantuml
left to right direction

struct GetCategoriesOutput #pink {
    + カテゴリー一覧 : array<string>
}
```

## エラー処理
- カテゴリー一覧の取得に失敗した場合はエラーとする

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: GetCategories
Application -> Infrastructure: カテゴリー一覧取得
Application <-- Infrastructure: カテゴリー一覧
Controller <-- Application: カテゴリー一覧
```

## 責務
- カテゴリー一覧の取得はインフラ層に委譲する。
