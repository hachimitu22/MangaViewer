const { Manga, Label, Category, MangaLabel } = require('../models');

module.exports = {
  getItem: id => {
    return allItems.find(item => item.id === id);
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
