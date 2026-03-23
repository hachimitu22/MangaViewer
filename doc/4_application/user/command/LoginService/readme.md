# LoginService

## 概要
ユーザー名とパスワードを認証し、成功時にセッションを再生成してセッショントークンを発行する

## 種別
- Command

## 入力

```plantuml
struct Query #pink {
    + ユーザー名 : string
    + パスワード : string
    + セッション : object
}
```

## 前提条件
- ユーザー名は空文字ではない文字列である
- パスワードは空文字ではない文字列である
- セッションは object である
- `loginAuthenticator.execute` を持つ認証依存が設定されている
- `sessionStateRegistrar.execute` を持つセッション登録依存が設定されている
- セッションTTLは正の整数ミリ秒である

## 出力

```plantuml
left to right direction

struct Result #pink {
    + code : number
    + sessionToken : string | null
}

struct LoginSucceededResult {
    + code = 0
    + sessionToken : string
}

struct LoginFailedResult {
    + code = 1
    + sessionToken = null
}

Result <|- LoginSucceededResult
Result <|- LoginFailedResult
```

## 依存先
- `loginAuthenticator`
  - `execute({ username, password })`
  - 認証成功時はユーザーID文字列を返却する
  - 認証失敗時は `null` などの空値を返却する
  - 実装例: [StaticLoginAuthenticator](/doc/7_infrastructure/StaticLoginAuthenticator/readme.md)
- `sessionStateRegistrar`
  - `execute({ session, userId, ttlMs })`
  - セッション再生成とセッション状態保存を行い、`sessionToken` を含むセッション状態を返却する

## エラー処理
- `Query` の生成条件を満たさない入力は例外とする
  - ユーザー名・パスワードが空文字または文字列ではない
  - セッションが object ではない
- `execute` に `Query` 以外が渡された場合は例外とする
- 認証失敗時は `LoginFailedResult` を返却する
- 技術的障害（認証依存の障害、セッション再生成失敗、セッション保存失敗、セッショントークン生成不正等）は例外として通知する
- セッション発行成功時は `LoginSucceededResult` を返却し、`sessionToken` に発行済みトークンを設定する

## シーケンス図

```plantuml
participant Controller
participant Application
participant LoginAuthenticator
participant SessionStateRegistrar
participant SessionStore

Controller -> Application: LoginService
Application -> LoginAuthenticator: 認証を実行する
Application <-- LoginAuthenticator: userId | null
alt 認証失敗
  Application -> Application: LoginFailedResult作成
  Controller <-- Application: Result
else 認証成功
  Application -> SessionStateRegistrar: セッション再生成と状態登録
  SessionStateRegistrar -> SessionStore: セッション状態を保存する
  SessionStateRegistrar <-- SessionStore: sessionState
  Application -> Application: LoginSucceededResult作成
  Controller <-- Application: Result
end
```
