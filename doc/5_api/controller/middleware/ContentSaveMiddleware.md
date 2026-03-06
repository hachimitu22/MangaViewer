# ContentSaveMiddleware

## 概要
- `multipart/form-data` の `contents` を保存するミドルウェア。
- コンテンツ順は `contents[].position` を正として決定する。
- 保存済みコンテンツに対応する `contentIds` を、`contents[].position` の順序でリクエストコンテキストへ設定する。
- `contents` 内の `file` が0件（空）の場合は無効入力として扱う。

## position ルール
- `position` は `1, 2, 3, ...` の連番で存在する必要がある。
- `1, 2, 4` のように欠番がある場合は異常とみなす。
- `2, 3, 4` のように `1` から開始していない場合は異常とみなす。
- `position` の重複は許可しない。
- `2, 1, 3, 5, 4` のように受信順が不規則でも、欠番がなく `1..N` を満たしていれば正常とみなす。

## 振る舞い
- `contents` の `file` が1件以上かつ `position` が有効で、保存に成功した場合、`position` 順でファイルを保存し、同順序の `contentIds` を設定して次のControllerへ処理を委譲する。
- `contents` の `file` が0件（空）の場合は無効として失敗レスポンスを返し、後続のControllerは実行しない。
- `position` が無効な場合は失敗レスポンスを返し、後続のControllerは実行しない。
- コンテンツ保存に失敗した場合、失敗レスポンスを返し、後続のControllerは実行しない。
