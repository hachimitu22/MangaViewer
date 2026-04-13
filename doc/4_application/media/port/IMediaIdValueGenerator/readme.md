# IMediaIdValueGenerator

## 概要
メディアID生成の抽象契約を表す。

## テスト方針
- interface 自体に振る舞いは持たないため、単体テストの主対象にはしない。
- 生成品質や戻り値の検証は `UUIDMediaIdValueGenerator` のような具象実装テストへ寄せる。
- 複数実装が増える場合は「空でない文字列を返す」などの契約テストを別途定義する。
