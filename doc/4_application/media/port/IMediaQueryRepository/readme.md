# IMediaQueryRepository

## 概要
メディアのQuery専用リポジトリ

---

## 機能
### メディア検索
検索条件に合うメディアを検索し検索結果の一覧を返す

#### 入力

```plantuml
left to right direction

struct SearchCondition #pink {
    + タイトル : string
    + タグ一覧 : array<SearchConditionTag>
    + ソート方法 : SortType
}

object SearchConditionTag {
    + カテゴリー名 : string
    + ラベル名 : string
}

enum SortType {
    + 登録日新しい順
    + 登録日古い順
    + タイトル順
    + タイトル逆順
    + ランダム
}

SearchCondition o- SearchConditionTag
SearchCondition o- SortType
```

#### 出力

```plantuml
left to right direction

struct SearchResult #pink {
    + メディア一覧 : array<MediaOverview>
    + 検索結果合計数 : number
}

struct MediaOverview #pink {
    + メディアID : string
    + タイトル : string
    + サムネイル : string
    + タグ一覧 : array<MediaOverviewTag>
    + カテゴリー優先度 : array<string>
}

object MediaOverviewTag {
  + カテゴリー名 : string
  + ラベル名 : string
}

Note right of MediaOverview
  サムネイル：コンテンツID
  カテゴリー優先度：カテゴリー名の配列、配列順=優先度
End Note

MediaOverview o- MediaOverviewTag
```

---
