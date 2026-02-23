# AddFavoriteService

## 概要
指定ユーザーのお気に入りにメディアを追加する

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

struct FavoriteAddedResult {
}

struct NotFoundUserResult {
}

struct NotFoundMediaResult {
}

struct AlreadyAddedResult {
}

Result <|- FavoriteAddedResult
Result <|- NotFoundUserResult
Result <|- NotFoundMediaResult
Result <|- AlreadyAddedResult
```

## エラー処理
- 技術的障害（Repository接続失敗、タイムアウト等）は例外として通知する
- 業務的に存在しない場合は Result の具象型で表現する
  - FavoriteAddedResult : お気に入り追加成功
  - AlreadyAddedResult : 既に追加されている
  - NotFoundUserResult : ユーザーが存在しない
  - NotFoundMediaResult : メディアが存在しない

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant User
end box
participant UserRepository
participant MediaRepository

Controller -> Application: AddFavoriteService
Application -> UserRepository: ユーザー取得
Application <-- UserRepository: ユーザー
Application -> MediaRepository: メディア存在チェック
Application <-- MediaRepository: メディア存在チェック結果
Application -> User: お気に入り追加
Application -> UserRepository: ユーザーを更新する
Application -> Application: Result作成
Controller <-- Application: Result
```
