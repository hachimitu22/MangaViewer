# MediaDeleteController テストケース

## テスト観点
- 正常系: 有効 `mediaId` で `200 + { code: 0 }`。
- バリデーション異常: 不正 `mediaId` で `400 + { message: 'Bad Request' }`。
- サービス例外: 例外時は `500 + { message: 'Internal Server Error' }`。

## 正常系
### mediaId を使ってメディア削除に成功する
- **前提**: `req.params.mediaId` が有効。
- **結果**:
  - `DeleteMediaServiceInput(id)` を使って `DeleteMediaService.execute` を呼ぶ。
  - `200` と `{ "code": 0 }` を返す。

## 異常系
### mediaIdが未設定/空文字の場合は400を返す
- **結果**:
  - `DeleteMediaService` を呼び出さない。
  - `400` と `{ "message": "Bad Request" }` を返す。

### DeleteMediaService が失敗した場合は500を返す
- **前提**: `DeleteMediaService.execute` が例外を送出。
- **結果**: `500` と `{ "message": "Internal Server Error" }` を返す。
