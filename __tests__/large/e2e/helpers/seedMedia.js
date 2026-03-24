const Media = require('../../../../src/domain/media/media');
const MediaId = require('../../../../src/domain/media/mediaId');
const MediaTitle = require('../../../../src/domain/media/mediaTitle');
const ContentId = require('../../../../src/domain/media/contentId');
const Tag = require('../../../../src/domain/media/tag');
const Category = require('../../../../src/domain/media/category');
const Label = require('../../../../src/domain/media/label');

const createSeedMedia = ({
  mediaId,
  title,
  contentId,
  tags = [{ category: 'カテゴリ', label: 'ラベル' }],
  priorityCategories = tags.length > 0 ? [tags[0].category] : [],
  registeredAt,
}) => new Media(
  new MediaId(mediaId),
  new MediaTitle(title),
  [new ContentId(contentId)],
  tags.map(tag => new Tag(new Category(tag.category), new Label(tag.label))),
  priorityCategories.map(category => new Category(category)),
  registeredAt,
);

module.exports = {
  createSeedMedia,
};
