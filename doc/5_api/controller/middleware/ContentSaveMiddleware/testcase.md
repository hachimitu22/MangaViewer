# ContentSaveMiddleware テストケース

## テストケース一覧
- [CSM-001: contentsをposition昇順で保存しcontentIdsを設定して委譲する](#csm-001-contentsをposition昇順で保存しcontentidsを設定して委譲する)
- [CSM-002: 受信順が不規則でもpositionが1..Nなら成功する](#csm-002-受信順が不規則でもpositionが1nなら成功する)
- [CSM-101: contentsが未指定の場合は失敗レスポンスを返す](#csm-101-contentsが未指定の場合は失敗レスポンスを返す)
- [CSM-102: contentsが配列以外の場合は失敗レスポンスを返す](#csm-102-contentsが配列以外の場合は失敗レスポンスを返す)
- [CSM-103: contentsが空配列の場合は失敗レスポンスを返す](#csm-103-contentsが空配列の場合は失敗レスポンスを返す)
- [CSM-104: fileが未指定または空の場合は失敗レスポンスを返す](#csm-104-fileが未指定または空の場合は失敗レスポンスを返す)
- [CSM-105: positionが整数でない場合は失敗レスポンスを返す](#csm-105-positionが整数でない場合は失敗レスポンスを返す)
- [CSM-106: positionに重複がある場合は失敗レスポンスを返す](#csm-106-positionに重複がある場合は失敗レスポンスを返す)
- [CSM-107: positionに欠番がある場合は失敗レスポンスを返す](#csm-107-positionに欠番がある場合は失敗レスポンスを返す)
- [CSM-108: positionが1始まりでない場合は失敗レスポンスを返す](#csm-108-positionが1始まりでない場合は失敗レスポンスを返す)
- [CSM-109: 保存処理失敗時は失敗レスポンスを返し後続へ委譲しない](#csm-109-保存処理失敗時は失敗レスポンスを返し後続へ委譲しない)

---

## 正常系

### CSM-001: contentsをposition昇順で保存しcontentIdsを設定して委譲する
- **前提**
  - `contents` は1件以上、各要素に `file` と `position`（整数）がある。
  - `position` は `1..N` の連番で重複がない。
  - `ContentStorage` が保存成功し `contentIds` を返す。
- **操作**
  - `ContentSaveMiddleware` を実行する。
- **期待結果**
  - `contents` を `position` 昇順に整列して保存する。
  - リクエストコンテキストに `contentIds: string[]` を設定する。
  - 次のミドルウェア / Controller に委譲する。

### CSM-002: 受信順が不規則でもpositionが1..Nなら成功する
- **前提**
  - 受信順が `2,1,3` など不規則。
  - `position` としては `1..N` を満たす。
- **操作**
  - `ContentSaveMiddleware` を実行する。
- **期待結果**
  - バリデーションを通過する。
  - 保存時は `position` 昇順で処理される。

---

## 異常系

### CSM-101: contentsが未指定の場合は失敗レスポンスを返す
- **前提**: `contents` が未指定。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-102: contentsが配列以外の場合は失敗レスポンスを返す
- **前提**: `contents` が配列以外（object/string等）。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-103: contentsが空配列の場合は失敗レスポンスを返す
- **前提**: `contents` が空配列。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-104: fileが未指定または空の場合は失敗レスポンスを返す
- **前提**: `contents[].file` が未指定または実体なし。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-105: positionが整数でない場合は失敗レスポンスを返す
- **前提**: `contents[].position` が小数/文字列/null。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-106: positionに重複がある場合は失敗レスポンスを返す
- **前提**: `position` が `1,2,2` のように重複。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-107: positionに欠番がある場合は失敗レスポンスを返す
- **前提**: `position` が `1,2,4` のように欠番を含む。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-108: positionが1始まりでない場合は失敗レスポンスを返す
- **前提**: `position` が `2,3,4` のように1始まりでない。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**: 失敗レスポンスを返し、後続へ委譲しない。

### CSM-109: 保存処理失敗時は失敗レスポンスを返し後続へ委譲しない
- **前提**
  - 入力は有効。
  - `ContentStorage` が保存失敗を返す。
- **操作**: `ContentSaveMiddleware` を実行する。
- **期待結果**
  - 失敗レスポンスを返す。
  - `contentIds` を設定しない。
  - 後続へ委譲しない。
