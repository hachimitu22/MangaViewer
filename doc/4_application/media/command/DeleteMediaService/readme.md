# DeleteMediaService

## 概要
- 1つのメディアを削除する。
- 削除成功時のみ永続化される。

## 種別
- Command

## アクター
- 管理者

## 前提条件
- 管理者として認証済みであること。

## 入力

```plantuml
struct DeleteMediaServiceInput #pink {
    + メディアID : string
}
```

## 出力
なし

## エラー処理
- 指定されたメディアが存在しない場合は削除失敗とする。
- 永続化の失敗時は削除失敗とする。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: DeleteMedia
Application -> Infrastructure: メディアを削除する
Controller <-- Application
```
