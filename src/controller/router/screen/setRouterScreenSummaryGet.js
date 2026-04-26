const { Input, InputSortType } = require('../../../application/media/query/SearchMediaService');
const { mapMediaOverviewThumbnailToPublicPath } = require('../../screen/publicContentPath');
const { DEFAULT_SUMMARY_PAGE, DEFAULT_START, DEFAULT_SIZE } = require('./setRouterScreenSearchGet');

const SORT_TYPES_BY_QUERY = Object.freeze({ date_asc: InputSortType.DATE_ASC, date_desc: InputSortType.DATE_DESC, title_asc: InputSortType.TITLE_ASC, title_desc: InputSortType.TITLE_DESC, random: InputSortType.RANDOM });
const normalizeTags = rawTags => (rawTags === undefined ? [] : (Array.isArray(rawTags) ? rawTags : [rawTags]))
  .filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean)
  .map(v => { const i = v.indexOf(':'); return i > 0 && i < v.length - 1 ? { category: v.slice(0, i).trim(), label: v.slice(i + 1).trim() } : null; })
  .filter(tag => tag && tag.category && tag.label);
const normalizePositiveInteger = (v, f) => { const n = Number.parseInt(v ?? '', 10); return Number.isInteger(n) && n > 0 ? n : f; };
const normalizeSearchRange = ({ summaryPage, start, size }) => {
  const s = normalizePositiveInteger(size, DEFAULT_SIZE); const st = normalizePositiveInteger(start, null);
  if (st !== null) return { summaryPage: Math.floor((st - 1) / s) + 1, start: st, size: s };
  const p = normalizePositiveInteger(summaryPage, DEFAULT_SUMMARY_PAGE); return { summaryPage: p, start: ((p - 1) * s) + 1, size: s };
};
const createPagination = ({ totalCount, summaryPage, pageSize }) => {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize)); const currentPage = Math.min(Math.max(summaryPage, 1), totalPages); const items = [];
  for (let p = 1; p <= totalPages; p += 1) items.push(p); return { totalPages, currentPage, items };
};

const setRouterScreenSummaryGet = ({ router, searchMediaService }) => {
  router.get('/screen/summary', async (req, res, next) => {
    try {
      const range = normalizeSearchRange({ summaryPage: req.query.summaryPage, start: req.query.start, size: req.query.size });
      const title = typeof req.query.title === 'string' ? req.query.title : '';
      const tags = normalizeTags(req.query.tags);
      const sort = typeof req.query.sort === 'string' && SORT_TYPES_BY_QUERY[req.query.sort] ? req.query.sort : 'date_asc';
      const result = await searchMediaService.execute(new Input({ title, tags, sortType: SORT_TYPES_BY_QUERY[sort], start: range.start, size: range.size }));
      const pagination = createPagination({ totalCount: result.totalCount, summaryPage: range.summaryPage, pageSize: range.size });
      res.status(200).render('screen/summary', {
        pageTitle: 'メディア一覧',
        currentConditions: { summaryPage: pagination.currentPage, title, tags, sort, start: range.start, size: range.size },
        mediaOverviews: result.mediaOverviews.map(mapMediaOverviewThumbnailToPublicPath),
        totalCount: result.totalCount,
        pagination,
        currentPath: '/screen/summary',
        currentUserId: null,
      });
    } catch (error) { next(error); }
  });
};

module.exports = setRouterScreenSummaryGet;
module.exports.SORT_TYPES_BY_QUERY = SORT_TYPES_BY_QUERY;
module.exports.normalizeTags = normalizeTags;
module.exports.normalizeSearchRange = normalizeSearchRange;
module.exports.createPagination = createPagination;
