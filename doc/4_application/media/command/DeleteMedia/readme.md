# DeleteMedia

## 概要
- 1メディアを削除する。

## 種別
- Command

## アクター
- 管理者

## 前提条件
- 管理者として認証済みであること。

## 入力

```plantuml
struct DeleteMediaInput #pink {
    + メディアID : string
}
```

## 出力
なし

## エラー処理
- 指定されたメディアが存在しない場合はエラーとする。
- 削除失敗時はエラーとする。

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
```

## 責務
- メディアの存在チェックはリポジトリで行う。
- メディアの削除はリポジトリで行う。
