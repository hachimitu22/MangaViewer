# 画面仕様書

## レイアウトの見方

![](./レイアウトの見方.drawio.svg)

## 画面一覧

|                      画面名                       |                    概要                    |                  URL                  |                  API                  |
| ------------------------------------------------- | ------------------------------------------ | ------------------------------------- | ------------------------------------- |
| [ログイン](./pages/ログイン/index.md)             | ログイン画面                               | /login                                | GET /api/login                        |
| [メディア一覧](./pages/メディア一覧/index.md)     | メディア一覧を表示する                     | /summary                              | GET /api/summary                      |
| [メディア詳細](./pages/メディア詳細/index.md)     | 指定のメディアの詳細を表示する             | /detail/メディアID                    | GET /api/detail/{mediaId}             |
| [ビューアー](./pages/ビューアー/index.md)         | メディアのビューアー                       | /viewer/メディアID/メディアページ番号 | GET /api/viewer/{mediaId}/{mediaPage} |
| [検索条件入力](./pages/検索条件入力/index.md)     | 検索したいメディアの条件を入力する         | /search                               | GET /api/search                       |
| [お気に入り一覧](./pages/お気に入り一覧/index.md) | お気に入りに追加したメディア一覧を表示する | /favorite                             | GET /api/favorite                     |
| [あとで見る一覧](./pages/あとで見る一覧/index.md) | あとで見るに追加したメディア一覧を表示する | /queue                                | GET /api/queue                        |
| [エラー画面](./pages/エラー画面/index.md)         | 想定外な動作をした場合に表示する           | /error                                | GET /api/error                        |
| [メディア登録](./pages/メディア登録/index.md)     | 新しいメディアを登録する画面               | /entry                                | GET /api/entry                        |
| [メディア編集](./pages/メディア編集/index.md)     | メディアの編集画面                         | /edit/メディアID                      | GET /api/edit/{mediaId}               |

## 画面パーツ一覧

|                   パーツ名                    |             概要             |        使用箇所        |
| --------------------------------------------- | ---------------------------- | ---------------------- |
| [ナビゲーター](./parts/ナビゲーター/index.md) | 各画面へのショートカット一覧 | 全画面の上部、ヘッダー |

## 画面遷移図
### ユーザーの遷移
@import "./flow/user.puml"

### 管理者の遷移
@import "./flow/admin.puml"

### ナビゲーションからの遷移
@import "./flow/navigation.puml"

## E2E テストケース

- [E2E テストケース（large）](./flow/e2e/testcase.large.md)
