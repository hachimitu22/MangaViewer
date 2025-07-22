module.exports = (sequelize, DataTypes) => {
  const mangaLabel = sequelize.define('MangaLabel', {
    manga_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    label_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  return mangaLabel;
};