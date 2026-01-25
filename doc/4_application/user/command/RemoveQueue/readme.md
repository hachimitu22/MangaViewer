# RemoveQueue

## 概要
指定ユーザーのあとで見るからメディアを削除する

## 種別
- Command

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
struct RemoveQueueInput #pink {
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

Controller -> Application: RemoveQueue
Application -> Infrastructure: ユーザー取得
Application <-- Infrastructure: ユーザー
Application -> Infrastructure: メディア存在チェック
Application <-- Infrastructure: メディア存在チェック結果
Application -> Media: あとで見る削除
Application -> Infrastructure: ユーザーを更新する
Controller <-- Application: 終了
```

## 責務
- ユーザーからのあとで見る削除の整合性チェックはドメインが行う。
- メディアの存在チェックはリポジトリで行う。
