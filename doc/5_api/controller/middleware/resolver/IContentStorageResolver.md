# IContentStorageResolver

## 概要
`ContentSaveMiddleware` が受け取る `contentStorage`（resolver）のインターフェース。

`contents` を保存し、保存順に対応した `contentIds` を返す責務を持つ。

---

## 機能
### コンテンツ保存
受け取ったコンテンツ配列を保存し、保存結果のコンテンツID配列を返す。

#### メソッド
- `async save(contents)`

#### 入力
```plantuml
left to right direction

struct ContentInput #pink {
  + file : any
  + position : number
}
```

- `contents: array<ContentInput>`
  - `ContentSaveMiddleware` 側で `position` 昇順に整列済みの配列を受け取る。

#### 出力
- `Promise<array<string>>`
  - `contentIds[n]` は、入力 `contents[n]` に対応する保存済みコンテンツID。

#### 例外
- 保存に失敗した場合は例外を送出する。

---
