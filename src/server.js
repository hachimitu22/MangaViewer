const app = require('./app');
const { sequelize, Manga, Label, Category, MangaLabel } = require('./models');
const { searchMangaSummaries, getMangaDetail } = require('./repositories/items');
const port = 3000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    await sequelize.sync({ force: true });
    console.log('✅ DB created');

    const transaction = await sequelize.transaction();
    try {
      await Manga.bulkCreate([
        { manga_id: 1, title: 'abc', thumbnail: '/images/1/dummy01.png', path: '/images/1' },
        { manga_id: 2, title: 'def', thumbnail: '/images/2/dummy06.png', path: '/images/2' },
      ], { validate: true });
      await Category.bulkCreate([
        { category_id: 1, name: 'tag' },
        { category_id: 2, name: 'genre' },
      ], { validate: true });
      await Label.bulkCreate([
        { label_id: 1, category_id: 1, name: 'tag1' },
        { label_id: 2, category_id: 1, name: 'tag2' },
        { label_id: 3, category_id: 1, name: 'tag3' },
        { label_id: 4, category_id: 1, name: 'tag4' },
        { label_id: 5, category_id: 2, name: 'genre1' },
        { label_id: 6, category_id: 2, name: 'genre2' },
        { label_id: 7, category_id: 2, name: 'genre3' },
        { label_id: 8, category_id: 2, name: 'genre4' },
      ], { validate: true });
      await MangaLabel.bulkCreate([
        { manga_id: 1, label_id: 1 },
        { manga_id: 1, label_id: 2 },
        { manga_id: 2, label_id: 3 },
        { manga_id: 2, label_id: 4 },
        { manga_id: 1, label_id: 5 },
        { manga_id: 1, label_id: 6 },
        { manga_id: 2, label_id: 7 },
        { manga_id: 2, label_id: 8 },
      ]);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // console.log(JSON.stringify(await searchMangaSummaries('tag:tag1'), null, 2));
    // console.log(JSON.stringify(await getMangaDetail(1), null, 2));

    app.listen(port, () => {
      console.log(`port http://localhost:${port} start`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
})();

