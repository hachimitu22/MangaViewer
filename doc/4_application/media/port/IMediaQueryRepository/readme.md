# IMediaQueryRepository

## 概要
メディア検索用クエリーリポジトリの抽象契約。

---

## テスト方針
- interface 自体ではなく、`SequelizeMediaQueryRepository` などの具象実装で検索条件・並び順・空データ時の扱いを検証する。
- 文書上のテストケース粒度も具象実装側に合わせ、検索成功・空結果・不正入力の観点へ整理する。
- 実装差し替えが増える場合は、`SearchCondition` を受け取り `SearchResult` を返すことを契約テストとして共通化する。
