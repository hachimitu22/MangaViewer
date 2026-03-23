const { Sequelize } = require('sequelize');

const SequelizeMediaRepository = require('../../../../src/infrastructure/SequelizeMediaRepository');
const SequelizeUnitOfWork = require('../../../../src/infrastructure/SequelizeUnitOfWork');
const { RegisterMediaService, RegisterMediaServiceInput } = require('../../../../src/application/media/command/RegisterMediaService');
const {
  Input,
  FoundResult,
  MediaNotFoundResult,
  ContentNotFoundResult,
  GetMediaContentWithNavigationService,
} = require('../../../../src/application/media/query/GetMediaContentWithNavigationService');

class SequenceMediaIdValueGenerator {
  constructor(ids) {
    this.ids = [...ids];
  }

  generate() {
    const id = this.ids.shift();
    if (!id) {
      throw new Error('mediaId が不足しています');
    }
    return id;
  }
}

describe('GetMediaContentWithNavigationService (medium)', () => {
  let sequelize;
  let unitOfWork;
  let mediaRepository;
  let registerMediaService;
  let service;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    mediaRepository = new SequelizeMediaRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await mediaRepository.sync();

    registerMediaService = new RegisterMediaService({
      mediaIdValueGenerator: new SequenceMediaIdValueGenerator([
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ]),
      mediaRepository,
      unitOfWork,
    });
    service = new GetMediaContentWithNavigationService({ mediaRepository });

    await registerMediaService.execute(new RegisterMediaServiceInput({
      title: 'ナビゲーション確認用メディア',
      contents: ['content-001', 'content-002', 'content-003'],
      tags: [{ category: '作者', label: 'テスト太郎' }],
      priorityCategories: ['作者'],
    }));
  });

  afterEach(async () => {
    await sequelize.close();
  });

  test('先頭コンテンツ指定時に previousContentId は null で nextContentId が返る', async () => {
    const result = await service.execute(new Input({
      mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      contentPosition: 1,
    }));

    expect(result).toEqual(new FoundResult({
      contentId: 'content-001',
      previousContentId: null,
      nextContentId: 'content-002',
    }));
  });

  test('中間コンテンツ指定時に前後双方の contentId が返る', async () => {
    const result = await service.execute(new Input({
      mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      contentPosition: 2,
    }));

    expect(result).toEqual(new FoundResult({
      contentId: 'content-002',
      previousContentId: 'content-001',
      nextContentId: 'content-003',
    }));
  });

  test('末尾コンテンツ指定時に nextContentId は null で previousContentId が返る', async () => {
    const result = await service.execute(new Input({
      mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      contentPosition: 3,
    }));

    expect(result).toEqual(new FoundResult({
      contentId: 'content-003',
      previousContentId: 'content-002',
      nextContentId: null,
    }));
  });

  test('存在しない contentPosition 指定時に ContentNotFoundResult を返す', async () => {
    const result = await service.execute(new Input({
      mediaId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      contentPosition: 4,
    }));

    expect(result).toEqual(new ContentNotFoundResult());
  });

  test('存在しない mediaId 指定時に MediaNotFoundResult を返す', async () => {
    const result = await service.execute(new Input({
      mediaId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      contentPosition: 1,
    }));

    expect(result).toEqual(new MediaNotFoundResult());
  });
});
