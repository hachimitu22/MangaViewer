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
    media_id: { type: DataTypes.STRING, allowNull: false },
    category_id: { type: DataTypes.INTEGER, allowNull: false },
    tag_id: { type: DataTypes.INTEGER, allowNull: true },
    priority: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'media_tag', timestamps: false });

  MediaModel.hasMany(ContentModel, { foreignKey: 'media_id', as: 'contents', onDelete: 'CASCADE' });
  ContentModel.belongsTo(MediaModel, { foreignKey: 'media_id' });

  CategoryModel.hasMany(TagModel, { foreignKey: 'category_id', as: 'tags' });
  TagModel.belongsTo(CategoryModel, { foreignKey: 'category_id', as: 'category' });

  MediaTagModel.belongsTo(TagModel, { foreignKey: 'tag_id', as: 'tag' });
  MediaTagModel.belongsTo(MediaModel, { foreignKey: 'media_id', as: 'media' });
  MediaTagModel.belongsTo(CategoryModel, { foreignKey: 'category_id', as: 'category' });

  return {
    MediaModel,
    ContentModel,
    CategoryModel,
    TagModel,
    MediaTagModel,
  };
}

module.exports = class SequelizeMediaRepository extends IMediaRepository {
  #sequelize;
  #models;

  constructor({ sequelize, models } = {}) {
    super();

    if (!sequelize || typeof sequelize.transaction !== 'function') {
      throw new Error();
    }

    this.#sequelize = sequelize;
    this.#models = models || defineModels(sequelize);
  }

  async sync() {
    await this.#sequelize.sync();
  }

  async save(media) {
    if (!(media instanceof Media)) {
      throw new Error();
    }

    const { MediaModel, ContentModel, CategoryModel, TagModel, MediaTagModel } = this.#models;

    await this.#sequelize.transaction(async transaction => {
      const mediaId = media.getId().getId();

      await MediaModel.upsert({
        media_id: mediaId,
        title: media.getTitle().getTitle(),
      }, { transaction });

      await ContentModel.destroy({ where: { media_id: mediaId }, transaction });
      const contentRecords = media.getContents().map((content, index) => ({
        media_id: mediaId,
        content_id: content.getId(),
        position: index + 1,
      }));
      await ContentModel.bulkCreate(contentRecords, { transaction });

      await MediaTagModel.destroy({ where: { media_id: mediaId }, transaction });

      const priorityCategories = media
        .getPriorityCategories()
        .map(category => category.getValue());

      const categoryRows = new Map();
      for (const [index, categoryName] of priorityCategories.entries()) {
        const [category] = await CategoryModel.findOrCreate({
          where: { name: categoryName },
          defaults: { name: categoryName },
          transaction,
        });

        categoryRows.set(categoryName, category);

        await MediaTagModel.create({
          media_id: mediaId,
          category_id: category.category_id,
          tag_id: null,
          priority: index + 1,
        }, { transaction });
      }

      for (const tag of media.getTags()) {
        const categoryName = tag.getCategory().getValue();
        const labelName = tag.getLabel().getLabel();

        let category = categoryRows.get(categoryName);
        if (!category) {
          [category] = await CategoryModel.findOrCreate({
            where: { name: categoryName },
            defaults: { name: categoryName },
            transaction,
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
          transaction,
        });

        await MediaTagModel.create({
          media_id: mediaId,
          category_id: category.category_id,
          tag_id: tagRow.tag_id,
          priority: priorityCategories.indexOf(categoryName) + 1,
        }, { transaction });
      }
    });
  }

  async findByMediaId(mediaId) {
    if (!(mediaId instanceof MediaId)) {
      throw new Error();
    }

    const { MediaModel, ContentModel, TagModel, CategoryModel, MediaTagModel } = this.#models;

    const mediaRow = await MediaModel.findByPk(mediaId.getId(), {
      include: [{
        model: ContentModel,
        as: 'contents',
      }],
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
      }, {
        model: CategoryModel,
        as: 'category',
      }],
      order: [['priority', 'ASC']],
    });

    const contents = mediaRow.contents
      .sort((a, b) => a.position - b.position)
      .map(content => new ContentId(content.content_id));

    const tags = mediaTags
      .filter(mediaTag => mediaTag.tag)
      .map(mediaTag => new Tag(
        new Category(mediaTag.tag.category.name),
        new Label(mediaTag.tag.name)
      ));

    const priorityCategories = mediaTags.reduce((categories, mediaTag) => {
      const categoryName = mediaTag.category?.name || mediaTag.tag?.category?.name;

      if (!categoryName || categories.some(category => category.getValue() === categoryName)) {
        return categories;
      }

      categories.push(new Category(categoryName));
      return categories;
    }, []);

    return new Media(
      new MediaId(mediaRow.media_id),
      new MediaTitle(mediaRow.title),
      contents,
      tags,
      priorityCategories,
    );
  }

  async delete(media) {
    if (!(media instanceof Media)) {
      throw new Error();
    }

    const { MediaModel } = this.#models;

    await MediaModel.destroy({
      where: { media_id: media.getId().getId() },
    });
  }
};

module.exports.defineModels = defineModels;
