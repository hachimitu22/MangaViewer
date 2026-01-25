# AddFavorite

## 概要
指定ユーザーのお気に入りにメディアを追加する

## 種別
- Command

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
struct AddFavoriteInput #pink {
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

Controller -> Application: AddFavorite
Application -> Infrastructure: ユーザー取得
Application <-- Infrastructure: ユーザー
Application -> Infrastructure: メディア存在チェック
Application <-- Infrastructure: メディア存在チェック結果
Application -> Media: お気に入り追加
Application -> Infrastructure: ユーザーを更新する
Controller <-- Application: 終了
```

## 責務
- ユーザーへのお気に入り追加の整合性チェックはドメインが行う。
