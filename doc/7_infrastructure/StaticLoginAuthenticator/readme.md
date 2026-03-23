# StaticLoginAuthenticator 設計書

## 概要
`StaticLoginAuthenticator` は、設定で注入した固定のユーザー名・パスワード・ユーザーIDを用いてログイン可否を判定する簡易認証アダプターです。  
永続ストアや外部認証基盤へアクセスせず、`execute` 呼び出し時に受け取った資格情報とコンストラクターで保持した固定値を完全一致で比較します。

## クラス
- 配置: `src/infrastructure/StaticLoginAuthenticator.js`
- クラス名: `StaticLoginAuthenticator`

## 利用箇所
- `src/app/createDependencies.js`
  - `env.loginUsername` / `env.loginPassword` / `env.loginUserId` をもとに `StaticLoginAuthenticator` を生成する
  - 生成した `loginAuthenticator` を `LoginService` へ注入する
- 関連実装: [LoginService](/doc/4_application/user/command/LoginService/readme.md)

## 固定認証情報を使う理由
- 管理画面向けの最小構成ログインを、DB上のユーザー管理機能なしで成立させるため
- ローカル開発や単一管理者運用など、認証要件が限定された環境で依存を増やさずに利用できるようにするため
- `createDependencies` で環境変数相当の `env` から差し替えられるため、デプロイ先ごとに認証情報を切り替えやすくするため

## 想定環境
- ローカル開発環境
- 閉域・限定公開された検証環境
- 単一管理者または少人数運用で、外部IdPやユーザーテーブルをまだ導入しない構成

> 固定資格情報をアプリケーション設定へ直接載せる方式のため、多数ユーザー向け本番環境や厳格な認証統制が必要な環境には不向きです。

## 責務
- 固定の認証情報を保持する
- 入力された `username` / `password` が固定値と一致するかを判定する
- 一致した場合だけ `userId` を返し、`LoginService` が後続のセッション発行を継続できるようにする
- 不一致または不足入力の場合は `null` を返し、認証失敗として扱えるようにする

## 入力

### コンストラクター入力
```plantuml
struct Config #pink {
    + username : string
    + password : string
    + userId : string
}
```

### execute 入力
```plantuml
struct Query #pink {
    + username : string | undefined
    + password : string | undefined
}
```

## 出力

```plantuml
left to right direction

class Result {
  + userId : string | null
}
```

- 認証成功時: 固定設定の `userId` を返す
- 認証失敗時: `null` を返す

## 認証成功条件
- コンストラクターへ渡した `username` が非空文字列である
- コンストラクターへ渡した `password` が非空文字列である
- コンストラクターへ渡した `userId` が非空文字列である
- `execute({ username, password })` の `username` が保持済みの固定ユーザー名と完全一致する
- `execute({ username, password })` の `password` が保持済みの固定パスワードと完全一致する

## 認証失敗条件
- `execute` に渡した `username` が固定ユーザー名と一致しない
- `execute` に渡した `password` が固定パスワードと一致しない
- `execute` に `undefined`、不足したオブジェクト、または型不一致の値が渡され、完全一致条件を満たせない

## 不正入力条件
- コンストラクター引数の `username` / `password` / `userId` のいずれかが非空文字列でない場合は `Error` を送出する
- `execute` 側は入力検証による例外を送出せず、比較不能な値も認証失敗 (`null`) として扱う

## 依存関係
- なし

## エラー方針
- 生成時設定が不正な場合のみ例外として即時失敗する
- 実行時の資格情報不一致は業務上の認証失敗であり、例外ではなく `null` を返す

## シーケンス

```plantuml
participant createDependencies
participant StaticLoginAuthenticator
participant LoginService

createDependencies -> StaticLoginAuthenticator: 固定認証情報で生成
LoginService -> StaticLoginAuthenticator: execute({ username, password })
alt ユーザー名・パスワードが一致
  StaticLoginAuthenticator --> LoginService: userId
else 不一致または不足
  StaticLoginAuthenticator --> LoginService: null
end
```
