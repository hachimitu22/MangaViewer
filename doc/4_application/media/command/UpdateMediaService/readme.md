# UpdateMediaService

## 概要
- 1つのメディアを更新する。
- 更新成功時のみ永続化される。

## 種別
- Command

## アクター
- 管理者

## 前提条件
- 管理者として認証済みであること。

## 入力

```plantuml
left to right direction

struct UpdateMediaServiceInput #pink {
    + メディアID : string
    + タイトル : string
    + コンテンツ一覧 : array<string>
    + タグ一覧 : array<TagInput>
    + カテゴリー優先度 : array<string>
}
Note right of UpdateMediaServiceInput
  コンテンツ一覧：パス文字列の配列
  カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

struct TagInput {
    + カテゴリー名 : string
    + ラベル名 : string
}

UpdateMediaServiceInput o- TagInput
```

## 出力

なし

## エラー処理
- メディアが存在しない場合は更新失敗とする。
- 無効なコンテンツが存在する場合は更新失敗とする。
- タグの重複はメディア集約の不変条件として排除するため更新失敗としない。
- カテゴリー優先度に矛盾はメディア集約の不変条件として排除するため更新失敗としない。
- 永続化の失敗時は更新失敗とする。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: UpdateMediaService
Application -> Infrastructure: メディア取得
Application <-- Infrastructure: メディア
Application -> Media: メディアを更新
Application -> Infrastructure: メディアを上書きする
Controller <-- Application
```
