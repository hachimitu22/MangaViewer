# GetMediaContentWithNavigationService

## 概要
- メディア内の指定されたコンテンツと、その前後に位置するコンテンツを決定する。

## 種別
- Query

## アクター
- ユーザー

## 入力

```plantuml
left to right direction

struct Input #pink {
    + mediaId : string
    + contentPosition : number
}

Note right of Input
    contentPositionは1以上
End Note

```

## 出力

```plantuml
left to right direction

interface Result #pink {
}

struct FoundResult {
    + contentId : string
    + previousContentId : string | null
    + nextContentId : string | null
}

struct MediaNotFoundResult {
}

struct ContentNotFoundResult {
}

Result <|- FoundResult
Result <|- MediaNotFoundResult
Result <|- ContentNotFoundResult

```

## エラー処理
- 技術的障害（Repository接続失敗、タイムアウト等）は例外として通知する
- 業務的に存在しない場合は Result の具象型（MediaNotFoundResult / ContentNotFoundResult）で表現する

## シーケンス図

```plantuml
participant Controller
participant Application
box Domain #LightBlue
  participant Media
end box
participant MediaRepository

Controller -> Application: GetMediaContentWithNavigationService
Application -> MediaRepository: メディア取得
Application <-- MediaRepository: メディア
Application -> Media: コンテンツと前後のコンテンツを取得
Application <-- Media: コンテンツ情報
Application -> Application: Result作成
Controller <-- Application: Result
```

## テスト観点
### 正常系
- 中間コンテンツを指定した場合
- 先頭コンテンツを指定した場合
- 末尾コンテンツを指定した場合

### 業務エラー
- メディアが存在しない場合
- コンテンツが存在しない場合

### 技術エラー
- リポジトリ操作でエラーが発生した場合


## 関連ドキュメント
- [テストケース](./testcase.medium.md)
- [ScreenViewerGetController 設計書](/doc/5_api/controller/screen/ScreenViewerGetController/readme.md)
- [router (GET /screen/viewer/:mediaId/:mediaPage) 設計書](/doc/5_api/controller/router/screen/setRouterScreenViewerGet/readme.md)
