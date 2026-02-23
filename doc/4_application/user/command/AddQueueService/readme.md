# AddQueueService

## 概要
指定ユーザーのあとで見るにメディアを追加する

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

struct QueueAddedResult {
}

struct NotFoundUserResult {
}

struct NotFoundMediaResult {
}

struct AlreadyAddedResult {
}

Result <|- QueueAddedResult
Result <|- NotFoundUserResult
Result <|- NotFoundMediaResult
Result <|- AlreadyAddedResult
```

## エラー処理
- 技術的障害（Repository接続失敗、タイムアウト等）は例外として通知する
- 業務的に存在しない場合は Result の具象型で表現する
  - QueueAddedResult : あとでみる追加成功
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

Controller -> Application: AddQueueService
Application -> UserRepository: ユーザー取得
Application <-- UserRepository: ユーザー
Application -> MediaRepository: メディア存在チェック
Application <-- MediaRepository: メディア存在チェック結果
Application -> User: あとで見る追加
Application -> UserRepository: ユーザーを更新する
Application -> Application: Result作成
Controller <-- Application: Result
```
