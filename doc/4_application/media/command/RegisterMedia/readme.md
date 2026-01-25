# RegisterMedia

## 概要
- 1メディアを登録する。
- タグの関連付けも同時に登録する。
- 登録成功時のみ永続化される。

## 種別
- Command

## アクター
- 管理者

## 前提条件
- 管理者として認証済みであること。

## 入力

```plantuml
left to right direction

struct RegisterMediaInput #pink {
    + タイトル : string
    + コンテンツ一覧 : array<string>
    + タグ一覧 : array<TagInput>
    + カテゴリー優先度 : array<string>
}
Note right of RegisterMediaInput
    カテゴリー優先度はカテゴリー名を優先度順に並べる
End Note

struct TagInput {
    + カテゴリー名 : string
    + ラベル名 : string
}

RegisterMediaInput o- TagInput
```

## 出力

```plantuml
struct RegisterMediaOutput #pink {
    + メディアID : string
}
```

## エラー処理
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

Controller -> Application: RegisterMedia
Application -> Infrastructure: メディアID生成
Application <-- Infrastructure: メディアID
Application -> Media: メディア生成
Application <-- Media: メディア
Application -> Media: タグ・カテゴリー優先度の関連付け
Application -> Infrastructure: メディアを保存する
Controller <-- Application: メディアID
```

## 責務
- コンテンツ、タグ、カテゴリー優先度の整合性チェックはドメインが行う。
