const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const category = sequelize.define('Category', {
    category_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  category.associate = (modules) => {
    category.hasMany(modules.Label, {
      foreignKey: 'category_id',
    });
  };

  return category;
};
