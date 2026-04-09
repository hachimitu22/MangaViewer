const ALLOWED_CONTENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const ALLOWED_CONTENT_EXTENSIONS = new Set([
  '',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.mp4',
  '.webm',
  '.mov',
]);

module.exports = {
  ALLOWED_CONTENT_MIME_TYPES,
  ALLOWED_CONTENT_EXTENSIONS,
};
