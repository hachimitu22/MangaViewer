# AddQueue

## 概要
指定ユーザーのあとで見るにメディアを追加する

## 種別
- Command

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
struct AddQueueInput #pink {
    + ユーザーID : string
    + メディアID : string
}
```

## 出力
なし

## エラー処理
- ユーザーが存在しない場合はエラーとする。
- メディアが存在しない場合はエラーとする。
- 永続化の失敗時はエラーとする。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: AddQueue
Application -> Infrastructure: ユーザー取得
Application <-- Infrastructure: ユーザー
Application -> Infrastructure: メディア存在チェック
Application <-- Infrastructure: メディア存在チェック結果
Application -> Media: あとで見る追加
Application -> Infrastructure: ユーザーを更新する
Controller <-- Application: 終了
```

## 責務
- ユーザーへのあとで見る追加の整合性チェックはドメインが行う。
