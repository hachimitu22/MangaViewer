# SearchResult 設計書

## 概要
`SearchResult` はメディア検索リポジトリからアプリケーション層へ返す検索結果ポートです。  
`SequelizeMediaQueryRepository` が生成し、`SearchMediaService` が画面描画用の `Output` へ引き継ぎ、最終的に `/screen/summary` の view model に利用されます。

## 配置
- 実装: `src/application/media/port/SearchResult.js`
- 利用箇所
  - `SequelizeMediaQueryRepository`: 検索結果の生成元
  - `SearchMediaService`: `SearchResult` を受けて `Output` へ正規化する
  - `/screen/summary`: `SearchMediaService.Output` を描画して一覧画面を構成する

## 構造

### SearchResult
| 項目 | 型 | 制約 | 備考 |
| --- | --- | --- | --- |
| `mediaOverviews` | `MediaOverview[]` | 配列であり、全要素が `MediaOverview` 相当の構造を持つこと | コンストラクタ内で `MediaOverview` に再構築する |
| `totalCount` | `number` | 0 以上の整数であること | ページング前の総件数 |

### MediaOverview
| 項目 | 型 | 制約 | 備考 |
| --- | --- | --- | --- |
| `mediaId` | `string` | 必須 | メディア識別子 |
| `title` | `string` | 必須 | 一覧表示タイトル |
| `thumbnail` | `string` | 必須 | サムネイル用コンテンツ ID / パス文字列 |
| `tags` | `MediaOverviewTag[]` | 配列であり、各要素が `category` と `label` を持つこと | 表示順はリポジトリが整える |
| `priorityCategories` | `string[]` | 配列であり、各要素が文字列であること | 配列順がカテゴリー優先度 |

### MediaOverviewTag
| 項目 | 型 | 制約 | 備考 |
| --- | --- | --- | --- |
| `category` | `string` | 必須 | タグのカテゴリー名 |
| `label` | `string` | 必須 | タグの表示名 |

## `mediaOverviews` と `totalCount` の意味
- `mediaOverviews` は、現在ページに表示するメディア概要の配列である。
- `totalCount` は、`start` / `size` で切り出す前に検索条件へ一致した総件数である。
- そのため、`mediaOverviews.length` は `size` 以下になり得る一方、`totalCount` はページ送りの判断に使われる。
- 条件一致が0件なら `mediaOverviews` は空配列、`totalCount` は `0` で返す。

## 関連

### SearchMediaService との関係
- `SearchMediaService` は `SearchResult` を直接返さず、`Output` へコピーしてアプリケーション層の返却 DTO とする。
- このとき `mediaOverviews` はプレーンオブジェクトとしても受けられるよう再正規化されるが、元契約は `SearchResult` である。
- `SearchResult` の破損はそのまま `Output` 生成失敗につながるため、リポジトリ側での保証が重要である。

### SequelizeMediaQueryRepository との関係
- `search(condition)` は検索条件一致の総件数を `totalCount` に設定する。
- 表示対象の `mediaOverviews` には、先頭コンテンツを `thumbnail` として採用した `MediaOverview` を詰める。
- `tags` は `priorityCategories` を優先した順に並べ替えた上で返す。

### `/screen/summary` との関係
- `/screen/summary` は `SearchMediaService.Output.mediaOverviews` と `totalCount` をそのまま描画・ページネーションに利用する。
- 画面ではメディアカード表示に `mediaId` / `title` / `thumbnail` / `tags` を使い、ページネーション計算に `totalCount` を使う。
- そのため `SearchResult` は「検索処理の返却値」であると同時に「一覧画面の描画材料」の元データでもある。

## テスト観点

### small で保証すること
- `mediaOverviews` に正しい構造の配列、`totalCount` に 0 以上の整数を渡したとき生成できる。
- `mediaOverviews` の要素不足、`tags` / `priorityCategories` の型違反、`totalCount` の負数・小数で `Error` を送出する。
- コンストラクタが `MediaOverview` / `MediaOverviewTag` を再生成し、最低限の構造保証を行うことを確認する。

### medium で保証すること
- `SequelizeMediaQueryRepository` から返る `SearchResult` が `SearchMediaService.Output` と `/screen/summary` の描画へそのまま接続できる。
- `mediaOverviews` の並び、タグ順、サムネイル採用、`totalCount` によるページネーションが期待通りである。
- 0件時にも `totalCount = 0` と空配列の組み合わせで一覧画面が成立することを確認する。
