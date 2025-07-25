const fs = require('fs').promises;
const path = require('path');
const { Manga, Label, Category, MangaLabel } = require('../models');

module.exports = {
  getMangaDetail: async (id) => {
    const mangaDetailRecords = await Manga.findAll({
      attributes: ['manga_id', 'title', 'path'],
      where: {
        manga_id: id,
      },
      include: [
        {
          model: Label,
          attributes: ['name'],
          through: { attributes: [] },
          include: [
            {
              model: Category,
              attributes: ['name'],
              where: {},
            },
          ],
        },
      ],
      raw: true,
    });

    const categories = Object.values(mangaDetailRecords.reduce((o, cur) => {
      if (!o[cur['Labels.Category.category_id']]) {
        o[cur['Labels.Category.category_id']] = { name: cur['Labels.Category.name'], labels: [] };
      }
      o[cur['Labels.Category.category_id']].labels.push(cur['Labels.name']);

      return o;
    }, {}));

    const files = await fs.readdir(path.join(process.cwd(), 'public', mangaDetailRecords[0].path));
    return {
      id: mangaDetailRecords[0].manga_id,
      title: mangaDetailRecords[0].title,
      thumbnails: files.map(p => `/images/${id}/${p}`),
      categories,
    };
  },
  searchMangaSummaries: async condition => {
    const query = {
      attributes: ['manga_id', 'title', 'thumbnail'],
      include: [
        {
          model: Label,
          attributes: [],
          through: { attributes: [] },
          where: {},
          include: [
            {
              model: Category,
              attributes: [],
              where: {},
            },
          ],
        },
      ],
      raw: true,
    };
    const query2 = {
      attributes: [['name', 'category_name']],
      include: [
        {
          model: Label,
          attributes: [['name', 'label_name']],
          include: [
            {
              model: Manga,
              through: {
                model: MangaLabel,
                attributes: [],
              },
              attributes: ['manga_id'],
              where: {},
            },
          ],
        },
      ],
      raw: true,
    };

    if (condition) {
      const [category, label] = condition.split(':');
      query.include[0].where.name = label;
      query.include[0].include[0].where.name = category;
    }

    const _mangas = await Manga.findAll(query);
    const mangas = Object.values(_mangas.reduce((o, cur) => {
      if (!o[cur.manga_id]) {
        o[cur.manga_id] = cur;
      }
      return o;
    }, {}));
    query2.include[0].include[0].where.manga_id = mangas.map(o => o.manga_id);
    const categoryLabelList = await Category.findAll(query2);

    const obj = mangas.map(manga => {
      const _categories = categoryLabelList.filter(cls => cls['Labels.Mangas.manga_id'] === manga.manga_id);
      const categories = Object.values(_categories.reduce((o, cur) => {
        const category_name = cur.category_name;
        if (!o[category_name]) {
          o[category_name] = { name: category_name, labels: [] };
        }

        o[category_name].labels.push(cur['Labels.label_name']);

        return o;
      }, {}));

      return {
        id: manga.manga_id,
        title: manga.title,
        thumbnail: manga.thumbnail,
        categories,
      }
    })

    return obj;
  },
};
