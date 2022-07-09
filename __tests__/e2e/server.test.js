describe('トップページ', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetBrowser();
    await page.goto(`http://localhost:3000`, {
      waitUntil: "domcontentloaded"
    });
  });

  it(`トップページが表示される`, async () => {
    const title = await page.title();
    expect(title).toContain('トップ');
  });

  describe('ヘッダー', () => {
    const tests = [
      { name: 'トップ', url: './', title: 'トップ' },
      { name: 'タグ', url: './tags', title: 'タグ一覧' },
      { name: 'シリーズ', url: './series', title: 'シリーズ一覧' },
      { name: 'アーティスト', url: './artists', title: 'アーティスト一覧' },
      { name: 'キャラクター', url: './characters', title: 'キャラクター一覧' },
      { name: '作品追加', url: './upload', title: '作品追加' },
      { name: '作品検索', url: './search', title: '作品検索' },
    ];
    tests.forEach(test => {
      it(`${test.name}ページリンクをクリックして${test.name}ページに遷移する`, async () => {
        page.click(`a[href^="${test.url}"]`);
        await page.waitForNavigation({
          timeout: 60000,
          waitUntil: "domcontentloaded"
        });
        const title = await page.title();
        expect(title).toContain(test.title);
      });
    });
  });

  describe('表示切替スイッチ', () => {
    beforeEach(async () => {
    });

    it.todo('詳細表示時に表示切替スイッチを押すとタイル表示に切り替わる', () => {
    });
    it.todo('タイル表示時に表示切替スイッチを押すと詳細表示に切り替わる', () => {
    });
  });

  describe('ページネーション', () => {
    beforeEach(async () => {
    });

    describe('登録数0件', () => {
      it.todo('1ページ目のみでページリンクは存在しない', () => {
      });
      it.todo('次ページのリンクは存在しない', () => {
      });
      it.todo('前ページのリンクは存在しない', () => {
      });
      it.todo('ドロップダウンリストは1のみ表示される', () => {
      });
      it.todo('ページ移動をクリックして"./?page=1"に遷移する', () => {
      });
    });

    describe('登録数1件', () => {
      it.todo('1ページ目のみでページリンクは存在しない', () => {
      });
      it.todo('次ページのリンクは存在しない', () => {
      });
      it.todo('前ページのリンクは存在しない', () => {
      });
      it.todo('ドロップダウンリストは1のみ表示される', () => {
      });
      it.todo('ページ移動をクリックして"./?page=1"に遷移する', () => {
      });
    });
    describe('登録数15件', () => {
      it.todo('1ページ目のみでページリンクは存在しない', () => {
      });
      it.todo('前ページのリンクは存在しない', () => {
      });
      it.todo('次ページのリンクは存在しない', () => {
      });
      it.todo('ドロップダウンリストは1のみ表示される', () => {
      });
      it.todo('ページ移動をクリックして"./?page=1"に遷移する', () => {
      });
    });
    describe('登録数16件', () => {
      describe('1ページ目', () => {
        it.todo('2ページ目のみページリンクが存在する', () => {
        });
        it.todo('2ページ目のリンクをクリックすると2ページ目に遷移する', () => {
        });
        it.todo('前ページのリンクは存在しない', () => {
        });
        it.todo('次ページのリンクをクリックすると2ページ目に遷移する', () => {
        });
      });
      describe('2ページ目', () => {
        it.todo('1ページ目のみページリンクが存在する', () => {
        });
        it.todo('1ページ目のリンクをクリックすると1ページ目に遷移する', () => {
        });
        it.todo('前ページのリンクをクリックすると1ページ目に遷移する', () => {
        });
        it.todo('次ページのリンクは存在しない', () => {
        });
      });
      describe('ドロップダウンリスト', () => {
        it.todo('1,2が表示される', () => {
        });
        it.todo('1を選択してページ移動をクリックして1ページ目に遷移する', () => {
        });
        it.todo('2を選択してページ移動をクリックして2ページ目に遷移する', () => {
        });
      });
    });
  });


  describe('URLパラメータ', () => {

    describe('マンガ20個に各ラベルの1-20を割り当てる。', () => {
      describe('page=1', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?page=1`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('マンガが15個表示される', () => {
        });
      });

      describe('page=2', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?page=2`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('マンガが5個表示される', () => {
        });
      });

      describe('page=3', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?page=3`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('無効なURLであることを表示する', () => {
        });
      });

      describe('order=newer', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?order=newer`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('マンガ20から降順に15個表示される', () => {
        });
      });

      describe('order=older', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?order=older`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('マンガ1から昇順に15個表示される', () => {
        });
      });

      describe('order=update', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?order=update`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('マンガ20から降順に15個表示される', () => {
        });
      });

      describe('order=random', () => {
        beforeAll(async () => {
          await page.goto(`http://localhost:3000/?order=random`, {
            waitUntil: "domcontentloaded"
          });
        });

        it.todo('ランダムにマンガが15個表示される', () => {
        });
      });

      const tests = [
            { param: 'search=tag:タグ1', description: 'タグ1の検索結果が表示される' },
            { param: 'search=tag:タグ20', description: 'タグ20の検索結果が表示される' },
            { param: 'search=tag:タグ21', description: '検索結果0件ページが表示される' },
            { param: 'search=artist:作者1', description: '作者1の検索結果が表示される' },
            { param: 'search=artist:作者20', description: '作者20の検索結果が表示される' },
            { param: 'search=artist:作者21', description: '検索結果0件ページが表示される' },
            { param: 'search=series:シリーズ1', description: 'シリーズ1の検索結果が表示される' },
            { param: 'search=series:シリーズ20', description: 'シリーズ20の検索結果が表示される' },
            { param: 'search=series:シリーズ21', description: '検索結果0件ページが表示される' },
            { param: 'search=character:キャラ1', description: 'キャラ1の検索結果が表示される' },
            { param: 'search=character:キャラ20', description: 'キャラ20の検索結果が表示される' },
            { param: 'search=character:キャラ21', description: '検索結果0件ページが表示される' },
          ];

      tests.forEach(test => {
        describe(test.param, () => {
          it.todo(test.description, () => {
            const param = test.param;
            await page.goto(`http://localhost:3000/?${param}`, {
              waitUntil: "domcontentloaded"
            });
          });
        });
      });
    });
  });
});

