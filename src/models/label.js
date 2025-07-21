const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const label = sequelize.define('Label', {
    label_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  label.associate = (modules) => {
    label.belongsToMany(modules.Manga, {
      through: 'MangaLabel',
      foreignKey: 'label_id',
      otherKey: 'manga_id',
    });
    label.belongsTo(modules.Category, {
      foreignKey: 'category_id',
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  };

  return label;
};
