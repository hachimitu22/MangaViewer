# SessionTerminator テストケース

## テストケース一覧
- [session_token を無効化して session.destroy を呼ぶ](#session_token-を無効化して-sessiondestroy-を呼ぶ)
- [ストア削除に失敗した場合は false を返して session.destroy を呼ばない](#ストア削除に失敗した場合は-false-を返して-sessiondestroy-を呼ばない)
- [session.destroy が失敗した場合は reject する](#sessiondestroy-が失敗した場合は-reject-する)

---

### session_token を無効化して session.destroy を呼ぶ
- 前提
  - `session.session_token` が存在する
  - `sessionStateStore.delete` が `true` を返す
- 操作
  - `execute({ session })` を実行する
- 期待結果
  - `sessionStateStore.delete(sessionToken)` が呼ばれる
  - `session.destroy` が 1 回呼ばれる
  - `true` で resolve する

### ストア削除に失敗した場合は false を返して session.destroy を呼ばない
- 前提
  - `session.session_token` が存在する
  - `sessionStateStore.delete` が `false` を返す
- 操作
  - `execute({ session })` を実行する
- 期待結果
  - `false` で resolve する
  - `session.destroy` は呼ばれない

### session.destroy が失敗した場合は reject する
- 前提
  - `sessionStateStore.delete` が `true` を返す
  - `session.destroy` がエラー付きコールバックを返す
- 操作
  - `execute({ session })` を実行する
- 期待結果
  - Promise が `Error` で reject する
