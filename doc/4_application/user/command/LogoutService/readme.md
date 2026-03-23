# LogoutService

## 概要
現在のセッションを終了し、ログアウト結果を返却する

## 種別
- Command

## 入力

```plantuml
struct Query #pink {
    + セッション : object
}
```

## 前提条件
- セッションは object である
- `sessionTerminator.execute` を持つセッション終了依存が設定されている

## 出力

```plantuml
left to right direction

struct Result #pink {
    + code : number
}

struct LogoutSucceededResult {
    + code = 0
}

struct LogoutFailedResult {
    + code = 1
}

Result <|- LogoutSucceededResult
Result <|- LogoutFailedResult
```

## 依存先
- `sessionTerminator`
  - `execute({ session })`
  - セッション状態削除とセッション破棄に成功した場合は `true` を返却する
  - セッション未設定など業務上ログアウトできない場合は `false` を返却する

## エラー処理
- `Query` の生成条件を満たさない入力は例外とする
  - セッションが object ではない
- `execute` に `Query` 以外が渡された場合は例外とする
- セッションが未設定で終了対象を特定できない場合は `LogoutFailedResult` を返却する
- 技術的障害（セッション終了依存の障害、セッション破棄失敗等）は例外として通知する
- セッション終了成功時は `LogoutSucceededResult` を返却する

## シーケンス図

```plantuml
participant Controller
participant Application
participant SessionTerminator
participant SessionStore

Controller -> Application: LogoutService
Application -> SessionTerminator: セッション終了を実行する
SessionTerminator -> SessionStore: セッション状態を削除する
SessionTerminator <-- SessionStore: true | false
alt セッション未設定・削除対象なし
  Application -> Application: LogoutFailedResult作成
  Controller <-- Application: Result
else セッション終了成功
  Application -> Application: LogoutSucceededResult作成
  Controller <-- Application: Result
end
```
