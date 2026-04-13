# GetQueueService

## 概要
- 指定ユーザーのあとで見る一覧を取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct GetQueueServiceInput #pink {
    + ユーザーID : string
}
```

## 出力

```plantuml
left to right direction

struct GetQueueServiceOutput #pink {
    + メディア一覧 : array<string>
}
```

## エラー処理
- あとで見る一覧の取得に失敗した場合はエラーとする

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: GetQueueService
Application -> Infrastructure: あとで見る一覧取得
Application <-- Infrastructure: あとで見る一覧
Controller <-- Application: あとで見る一覧
```

## 責務
- あとで見る一覧の取得はインフラ層に委譲する。
