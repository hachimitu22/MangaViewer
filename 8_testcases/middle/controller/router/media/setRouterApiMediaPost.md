# setRouterApiMediaPost.js middleテストケース

| No | 観点 | 入力条件 | 期待結果 |
| --- | --- | --- | --- |
| 1 | 正常系: ルーター登録とPOST実行成功 | 有効なsession_token、妥当なcontents/title/tags、saveResolverがcontentId配列を返却 | `/api/media` に3ハンドラーが登録される。認証→保存→登録が順に実行され、`200 { code: 0, mediaId }` を返す。 |
| 2 | 異常系: session未設定 | `req.session` が未設定 | 認証ミドルウェアで `401 { message: '認証に失敗しました' }` を返し、後続処理は実行されない。 |
| 3 | 異常系: 認証解決失敗 | authResolverが空文字のuserIdを返却 | 認証ミドルウェアで `401 { message: '認証に失敗しました' }` を返し、後続処理は実行されない。 |
| 4 | 異常系: contents不正 | `contents.position` が連番になっていない | 保存ミドルウェアで `200 { code: 1 }` を返し、メディア登録は実行されない。 |
| 5 | 異常系: 保存結果不正 | saveResolverがcontents数と異なるcontentId配列を返却 | 保存ミドルウェアで `200 { code: 1 }` を返し、メディア登録は実行されない。 |
| 6 | 異常系: コントローラー入力不正 | `title` が空文字 | コントローラーで `200 { code: 1 }` を返し、RegisterMediaServiceは実行されない。 |
| 7 | 異常系: 登録サービス失敗 | mediaRepository.saveが例外送出 | コントローラーで `200 { code: 1 }` を返す。 |
| 8 | 異常系: 初期化不正 | authResolverにexecuteが無い | `setRouterApiMediaPost` 呼び出し時に例外送出。 |
