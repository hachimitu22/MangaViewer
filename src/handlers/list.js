const { searchMangaSummaries } = require('../repositories/items');

const createPagination = page => {
  const pagination = {
    current: 1,
    totalPage: Math.floor(page.totalItem / page.pageSize),
    prev: null,
    next: 2,
  };
  if (page.current) {
    const current = Number(page.current)
    pagination.current = current;
    pagination.prev = current - 1 >= 1 ? current - 1 : null;
    pagination.next = current + 1 <= pagination.totalPage ? current + 1 : null;
  }

  return pagination;
};

module.exports = async (req, res) => {
  const query = req.query
  const content = {
    total: 100,
    items: await searchMangaSummaries(query.search),
  };

  if (content.total === 0) {
      res.render('pages/list');
  } else {
      const page = {
        current: query.page || null,
        pageSize: 2,
        totalItem: content.total,
      }
      const pagination = createPagination(page);
      res.render('pages/list', {
        items: content.items,
        search: query.search ? `search=${query.search}` : '',
        pagination,
      });
  }
};