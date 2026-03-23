# SearchCondition 設計書

## 概要
`SearchCondition` はメディア検索でアプリケーション層からリポジトリ層へ渡す検索条件のポートです。  
`SearchMediaService` が入力を受けて生成し、`SequelizeMediaQueryRepository` がこの条件をもとに絞り込み・並び順・ページングを行います。

## 配置
- 実装: `src/application/media/port/SearchCondition.js`
- 利用箇所
  - `SearchMediaService`: 画面・API由来の検索入力を正規化して `SearchCondition` に変換する
  - `SequelizeMediaQueryRepository`: `search(condition)` の受け口として利用する
  - `/screen/summary`: クエリ文字列を正規化した後、`SearchMediaService.Input` 経由で間接的に利用する

## 構造

### SearchCondition
| 項目 | 型 | 制約 | 備考 |
| --- | --- | --- | --- |
| `title` | `string` | 文字列のみを許可する | 空文字列は「タイトル条件なし」として扱う |
| `tags` | `SearchConditionTag[]` | 配列であり、全要素が `SearchConditionTag` インスタンスであること | 複数指定時は全タグ一致で絞り込む |
| `sortType` | `SortType` | `SortType` 列挙値のいずれかであること | 並び順の戦略を示す |
| `start` | `number` | 1以上の整数であること | 1始まりの取得開始位置 |
| `size` | `number` | 1以上の整数であること | 取得件数 |

### SearchConditionTag
| 項目 | 型 | 制約 | 備考 |
| --- | --- | --- | --- |
| `category` | `string` | コンストラクタで型検証はしない | `SearchMediaService` / `/screen/summary` 側で文字列に正規化される前提 |
| `label` | `string` | コンストラクタで型検証はしない | `category` と同様 |

## sortType の列挙値
| 列挙値 | 意味 | `SequelizeMediaQueryRepository` での並び |
| --- | --- | --- |
| `SortType.DATE_ASC` | 登録の新しい順 | `createdAtProxy DESC`, `media_id ASC` |
| `SortType.DATE_DESC` | 登録の古い順 | `createdAtProxy ASC`, `media_id ASC` |
| `SortType.TITLE_ASC` | タイトル名の昇順 | `title ASC`, `media_id ASC` |
| `SortType.TITLE_DESC` | タイトル名の降順 | `title DESC`, `media_id ASC` |
| `SortType.RANDOM` | ランダム順 | DB の random 関数を利用する |

## 関連

### SearchMediaService との関係
- `SearchMediaService.Input` は `SearchCondition` と同じ形を持つ入力 DTO である。
- `execute` は `Input.tags` を `SearchConditionTag` に詰め替え、`SearchCondition` を生成してリポジトリへ渡す。
- そのため `SearchCondition` は「アプリケーション層内の入力」ではなく、「検索リポジトリに渡す契約」として扱う。

### SequelizeMediaQueryRepository との関係
- `search(condition)` は `SearchCondition` インスタンス以外を受け付けない。
- `title`、`tags`、`sortType`、`start`、`size` を解釈して、条件一致件数とページング結果を計算する。
- `tags` はカテゴリー・ラベルを順に解決し、各タグ条件を満たすメディア ID の積集合へ絞り込む。

### `/screen/summary` との関係
- `/screen/summary` は `summaryPage` / `start` / `size` / `title` / `tags` / `sort` を正規化する。
- 正規化後に `SearchMediaService.Input` を生成し、その内部で `SearchCondition` に変換される。
- したがって画面のクエリ仕様変更は、最終的にこのポートへ流れ込む値の制約と整合している必要がある。

## テスト観点

### small で保証すること
- `title` が文字列、`tags` が `SearchConditionTag[]`、`sortType` が列挙値、`start` / `size` が 1 以上の整数である時に生成できる。
- `title` の非文字列、`tags` の非配列または異種要素、`sortType` の未知値、`start` / `size` の 0 以下・小数・非数で `Error` になる。
- `SearchCondition` がリポジトリ契約として最低限の型制約を守ることを確認する。

### medium で保証すること
- `SearchMediaService` と `SequelizeMediaQueryRepository` を接続したとき、`SearchCondition` の各項目が検索結果へ反映される。
- `/screen/summary` のクエリ正規化結果が `SearchCondition` 制約に合う値へ落ちる。
- 具体的にはタイトル部分一致、タグ全件一致、並び順、`start` / `size` によるページングが期待通り動くことを確認する。
