const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const manga = sequelize.define('Manga', {
    manga_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '',
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  manga.associate = (modules) => {
    manga.belongsToMany(modules.Label, {
      through: 'MangaLabel',
      foreignKey: 'manga_id',
      otherKey: 'label_id',
    });
  };

  return manga;
};
