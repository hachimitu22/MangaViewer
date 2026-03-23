const { DataTypes } = require('sequelize');

const IMediaRepository = require('../domain/media/IMediaRepository');
const Media = require('../domain/media/media');
const MediaId = require('../domain/media/mediaId');
const MediaTitle = require('../domain/media/mediaTitle');
const ContentId = require('../domain/media/contentId');
const Tag = require('../domain/media/tag');
const Category = require('../domain/media/category');
const Label = require('../domain/media/label');

function defineModels(sequelize) {
  const MediaModel = sequelize.define('media', {
    media_id: { type: DataTypes.STRING, primaryKey: true },
    title: { type: DataTypes.TEXT, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: 'media', timestamps: false });

  const ContentModel = sequelize.define('content', {
    content_id: { type: DataTypes.TEXT, primaryKey: true },
    media_id: { type: DataTypes.STRING, allowNull: false },
    position: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'content', timestamps: false });

  const CategoryModel = sequelize.define('category', {
    category_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.TEXT, allowNull: false, unique: true },
  }, { tableName: 'category', timestamps: false });

  const TagModel = sequelize.define('tag', {
    tag_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.TEXT, allowNull: false },
  }, {
    tableName: 'tag',
    timestamps: false,
    indexes: [{ unique: true, fields: ['category_id', 'name'] }],
  });

  const MediaTagModel = sequelize.define('media_tag', {
    media_id: { type: DataTypes.STRING, primaryKey: true },
    tag_id: { type: DataTypes.INTEGER, primaryKey: true },
  }, { tableName: 'media_tag', timestamps: false });

  const MediaCategoryModel = sequelize.define('media_category', {
    media_id: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    category_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    priority: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
  }, {
    tableName: 'media_category',
    timestamps: false,
  });

  MediaModel.hasMany(ContentModel, { foreignKey: 'media_id', as: 'contents', onDelete: 'CASCADE' });
  ContentModel.belongsTo(MediaModel, { foreignKey: 'media_id' });

  CategoryModel.hasMany(TagModel, { foreignKey: 'category_id', as: 'tags' });
  TagModel.belongsTo(CategoryModel, { foreignKey: 'category_id', as: 'category' });

  MediaTagModel.belongsTo(TagModel, { foreignKey: 'tag_id', as: 'tag' });
  MediaTagModel.belongsTo(MediaModel, { foreignKey: 'media_id', as: 'media' });

  MediaCategoryModel.belongsTo(MediaModel, { foreignKey: 'media_id', as: 'media', constraints: false });
  MediaCategoryModel.belongsTo(CategoryModel, { foreignKey: 'category_id', as: 'category', constraints: false });

  return {
    MediaModel,
    ContentModel,
    CategoryModel,
    TagModel,
    MediaTagModel,
    MediaCategoryModel,
  };
}

