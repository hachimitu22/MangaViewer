const normalizeSeparators = value => value.replace(/\\/g, '/');

const buildShardedPath = contentId => [
  contentId.slice(0, 2),
  contentId.slice(2, 4),
  contentId.slice(4, 6),
  contentId.slice(6, 8),
  contentId,
].join('/');

const toPublicContentPath = contentId => {
  if (!(typeof contentId === 'string' && contentId.length > 0)) {
    return '';
  }

  const normalized = normalizeSeparators(contentId.trim());
  if (normalized.length === 0) {
    return '';
  }

  if (/^(https?:)?\/\//.test(normalized) || normalized.startsWith('data:')) {
    return normalized;
  }

  if (normalized.startsWith('/contents/')) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  if ((/^[0-9a-f]{32}$/).test(normalized)) {
    return `/contents/${buildShardedPath(normalized)}`;
  }

  return `/contents/${normalized.replace(/^\/+/, '')}`;
};

const mapMediaOverviewThumbnailToPublicPath = mediaOverview => ({
  ...mediaOverview,
  thumbnail: toPublicContentPath(mediaOverview.thumbnail),
});

module.exports = {
  toPublicContentPath,
  mapMediaOverviewThumbnailToPublicPath,
};
