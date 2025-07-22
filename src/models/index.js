const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory:', { logging: false });

const defineManga = require('./manga');
const defineCategory = require('./category');
const defineLabel = require('./label');
const defineMangaLabel = require('./mangaLabel');

const db = {
  Sequelize,
  sequelize,
  Manga: defineManga(sequelize, DataTypes),
  Category: defineCategory(sequelize, DataTypes),
  Label: defineLabel(sequelize, DataTypes),
  MangaLabel: defineMangaLabel(sequelize, DataTypes),
};

Object.values(db).forEach((model) => {
  if (model.associate) model.associate(db);
});

module.exports = db;
