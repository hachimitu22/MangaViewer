# メディア詳細画面

## 画面説明
- メディアのサムネイルを表示する。
- サムネイルを選択することでメディアを閲覧する。

## URL
/detail/メディアID

## クエリパラメータ
なし

## APIエラー時の表示方針
- `PUT/DELETE /api/favorite/{mediaId}`、`PUT/DELETE /api/queue/{mediaId}`、または `POST /api/logout`（ナビゲーターのログアウト）がエラー系レスポンスを返した場合、画面上にエラーメッセージを表示し、ユーザーに再度実行を促す。
