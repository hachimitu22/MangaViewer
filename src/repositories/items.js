const allItems = [
  {
    id: 1,
    title: 'abc',
    thumbnail: '/images/slash_001.png',
    categories: [
      {
        name: 'tag',
        labels: [
          'tag1',
          'tag2',
        ],
      },
    ],
    thumbnails: [
      '/images/slash_001.png',
      '/images/slash_002.png',
      '/images/slash_003.png',
      '/images/slash_004.png',
      '/images/slash_005.png',
    ],
  },
  {
    id: 2,
    title: 'def',
    thumbnail: '/images/slash_006.png',
    categories: [
      {
        name: 'tag',
        labels: [
          'tag3',
          'tag4',
        ],
      },
    ],
    thumbnails: [
      '/images/slash_006.png',
      '/images/slash_007.png',
      '/images/slash_008.png',
      '/images/slash_009.png',
      '/images/slash_010.png',
    ],
  },
];

const hasLabel = (item, category, label) => {
  const c = item.categories.find(c => c.name === category);
  return c && c.labels.includes(label);
};

module.exports = {
  getItem: id => {
    return allItems.find(item => item.id === id);
  },
  searchItemList: condition => {
    if (condition) {
      const [category, label] = condition.split(':');
      const preList = allItems.filter(item => {
        return hasLabel(item, category, label);
      });
      return preList.map(item => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        categories: item.categories,
      }));
    } else {
      return allItems.map(item => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        categories: item.categories,
      }));
    }
  },
};
