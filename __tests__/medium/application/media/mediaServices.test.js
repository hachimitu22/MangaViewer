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

  test('Register / Search / Detail が永続化配線をまたいで整合する', async () => {
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

    expect(registerResult.mediaId).toBe('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');

    const searchResult = await searchMediaService.execute(new SearchInput({
      title: '山田',
      tags: [{ category: 'ジャンル', label: '冒険' }],
      sortType: InputSortType.TITLE_ASC,
      start: 1,
    }));

    expect(searchResult.totalCount).toBe(1);
    expect(searchResult.mediaOverviews).toEqual([
      expect.objectContaining({
        mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        title: '山田太郎の冒険',
        thumbnail: 'content-001',
        priorityCategories: ['作者', 'ジャンル'],
      }),
    ]);

    const detailResult = await getMediaDetailService.execute(new DetailInput({ mediaId: registerResult.mediaId }));
    expect(detailResult.mediaDetail).toEqual({
      id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      title: '山田太郎の冒険',
      contents: ['content-001', 'content-002'],
      tags: [
        { category: '作者', label: '山田太郎' },
        { category: 'ジャンル', label: '冒険' },
      ],
      priorityCategories: ['作者', 'ジャンル'],
    });
  });

  test('Update / Delete が永続化結果に反映される', async () => {
    const registerMediaService = new RegisterMediaService({
      mediaIdValueGenerator: new FixedMediaIdValueGenerator(),
      mediaRepository,
      unitOfWork,
    });
    const updateMediaService = new UpdateMediaService({ mediaRepository, unitOfWork });
    const deleteMediaService = new DeleteMediaService({ mediaRepository, unitOfWork });

    await registerMediaService.execute(new RegisterMediaServiceInput({
      title: '更新前タイトル',
      contents: ['content-001'],
      tags: [{ category: '作者', label: '山田' }],
      priorityCategories: ['作者'],
    }));

    await updateMediaService.execute(new UpdateMediaServiceInput({
      id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      title: '更新後タイトル',
      contents: ['content-002', 'content-003'],
      tags: [
        { category: '作者', label: '佐藤' },
        { category: '雑誌', label: 'ジャンプ' },
      ],
      priorityCategories: ['作者', '雑誌'],
    }));

    const updated = await mediaRepository.findByMediaId(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'));
    expect(updated.getTitle().getTitle()).toBe('更新後タイトル');
    expect(updated.getContents().map(content => content.getId())).toEqual(['content-002', 'content-003']);
    expect(updated.getTags().map(tag => ({
      category: tag.getCategory().getValue(),
      label: tag.getLabel().getLabel(),
    }))).toEqual([
      { category: '作者', label: '佐藤' },
      { category: '雑誌', label: 'ジャンプ' },
    ]);

    await deleteMediaService.execute(new DeleteMediaServiceInput({ id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }));

    await expect(mediaRepository.findByMediaId(new MediaId('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'))).resolves.toBeNull();
  });
});
