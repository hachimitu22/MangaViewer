# createDependencies テスト観点（small）

## このドキュメントの位置づけ（`readme.md` との責務分担）
- `readme.md`: `createDependencies` が**何を生成し、どう振る舞うべきか**という仕様・設計意図を説明する。
- `testcase.small.md`（本書）: small テストで担保する観点を、前提・操作・期待結果で明文化する。
- これにより、仕様説明（設計）と検証観点（テスト設計）を分離し、変更時の追従先を明確にする。

---

## small 観点

### 1) 依存オブジェクト生成
**前提**
- `databaseStoragePath` と `contentRootDirectory` を含む最小限の `env` を用意する。

**操作**
- `createDependencies(env)` を実行し、返却オブジェクトを取得する。

**期待結果**
- 返却オブジェクトに、アプリ起動・ルーティングに必要な依存（例: 各 Service、認証解決、`routeSetters`、`ready`、`close`）が揃っている。
- `ready` が Promise として初期化完了を表現し、`close` が終了処理の入口として提供される。

### 2) デフォルト値適用
**前提**
- `loginUsername` / `loginPassword` / `loginUserId` / `loginSessionTtlMs` など、任意設定の一部または全部を省略した `env` を用意する。

**操作**
- `createDependencies(env)` 実行後、`loginService` など関連依存の挙動を確認する。

**期待結果**
- 省略した設定に対して既定値（例: `admin`、`86400000` など）が適用される。
- 呼び出し側が最小構成でも起動・ログイン系依存を利用できる。

### 3) 初期化失敗時の扱い
**前提**
- 永続化初期化やディレクトリ準備が失敗する条件（不正パス・権限不足など）を意図的に作る。

**操作**
- `createDependencies(env)` を実行し、`ready` の解決結果と `close` の挙動を確認する。

**期待結果**
- 初期化失敗が `ready` の reject 等で検知可能である。
- 失敗ケースでも `close` 呼び出しで後始末でき、テストがハングせず終了できる。
