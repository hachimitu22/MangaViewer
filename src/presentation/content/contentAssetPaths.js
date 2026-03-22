const path = require('path');

const CONTENT_ID_PATTERN = /^[0-9a-f]{32}$/;

const assertContentId = (contentId) => {
  if (!(typeof contentId === 'string' && CONTENT_ID_PATTERN.test(contentId))) {
    throw new Error('contentId is invalid');
  }
};

const createContentPathSegments = (contentId) => {
  assertContentId(contentId);

  return [
    contentId.slice(0, 2),
    contentId.slice(2, 4),
    contentId.slice(4, 6),
    contentId.slice(6, 8),
    contentId,
  ];
};

const createContentPublicPath = (contentId) => `/content/${createContentPathSegments(contentId).join('/')}`;

const createContentStoragePath = ({ rootDirectory, contentId }) => {
  if (!(typeof rootDirectory === 'string' && rootDirectory.length > 0)) {
    throw new Error('rootDirectory is required');
  }

  return path.join(rootDirectory, ...createContentPathSegments(contentId));
};

module.exports = {
  CONTENT_ID_PATTERN,
  createContentPathSegments,
  createContentPublicPath,
  createContentStoragePath,
};
