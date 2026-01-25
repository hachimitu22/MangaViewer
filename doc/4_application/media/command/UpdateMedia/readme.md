# UpdateMedia

## 概要
- 1メディアを更新する。
- タグの関連付けも同時に更新する。
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

struct UpdateMediaInput #pink {
    + メディアID : string
    + タイトル : string
    + コンテンツ一覧 : array<string>
    + タグ一覧 : array<TagInput>
    + カテゴリー優先度 : array<string>
}
Note right of UpdateMediaInput
  コンテンツ一覧：パス文字列の配列
  カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

struct TagInput {
    + カテゴリー名 : string
    + ラベル名 : string
}

UpdateMediaInput o- TagInput
```

## 出力

```plantuml
left to right direction

struct UpdateMediaOutput #pink {
    + メディアID : string
}
```

## エラー処理
- メディアが存在しない場合はエラーとする。
- 無効なコンテンツが存在する場合はエラーとする。
- タグの重複はメディア集約の不変条件として排除するためエラーとしない。
- カテゴリー優先度に矛盾が存在する場合はエラーとする。
- 永続化の失敗時はエラーとする。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: UpdateMedia
Application -> Infrastructure: メディア取得
Application <-- Infrastructure: メディア
Application -> Media: メディアを更新
Application -> Infrastructure: メディアを上書きする
Controller <-- Application: メディアID
```

## 責務
- コンテンツ、タグ、カテゴリー優先度の整合性チェックはドメインが行う。
