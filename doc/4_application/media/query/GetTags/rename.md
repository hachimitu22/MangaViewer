# GetTags

## 概要
- タグ一覧を取得する

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

struct GetTagsOutput #pink {
    + タグ一覧 : array<string>
}
```

## エラー処理
- タグ一覧の取得に失敗した場合はエラーとする

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: GetTags
Application -> Infrastructure: タグ一覧取得
Application <-- Infrastructure: タグ一覧
Controller <-- Application: タグ一覧
```

## 責務
- タグ一覧の取得はインフラ層に委譲する。
