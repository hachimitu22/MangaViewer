# GetMedia

## 概要
- 指定のメディアを取得する

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力

```plantuml
left to right direction

struct GetMediaInput #pink {
    + メディアID : string
}
```

## 出力

```plantuml
left to right direction

struct GetMediaOutput #pink {
    + メディア一覧 : array<MediaOverview>
}

struct MediaDetail {
    + メディアID : string
    + タイトル : string
    + サムネイル一覧 : array<Thumbnail>
    + タグ一覧 : array<TagOutput>
    + カテゴリー優先度 : array<string>
}

struct Thumbnail {
    + サムネイルパス : string
    + ページ番号 : number
}

struct TagOutput {
    + カテゴリー名 : string
    + ラベル名 : string
}

Note right of MediaDetail
    カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

GetMediaOutput o- MediaDetail
MediaDetail o- Thumbnail
MediaDetail o- TagOutput
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
Application -> Infrastructure: メディア取得
Application <-- Infrastructure: メディア
Controller <-- Application: メディア
```

## 責務
- メディアの取得はインフラ層に委譲する。

---

## テストケース一覧

### 正常系
- 指定したメディアIDとページ番号でコンテンツを取得できる
- 最初のページを取得できる
- 最後のページを取得できる
- ページング用情報（総ページ数等）を取得できる

### 境界・仕様確認
- ページ番号が範囲内であれば取得できる
- ページ番号が範囲外の場合は取得できない

### 異常系
- 存在しないメディアIDの場合は取得できない
- Repository（ReadModel）取得に失敗した場合は失敗する
