# ImportZipsService

## 概要
- サーバー内部 CLI から zip 群を一括取り込みし、**1zip=1メディア**として登録する。
- 取り込みは zip 単位で完結し、成功した zip のみ永続化される。

## 種別
- Command

## アクター
- 管理者（サーバー運用者）

## 目的
- サーバー内部で実行される CLI から、対象フォルダ配下の zip を効率よく取り込み、メディア登録作業を自動化する。

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
- 各上限値: 異常な入力による過負荷を防ぐためのガード。
- ログ出力先: zip ごとの成否および集計結果を出力する先。

## 出力

```plantuml
left to right direction

struct ImportZipResult {
    + zip名 : string
    + 成否 : enum(SUCCESS, FAILED)
    + mediaId : string?
    + 無視ファイル一覧 : array<string>
    + 理由 : string?
}

struct ImportZipsSummary {
    + 対象zip件数 : number
    + 成功件数 : number
    + 失敗件数 : number
}

struct ImportZipsOutput #pink {
    + zip単位結果一覧 : array<ImportZipResult>
    + 全体サマリ : ImportZipsSummary
    + 終了コード : number
}

ImportZipsOutput o- ImportZipResult
ImportZipsOutput o- ImportZipsSummary
```

- zip単位結果: 各 zip の成功/失敗、無視ファイル、失敗理由、mediaId を返す。
- 全体サマリ: 実行全体の成功件数・失敗件数を返す。
- 終了コード:
  - `0`: 全 zip 成功
  - `1`: 1件以上失敗

## 業務ルール
- 同名タイトルは許容する（タイトル重複で失敗にしない）。
- 画像以外のファイルは取り込み対象外として無視する。
- 画像が 0 件の zip は取り込み失敗とする。

## 並び順ルール
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
- 理由（失敗理由、または補足）
- mediaId（成功時のみ）
