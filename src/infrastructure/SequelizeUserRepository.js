const { DataTypes } = require('sequelize');

const IUserRepository = require('../domain/user/IUserRepository');
const User = require('../domain/user/user');
const UserId = require('../domain/user/userId');
const MediaId = require('../domain/media/mediaId');

function defineModels(sequelize) {
  const UserModel = sequelize.define('user', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
  }, { tableName: 'user', timestamps: false });

  const FavoriteModel = sequelize.define('favorite', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    media_id: { type: DataTypes.STRING, primaryKey: true },
  }, { tableName: 'favorite', timestamps: false });

  const QueueModel = sequelize.define('queue', {
    user_id: { type: DataTypes.STRING, primaryKey: true },
    media_id: { type: DataTypes.STRING, primaryKey: true },
  }, { tableName: 'queue', timestamps: false });

  UserModel.hasMany(FavoriteModel, { foreignKey: 'user_id', as: 'favorites', onDelete: 'CASCADE' });
  FavoriteModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });
  UserModel.hasMany(QueueModel, { foreignKey: 'user_id', as: 'queueItems', onDelete: 'CASCADE' });
  QueueModel.belongsTo(UserModel, { foreignKey: 'user_id', as: 'user' });

  return {
    UserModel,
    FavoriteModel,
    QueueModel,
  };
}

module.exports = class SequelizeUserRepository extends IUserRepository {
  #sequelize;
  #models;
  #unitOfWorkContext;

  constructor({ sequelize, models, unitOfWorkContext } = {}) {
    super();

    if (!sequelize || typeof sequelize.transaction !== 'function') {
      throw new Error();
    }
    if (!unitOfWorkContext || typeof unitOfWorkContext.getCurrent !== 'function') {
      throw new Error();
    }

    this.#sequelize = sequelize;
    this.#models = models || defineModels(sequelize);
    this.#unitOfWorkContext = unitOfWorkContext;
  }

  async sync() {
    await this.#sequelize.sync();
  }

  async save(user) {
    if (!(user instanceof User)) {
      throw new Error();
    }

    const executionScope = this.#unitOfWorkContext.getCurrent();
    const { UserModel, FavoriteModel, QueueModel } = this.#models;
    const userId = user.getUserId().getId();

    await UserModel.upsert({ user_id: userId }, { transaction: executionScope });
    await FavoriteModel.destroy({ where: { user_id: userId }, transaction: executionScope });
    await QueueModel.destroy({ where: { user_id: userId }, transaction: executionScope });

    const favorites = user.getFavorites().map(mediaId => ({
      user_id: userId,
      media_id: mediaId.getId(),
    }));
    const queue = user.getQueue().map(mediaId => ({
      user_id: userId,
      media_id: mediaId.getId(),
    }));

    if (favorites.length > 0) {
      await FavoriteModel.bulkCreate(favorites, { transaction: executionScope });
    }
    if (queue.length > 0) {
      await QueueModel.bulkCreate(queue, { transaction: executionScope });
    }
  }

  async findByUserId(userId) {
    if (!(userId instanceof UserId)) {
      throw new Error();
    }

    const executionScope = this.#unitOfWorkContext.getCurrent();
    const { UserModel, FavoriteModel, QueueModel } = this.#models;
    const userRow = await UserModel.findByPk(userId.getId(), {
      include: [
        { model: FavoriteModel, as: 'favorites' },
        { model: QueueModel, as: 'queueItems' },
      ],
      transaction: executionScope,
    });

    if (!userRow) {
      return new User(new UserId(userId.getId()));
    }

    const user = new User(new UserId(userRow.user_id));
    userRow.favorites.forEach(favorite => user.addFavorite(new MediaId(favorite.media_id)));
    userRow.queueItems.forEach(queue => user.addQueue(new MediaId(queue.media_id)));
    return user;
  }
};

module.exports.defineModels = defineModels;
