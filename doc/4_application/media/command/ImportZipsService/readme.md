# ImportZipsService

## 概要
- zip 群を一括取り込みし、**1zip=1メディア**として登録する。
- 取り込みは zip 単位で完結し、成功した zip のみ永続化される。

## 種別
- Command

## アクター
- 管理者（サーバー運用者）

## 目的
- 対象フォルダ配下の zip を効率よく取り込み、メディア登録作業を自動化する。

## 入力

```plantuml
left to right direction

struct ImportZipsInput #pink {
    + 対象フォルダ : string
    + zipごとの最大画像数 : number
    + 画像ファイルの最大バイト数 : number
    + 1実行あたり最大zip処理件数 : number
    + ログ出力先 : string
}
```

- 対象フォルダ: 取り込み対象 zip を探索するディレクトリ。
  - 探索対象は**対象フォルダ直下のみ**とし、サブフォルダ配下の zip は取り込み対象外として無視する。
- 各上限値: 異常な入力による過負荷を防ぐためのガード。
- ログ出力先: zip ごとの成否および集計結果を出力する先。

### 入力契約の検証責務
- 入力契約（対象フォルダ未指定、上限値不正、ログ出力先不正など）の検証は `ImportZipsService` の責務とする。
- 入力契約違反時は zip 処理を開始せず、`実行結果種別=INVALID_INPUT` を返す。

## 出力

```plantuml
left to right direction

struct ImportZipResult {
    + zip名 : string
    + 成否 : enum(SUCCESS, FAILED)
    + mediaId : string?
    + 無視ファイル一覧 : array<string>
    + reasonCode : enum(NO_IMAGES, ZIP_IMAGE_COUNT_LIMIT_EXCEEDED, IMAGE_FILE_SIZE_LIMIT_EXCEEDED, INVALID_ZIP, IO_ERROR)
    + reasonDetail : string?
}

struct ImportZipsSummary {
    + 対象zip件数 : number
    + 成功件数 : number
    + 失敗件数 : number
}

struct ImportZipsOutput #pink {
    + zip単位結果一覧 : array<ImportZipResult>
    + 全体サマリ : ImportZipsSummary
    + 実行結果種別 : enum(SUCCESS, PARTIAL_FAILURE, INVALID_INPUT, INVALID_INPUT_RUN_ZIP_COUNT_LIMIT_EXCEEDED)
}

ImportZipsOutput o- ImportZipResult
ImportZipsOutput o- ImportZipsSummary
```

- zip単位結果: 各 zip の成功/失敗、無視ファイル、失敗理由コード（`reasonCode`）、任意詳細（`reasonDetail`）、mediaId を返す。
- 全体サマリ: 実行全体の成功件数・失敗件数を返す。
- 実行結果種別:
  - `SUCCESS`: 全 zip 成功、または対象 zip が 0 件。
  - `PARTIAL_FAILURE`: 1件以上の zip が失敗。
  - `INVALID_INPUT`: 入力契約（対象フォルダ未指定、上限値不正、ログ出力先不正など）を満たさず実行不可。
  - `INVALID_INPUT_RUN_ZIP_COUNT_LIMIT_EXCEEDED`: `1実行あたり最大zip処理件数` の上限超過により、実行全体を開始前に拒否。


## 対象 zip が 0 件のときの結果
- `zip単位結果一覧`: `[]`（空配列）。
- `全体サマリ`: `対象zip件数=0 / 成功件数=0 / 失敗件数=0`。
- `実行結果種別`: `SUCCESS`。

## 業務ルール
- 同名タイトルは許容する（タイトル重複で失敗にしない）。
- 画像以外のファイルは取り込み対象外として無視する。
- 画像が 0 件の zip は取り込み失敗とする。
- `1実行あたり最大zip処理件数` を超過した入力は**実行全体を拒否**し、zip 処理を開始しない。
  - このとき `実行結果種別=INVALID_INPUT_RUN_ZIP_COUNT_LIMIT_EXCEEDED` とし、`zip単位結果一覧=[]` / `全体サマリ=0件` を返す。

## 並び順ルール
- zip の処理順は、**zip ファイル名の自然順（Natural Sort）**で決定する（決定的順序）。
- zip ファイル名比較時は、以下の正規化を行ったうえで比較する。
  - 文字種の正規化: Unicode NFKC を適用し、全角/半角の差異を吸収する。
  - 大文字小文字: ロケール非依存の小文字化を適用し、大小文字を同一視する。
  - ロケール: OS 既定ロケールに依存せず、バイナリ非依存・ロケール非依存の比較を行う。
- zip 名が同順位となる場合は、元の zip ファイル名の辞書順（コードポイント順）を第二キーとして決定する。
- 画像ファイルは自然順（Natural Sort）で並べる。
- 自然順で同順位となる場合は、ファイル名の辞書順を第二キーとして決定する。

## 失敗時の原子性
- 取り込みの原子性は zip 単位で保証する。
- ある zip の取り込み中に失敗した場合、その zip で行った変更はロールバックする。
- 他 zip の成功結果には影響を与えない。

## ログ項目定義
- zip名
- 成否
- 無視ファイル一覧
- reasonCode（失敗理由の分類コード）
- reasonDetail（失敗理由の補足。必要時のみ）
- mediaId（成功時のみ）

### `reasonCode` / `reasonDetail` の規約
- `reasonCode` は**必須**とし、失敗理由の分類識別子を保持する。
- `reasonDetail` は**任意**とし、人間向け補足（対象ファイル名、超過値など）を保持する。
- 表示用文言は `reasonDetail` または呼び出し側のメッセージマッピングで生成する。
- テストの主要期待値は `reasonCode` の完全一致で判定する。

#### `reasonCode` の採用列挙値
- `NO_IMAGES`: 画像ファイルが 0 件で取り込み不可。
- `ZIP_IMAGE_COUNT_LIMIT_EXCEEDED`: zipごとの最大画像数の上限超過。
- `IMAGE_FILE_SIZE_LIMIT_EXCEEDED`: 画像ファイルサイズ上限超過。
- `INVALID_ZIP`: zip 破損や非対応フォーマット等で展開不可。
- `IO_ERROR`: ファイルシステム I/O 失敗（読取/書込/移動/削除など）。

上記 5 つを `reasonCode` の採用列挙値とし、今後の失敗理由は原則この分類規約に従って記録する。
