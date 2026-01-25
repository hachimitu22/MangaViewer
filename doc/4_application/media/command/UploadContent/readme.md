# UploadContent

## 概要
- コンテンツを保存する

## 種別
- Command

## アクター
- 管理者

## 前提条件
- 管理者として認証済みであること。

## 入力

```plantuml
left to right direction

struct UploadContentInput #pink {
    + コンテンツ一覧 : array<ContentInput>
}

struct ContentInput {
    + パス : string
}

UploadContentInput o- ContentInput
```

## 出力

```plantuml
struct UploadContentOutput #pink {
    + 成否 : boolean
}
```

## エラー処理
- コンテンツの保存に失敗した場合はエラーとする。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: UploadContent
Application -> Infrastructure: コンテンツ保存
Application <-- Infrastructure: 保存成否
Controller <-- Application: 保存成否
```

## 責務
- コンテンツ、タグ、カテゴリー優先度の整合性チェックはドメインが行う。
