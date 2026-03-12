# UUIDMediaIdValueGenerator 設計書

## 概要
`UUIDMediaIdValueGenerator` は `IMediaIdValueGenerator` の具象実装です。  
`crypto.randomUUID()` で UUID をランダム生成し、ハイフンを除去した 32 文字の文字列をメディア ID 値として返します。

## クラス
- 配置: `src/infrastructure/UUIDMediaIdValueGenerator.js`
- クラス名: `UUIDMediaIdValueGenerator`
- 継承: `IMediaIdValueGenerator`

## 公開メソッド
- `generate()`
  - `crypto.randomUUID()` で UUID を生成する
  - 生成文字列から `-` を除去し、32 文字の 16 進文字列を返す

## 生成方針
- 返却値の形式は `^[0-9a-f]{32}$` とする
- 呼び出しごとに新しい UUID を生成する

## エラー方針
- UUID 生成で発生した例外は握り潰さず上位へ伝播する
