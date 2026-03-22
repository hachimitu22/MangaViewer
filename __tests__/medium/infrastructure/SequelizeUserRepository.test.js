const { Sequelize } = require('sequelize');

const SequelizeUnitOfWork = require('../../../src/infrastructure/SequelizeUnitOfWork');
const SequelizeUserRepository = require('../../../src/infrastructure/SequelizeUserRepository');
const User = require('../../../src/domain/user/user');
const UserId = require('../../../src/domain/user/userId');
const MediaId = require('../../../src/domain/media/mediaId');

describe('SequelizeUserRepository', () => {
  let sequelize;
  let unitOfWork;
  let userRepository;

  beforeEach(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    unitOfWork = new SequelizeUnitOfWork({ sequelize });
    userRepository = new SequelizeUserRepository({ sequelize, unitOfWorkContext: unitOfWork });
    await userRepository.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  test('save / findByUserId で favorite と queue を永続化できる', async () => {
    const user = new User(new UserId('user-001'));
    user.addFavorite(new MediaId('media-001'));
    user.addFavorite(new MediaId('media-002'));
    user.addQueue(new MediaId('media-003'));

    await userRepository.save(user);

    const found = await userRepository.findByUserId(new UserId('user-001'));
    expect(found.getFavorites().map(mediaId => mediaId.getId())).toEqual(['media-001', 'media-002']);
    expect(found.getQueue().map(mediaId => mediaId.getId())).toEqual(['media-003']);
  });
});
