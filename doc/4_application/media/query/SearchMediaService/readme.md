# SearchMediaService

## 概要
- 条件に合うメディアを検索する。
- 検索で取得できる件数は20件までとする。

## 種別
- Query

## アクター
- ユーザー

## 前提条件
- ユーザーとして認証済みであること。

## 入力
- `Input` は `title` / `tags` / `sortType` / `start` / `size` を受け取る。
- 詳細な型・制約・`sortType` の列挙値は [SearchCondition 設計書](/doc/4_application/media/port/SearchCondition/readme.md) を参照する。
- `SearchMediaService` では画面入力 DTO を `SearchCondition` に変換してリポジトリへ渡す。

## 出力
- `Output` は `mediaOverviews` と `totalCount` を返す。
- `mediaOverviews` / `totalCount` の詳細構造は [SearchResult 設計書](/doc/4_application/media/port/SearchResult/readme.md) を参照する。
- `SearchMediaService` は `SearchResult` を受け取り、画面利用しやすい DTO として再正規化して返却する。

## エラー処理
- 検索失敗時はエラーとする。
- 検索結果が0件の場合は失敗扱いしない。

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant Infrastructure

Controller -> Application: SearchMediaService
Application -> Infrastructure: メディア検索
Application <-- Infrastructure: メディア一覧
Controller <-- Application: メディア一覧
```
