const { Input } = require('../../../application/media/query/GetMediaDetailService');
const { toPublicContentPath } = require('../../screen/publicContentPath');

const setRouterScreenEditGet = ({ router, getMediaDetailService }) => {
  router.get('/screen/edit/:mediaId', async (req, res, next) => {
    try {
      const result = await getMediaDetailService.execute(new Input({ mediaId: req.params.mediaId }));
      const mediaDetail = {
        ...result.mediaDetail,
        contents: result.mediaDetail.contents.map(content => (typeof content === 'string'
          ? { id: content, url: toPublicContentPath(content) }
          : { ...content, url: toPublicContentPath(content.id) })),
      };

      res.status(200).render('screen/edit', {
        pageTitle: `${mediaDetail.title} の編集`,
        mediaDetail,
        categoryOptions: ['作者', 'ジャンル', 'シリーズ'],
        tagsByCategory: {
          作者: ['山田', '佐藤', '鈴木'],
          ジャンル: ['バトル', '恋愛', '日常'],
          シリーズ: ['第1部', '短編集'],
        },
        currentPath: '/screen/edit',
        currentViewerId: null,
      });
    } catch (error) {
      next(error);
    }
  });
};

module.exports = setRouterScreenEditGet;
