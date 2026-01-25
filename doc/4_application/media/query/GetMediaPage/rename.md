# GetMediaPage

## 概要
- 指定メディアの指定ページ情報を取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct GetMediaPageInput #pink {
    + メディアID : string
    + ページ番号 : number
}
```

## 出力

```plantuml
left to right direction

struct GetMediaPageOutput #pink {
    + コンテンツパス : string
    + 前ページ番号 : number
    + 次ページ番号 : number
}
```

## エラー処理
- メディアの取得に失敗した場合はエラーとする

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: GetMedia
Application -> Infrastructure: メディアページ取得
Application <-- Infrastructure: メディアページ
Controller <-- Application: メディアページ
```

## 責務
- メディアページの取得はインフラ層に委譲する。
