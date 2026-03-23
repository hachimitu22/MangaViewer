const { Sequelize } = require('sequelize');

const SequelizeMediaRepository = require('../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeMediaQueryRepository = require('../../../../src/infrastructure/SequelizeMediaQueryRepository');
const SequelizeUnitOfWork = require('../../../../src/infrastructure/SequelizeUnitOfWork');
const { RegisterMediaService, RegisterMediaServiceInput } = require('../../../../src/application/media/command/RegisterMediaService');
const { UpdateMediaService, UpdateMediaServiceInput } = require('../../../../src/application/media/command/UpdateMediaService');
const { DeleteMediaService, DeleteMediaServiceInput } = require('../../../../src/application/media/command/DeleteMediaService');
const { SearchMediaService, Input: SearchInput, InputSortType } = require('../../../../src/application/media/query/SearchMediaService');
const { GetMediaDetailService, Input: DetailInput } = require('../../../../src/application/media/query/GetMediaDetailService');
const MediaId = require('../../../../src/domain/media/mediaId');

class FixedMediaIdValueGenerator {
  generate() {
    return 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  }
}

describe('media application services (middle)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let mediaQueryRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    mediaQueryRepository = new SequelizeMediaQueryRepository({ sequelize });
    await mediaRepository.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  describe('RegisterMediaService', () => {
    test('medium テスト方針チェックリスト: SequelizeMediaRepository / SequelizeUnitOfWork を組み合わせて登録結果が検索・詳細取得に接続されることを確認する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });
      const searchMediaService = new SearchMediaService({ mediaQueryRepository });
      const getMediaDetailService = new GetMediaDetailService({ mediaRepository });

      const registerResult = await registerMediaService.execute(new RegisterMediaServiceInput({
        title: '山田太郎の冒険',
        contents: ['content-001', 'content-002'],
        tags: [
          { category: '作者', label: '山田太郎' },
          { category: 'ジャンル', label: '冒険' },
        ],
        priorityCategories: ['作者', 'ジャンル'],
      }));

      const searchResult = await searchMediaService.execute(new SearchInput({
        title: '山田太郎',
        tags: [{ category: '作者', label: '山田太郎' }],
        sortType: InputSortType.TITLE_ASC,
        start: 1,
      }));
      const detailResult = await getMediaDetailService.execute(new DetailInput({ mediaId: registerResult.mediaId }));

      expect(registerResult.mediaId).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      expect(searchResult.totalCount).toBe(1);
      expect(searchResult.mediaOverviews).toEqual([
        {
          mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: '山田太郎の冒険',
          thumbnail: 'content-001',
          tags: [
            { category: '作者', label: '山田太郎' },
            { category: 'ジャンル', label: '冒険' },
          ],
          priorityCategories: ['作者', 'ジャンル'],
        },
      ]);
      expect(detailResult.mediaDetail).toEqual({
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        title: '山田太郎の冒険',
        registeredAt: expect.any(String),
        contents: [
          { id: 'content-001', thumbnail: 'content-001', position: 1 },
          { id: 'content-002', thumbnail: 'content-002', position: 2 },
        ],
        tags: [
          { category: '作者', label: '山田太郎' },
          { category: 'ジャンル', label: '冒険' },
        ],
        categories: ['作者', 'ジャンル'],
        priorityCategories: ['作者', 'ジャンル'],
      });
    });

    test('medium テスト方針チェックリスト: MediaId や Tag などの単純値オブジェクトは medium で個別再検証せず、上位サービス経由で間接保証する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });

      await registerMediaService.execute(new RegisterMediaServiceInput({
        title: '間接保証タイトル',
        contents: ['content-010'],
        tags: [{ category: '分類', label: '間接保証' }],
        priorityCategories: ['分類'],
      }));

      const persisted = await mediaRepository.findByMediaId(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
      expect(persisted.getTitle().getTitle()).toBe('間接保証タイトル');
      expect(persisted.getContents().map(content => content.getId())).toEqual(['content-010']);
      expect(persisted.getTags().map(tag => ({
        category: tag.getCategory().getValue(),
        label: tag.getLabel().getLabel(),
      }))).toEqual([{ category: '分類', label: '間接保証' }]);
      expect(persisted.getPriorityCategories().map(category => category.getValue())).toEqual(['分類']);
    });
  });

  describe('UpdateMediaService', () => {
    test('medium テスト方針チェックリスト: 更新後のタイトル・コンテンツ順序・タグ・優先カテゴリーが実リポジトリへ反映されることを確認する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });
      const updateMediaService = new UpdateMediaService({ mediaRepository, unitOfWork });

      await registerMediaService.execute(new RegisterMediaServiceInput({
        title: '更新前タイトル',
        contents: ['content-001', 'content-002'],
        tags: [
          { category: '作者', label: '更新前作者' },
          { category: 'ジャンル', label: '更新前ジャンル' },
        ],
        priorityCategories: ['作者'],
      }));

      await updateMediaService.execute(new UpdateMediaServiceInput({
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        title: '更新後タイトル',
        contents: ['content-003', 'content-001'],
        tags: [
          { category: '雑誌', label: '月刊誌' },
          { category: '作者', label: '更新後作者' },
        ],
        priorityCategories: ['雑誌', '作者'],
      }));

      const updated = await mediaRepository.findByMediaId(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
      expect(updated.getTitle().getTitle()).toBe('更新後タイトル');
      expect(updated.getContents().map(content => content.getId())).toEqual(['content-003', 'content-001']);
      expect(updated.getTags().map(tag => ({
        category: tag.getCategory().getValue(),
        label: tag.getLabel().getLabel(),
      }))).toEqual([
        { category: '雑誌', label: '月刊誌' },
        { category: '作者', label: '更新後作者' },
      ]);
      expect(updated.getPriorityCategories().map(category => category.getValue())).toEqual(['雑誌', '作者']);
    });

    test('medium テスト方針チェックリスト: 単純値オブジェクト単体の境界値は small に残し、medium は永続化配線の整合性に集中する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });
      const updateMediaService = new UpdateMediaService({ mediaRepository, unitOfWork });
      const searchMediaService = new SearchMediaService({ mediaQueryRepository });

      await registerMediaService.execute(new RegisterMediaServiceInput({
        title: '検索更新前',
        contents: ['content-100'],
        tags: [{ category: '作者', label: '初期作者' }],
        priorityCategories: ['作者'],
      }));

      await updateMediaService.execute(new UpdateMediaServiceInput({
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        title: '検索更新後',
        contents: ['content-200', 'content-300'],
        tags: [
          { category: '掲載誌', label: 'テスト雑誌' },
          { category: '作者', label: '更新作者' },
        ],
        priorityCategories: ['掲載誌', '作者'],
      }));

      const searchResult = await searchMediaService.execute(new SearchInput({
        title: '検索更新後',
        tags: [{ category: '掲載誌', label: 'テスト雑誌' }],
        sortType: InputSortType.TITLE_ASC,
        start: 1,
      }));

      expect(searchResult.mediaOverviews).toEqual([
        {
          mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: '検索更新後',
          thumbnail: 'content-200',
          tags: [
            { category: '掲載誌', label: 'テスト雑誌' },
            { category: '作者', label: '更新作者' },
          ],
          priorityCategories: ['掲載誌', '作者'],
        },
      ]);
    });
  });

  describe('DeleteMediaService', () => {
    test('medium テスト方針チェックリスト: 削除後に実リポジトリから取得できなくなることを確認し、アプリケーションサービスと永続化の接続を担保する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });
      const deleteMediaService = new DeleteMediaService({ mediaRepository, unitOfWork });
      const searchMediaService = new SearchMediaService({ mediaQueryRepository });

      await registerMediaService.execute(new RegisterMediaServiceInput({
        title: '削除対象タイトル',
        contents: ['content-delete-001'],
        tags: [{ category: '作者', label: '削除対象作者' }],
        priorityCategories: ['作者'],
      }));

      await deleteMediaService.execute(new DeleteMediaServiceInput({ id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));

      await expect(mediaRepository.findByMediaId(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))).resolves.toBeNull();

      const searchResult = await searchMediaService.execute(new SearchInput({
        title: '削除対象',
        tags: [],
        sortType: InputSortType.TITLE_ASC,
        start: 1,
      }));
      expect(searchResult).toEqual({ mediaOverviews: [], totalCount: 0 });
    });
  });

  describe('SearchMediaService', () => {
    test('medium テスト方針チェックリスト: SequelizeMediaQueryRepository と組み合わせ、登録済みメディアに対してタイトル・タグ・並び順が検索結果へ反映されることを確認する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });
      const searchMediaService = new SearchMediaService({ mediaQueryRepository });

      await registerMediaService.execute(new RegisterMediaServiceInput({
        title: 'かきくけこ作品',
        contents: ['content-500', 'content-501'],
        tags: [
          { category: '作者', label: '田中' },
          { category: 'シリーズ', label: '青' },
        ],
        priorityCategories: ['シリーズ', '作者'],
      }));


      const secondRegisterService = new RegisterMediaService({
        mediaIdValueGenerator: { generate: () => 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' },
        mediaRepository,
        unitOfWork,
      });
      await secondRegisterService.execute(new RegisterMediaServiceInput({
        title: 'あいうえお作品',
        contents: ['content-400'],
        tags: [
          { category: '作者', label: '田中' },
          { category: 'シリーズ', label: '赤' },
        ],
        priorityCategories: ['シリーズ', '作者'],
      }));

      const searchResult = await searchMediaService.execute(new SearchInput({
        title: '作品',
        tags: [{ category: '作者', label: '田中' }],
        sortType: InputSortType.TITLE_ASC,
        start: 1,
      }));

      expect(searchResult.totalCount).toBe(2);
      expect(searchResult.mediaOverviews).toEqual([
        {
          mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          title: 'あいうえお作品',
          thumbnail: 'content-400',
          tags: [
            { category: 'シリーズ', label: '赤' },
            { category: '作者', label: '田中' },
          ],
          priorityCategories: ['シリーズ', '作者'],
        },
        {
          mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          title: 'かきくけこ作品',
          thumbnail: 'content-500',
          tags: [
            { category: 'シリーズ', label: '青' },
            { category: '作者', label: '田中' },
          ],
          priorityCategories: ['シリーズ', '作者'],
        },
      ]);
    });
  });

  describe('GetMediaDetailService', () => {
    test('medium テスト方針チェックリスト: 登録済みメディアを実リポジトリから取得し、contents / tags / priorityCategories への変換結果を確認する', async () => {
      const registerMediaService = new RegisterMediaService({
        mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
        mediaRepository,
        unitOfWork,
      });
      const getMediaDetailService = new GetMediaDetailService({ mediaRepository });

      await registerMediaService.execute(new RegisterMediaServiceInput({
        title: '詳細確認タイトル',
        contents: ['content-a', 'content-b', 'content-c'],
        tags: [
          { category: '作者', label: '詳細作者' },
          { category: 'ジャンル', label: '詳細ジャンル' },
        ],
        priorityCategories: ['ジャンル', '作者'],
      }));

      const detailResult = await getMediaDetailService.execute(new DetailInput({
        mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      }));

      expect(detailResult.mediaDetail).toEqual({
        id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        title: '詳細確認タイトル',
        registeredAt: expect.any(String),
        contents: [
          { id: 'content-a', thumbnail: 'content-a', position: 1 },
          { id: 'content-b', thumbnail: 'content-b', position: 2 },
          { id: 'content-c', thumbnail: 'content-c', position: 3 },
        ],
        tags: [
          { category: '作者', label: '詳細作者' },
          { category: 'ジャンル', label: '詳細ジャンル' },
        ],
        categories: ['作者', 'ジャンル'],
        priorityCategories: ['ジャンル', '作者'],
      });
    });
  });
});
