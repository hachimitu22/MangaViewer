# RemoveFavoriteService

## 概要
指定ユーザーのお気に入りからメディアを削除する

## 種別
- Command

## 入力

```plantuml
struct Query #pink {
    + ユーザーID : string
    + メディアID : string
}
```

## 出力

```plantuml
left to right direction

struct Result #pink {
}

struct FavoriteRemovedResult {
}

struct NotFoundUserResult {
}

struct NotAddedMediaResult {
}

Result <|- FavoriteRemovedResult
Result <|- NotFoundUserResult
Result <|- NotAddedMediaResult
```

## エラー処理
- 技術的障害（Repository接続失敗、タイムアウト等）は例外として通知する
- 業務的に存在しない場合は Result の具象型で表現する
  - FavoriteRemovedResult : お気に入りから削除成功
  - NotFoundUserResult : ユーザーが存在しない
  - NotAddedMediaResult : お気に入りにメディアが存在しない

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant User
end box
participant UserRepository

Controller -> Application: RemoveFavoriteService
Application -> UserRepository: ユーザー取得
Application <-- UserRepository: ユーザー
Application -> User: お気に入り削除
Application -> UserRepository: ユーザーを更新する
Application -> Application: Result作成
Controller <-- Application: Result
```