module.exports = class SequelizeMediaRepository extends IMediaRepository {
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

  async save(media) {
    if (!(media instanceof Media)) {
      throw new Error();
    }

    const executionScope = this.#unitOfWorkContext.getCurrent();
    const { MediaModel, ContentModel, CategoryModel, TagModel, MediaTagModel, MediaCategoryModel } = this.#models;
    const mediaId = media.getId().getId();

    const existingMedia = await MediaModel.findByPk(mediaId, { transaction: executionScope });
    const mediaRecord = {
      media_id: mediaId,
      title: media.getTitle().getTitle(),
      updated_at: new Date(),
    };
    if (!existingMedia) {
      await MediaModel.create(mediaRecord, { transaction: executionScope });
    } else {
      await MediaModel.update(mediaRecord, { where: { media_id: mediaId }, transaction: executionScope });
    }

    await ContentModel.destroy({ where: { media_id: mediaId }, transaction: executionScope });
    const contentRecords = media.getContents().map((content, index) => ({
      media_id: mediaId,
      content_id: content.getId(),
      position: index + 1,
    }));
    await ContentModel.bulkCreate(contentRecords, { transaction: executionScope });

    await MediaTagModel.destroy({ where: { media_id: mediaId }, transaction: executionScope });
    await MediaCategoryModel.destroy({ where: { media_id: mediaId }, transaction: executionScope });

    const priorityCategories = media
      .getPriorityCategories()
      .map(category => category.getValue());

    const categoryRows = new Map();
    for (const [index, categoryName] of priorityCategories.entries()) {
      const [category] = await CategoryModel.findOrCreate({
        where: { name: categoryName },
        defaults: { name: categoryName },
        transaction: executionScope,
      });

      categoryRows.set(categoryName, category);

      await MediaCategoryModel.create({
        media_id: mediaId,
        category_id: category.category_id,
        priority: index + 1,
      }, { transaction: executionScope });
    }

    for (const tag of media.getTags()) {
      const categoryName = tag.getCategory().getValue();
      const labelName = tag.getLabel().getLabel();

      let category = categoryRows.get(categoryName);
      if (!category) {
        [category] = await CategoryModel.findOrCreate({
          where: { name: categoryName },
          defaults: { name: categoryName },
          transaction: executionScope,
        });
        categoryRows.set(categoryName, category);
      }

      const [tagRow] = await TagModel.findOrCreate({
        where: {
          category_id: category.category_id,
          name: labelName,
        },
        defaults: {
          category_id: category.category_id,
          name: labelName,
        },
        transaction: executionScope,
      });

      await MediaTagModel.create({
        media_id: mediaId,
        tag_id: tagRow.tag_id,
      }, { transaction: executionScope });
    }
  }

  async findByMediaId(mediaId) {
    if (!(mediaId instanceof MediaId)) {
      throw new Error();
    }

    const executionScope = this.#unitOfWorkContext.getCurrent();
    const { MediaModel, ContentModel, TagModel, CategoryModel, MediaTagModel, MediaCategoryModel } = this.#models;

    const mediaRow = await MediaModel.findByPk(mediaId.getId(), {
      include: [{
        model: ContentModel,
        as: 'contents',
      }],
      transaction: executionScope,
    });

    if (!mediaRow) {
      return null;
    }

    const mediaTags = await MediaTagModel.findAll({
      where: { media_id: mediaRow.media_id },
      include: [{
        model: TagModel,
        as: 'tag',
        include: [{ model: CategoryModel, as: 'category' }],
      }],
      transaction: executionScope,
    });

    const mediaCategories = await MediaCategoryModel.findAll({
      where: { media_id: mediaRow.media_id },
      include: [{
        model: CategoryModel,
        as: 'category',
      }],
      order: [['priority', 'ASC']],
      transaction: executionScope,
    });

    const contents = mediaRow.contents
      .sort((a, b) => a.position - b.position)
      .map(content => new ContentId(content.content_id));

    const tags = mediaTags.map(mediaTag => new Tag(
      new Category(mediaTag.tag.category.name),
      new Label(mediaTag.tag.name)
    ));

    const priorityCategories = mediaCategories
      .map(mediaCategory => new Category(mediaCategory.category.name));

    const registeredAt = mediaRow.created_at instanceof Date
      ? mediaRow.created_at
      : (mediaRow.created_at ? new Date(mediaRow.created_at) : null);

    return new Media(
      new MediaId(mediaRow.media_id),
      new MediaTitle(mediaRow.title),
      contents,
      tags,
      priorityCategories,
      registeredAt,
    );
  }

  async delete(media) {
    if (!(media instanceof Media)) {
      throw new Error();
    }

    const executionScope = this.#unitOfWorkContext.getCurrent();
    const { MediaModel, MediaTagModel, MediaCategoryModel, ContentModel } = this.#models;
    const mediaId = media.getId().getId();

    await MediaTagModel.destroy({ where: { media_id: mediaId }, transaction: executionScope });
    await MediaCategoryModel.destroy({ where: { media_id: mediaId }, transaction: executionScope });
    await ContentModel.destroy({ where: { media_id: mediaId }, transaction: executionScope });

    await MediaModel.destroy({
      where: { media_id: mediaId },
      transaction: executionScope,
    });
  }
};

module.exports.defineModels = defineModels;
