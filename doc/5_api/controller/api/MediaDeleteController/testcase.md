# MediaDeleteController テストケース

## テスト観点
- 正常系: `mediaId` を使って削除に成功し `code=0` を返す。
- 入力不備: `mediaId` 未設定・空文字時はサービスを呼ばず `code=1` を返す。
- サービス失敗: `DeleteMediaService` 例外時は `code=1` を返す。
- 想定外例外: 失敗レスポンス形式を維持する。

## 正常系

### mediaId を使ってメディア削除に成功する
- **前提**
  - `req.params.mediaId` が空文字ではない `string`。
  - `DeleteMediaService.execute` が正常終了する。
- **操作**
  - `MediaDeleteController.execute` を実行する。
- **結果**
  - `DeleteMediaServiceInput` に `id=mediaId` を設定してサービスを呼び出す。
  - HTTPステータス `200` と `{"code":0}` を返す。

## 異常系

### mediaIdが未設定の場合は削除失敗を返す
- **前提**
  - `req.params.mediaId` が未設定である。
- **操作**
  - `MediaDeleteController.execute` を実行する。
- **結果**
  - `DeleteMediaService` を呼び出さない。
  - HTTPステータス `200` と `{"code":1}` を返す。

### mediaIdが空文字の場合は削除失敗を返す
- **前提**
  - `req.params.mediaId` が空文字である。
- **操作 / 結果**
  - 上記と同様に `DeleteMediaService` を呼び出さず `code=1` を返す。

### DeleteMediaService が失敗した場合は code=1 を返す
- **前提**
  - `req.params.mediaId` は有効である。
  - `DeleteMediaService.execute` が例外を送出する。
- **操作**
  - `MediaDeleteController.execute` を実行する。
- **結果**
  - HTTPステータス `200` と `{"code":1}` を返す。

### 想定外例外発生時も失敗レスポンス形式を維持する
- **前提**
  - Controller内部で想定外例外が発生する。
- **操作**
  - `MediaDeleteController.execute` を実行する。
- **結果**
  - 例外を外へ送出せず、HTTPステータス `200` と `{"code":1}` を返す。
