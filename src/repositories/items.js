const allItems = [
  {
    id: 1,
    title: 'abc',
    thumbnail: '/images/dummy01.png',
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
      '/images/dummy01.png',
      '/images/dummy02.png',
      '/images/dummy03.png',
      '/images/dummy04.png',
      '/images/dummy05.png',
    ],
  },
  {
    id: 2,
    title: 'def',
    thumbnail: '/images/dummy06.png',
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
      '/images/dummy06.png',
      '/images/dummy07.png',
      '/images/dummy08.png',
      '/images/dummy09.png',
      '/images/dummy10.png',
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
