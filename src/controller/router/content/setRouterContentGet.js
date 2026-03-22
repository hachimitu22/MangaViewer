const fs = require('fs');

const {
  createContentStoragePath,
} = require('../../../presentation/content/contentAssetPaths');

const detectContentType = (buffer) => {
  if (buffer.length >= 12
    && buffer[0] === 0xff
    && buffer[1] === 0xd8
    && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (buffer.length >= 8
    && buffer[0] === 0x89
    && buffer[1] === 0x50
    && buffer[2] === 0x4e
    && buffer[3] === 0x47
    && buffer[4] === 0x0d
    && buffer[5] === 0x0a
    && buffer[6] === 0x1a
    && buffer[7] === 0x0a) {
    return 'image/png';
  }

  if (buffer.length >= 6) {
    const signature = buffer.subarray(0, 6).toString('ascii');
    if (signature === 'GIF87a' || signature === 'GIF89a') {
      return 'image/gif';
    }
  }

  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp';
  }

  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return 'video/mp4';
  }

  return 'application/octet-stream';
};

const setRouterContentGet = ({ router, contentRootDirectory }) => {
  router.get('/content/:segment1/:segment2/:segment3/:segment4/:contentId([0-9a-f]{32})', (req, res) => {
    const { contentId } = req.params;
    const contentPath = createContentStoragePath({
      rootDirectory: contentRootDirectory,
      contentId,
    });

    if (!fs.existsSync(contentPath)) {
      res.status(404).json({ message: 'Not Found' });
      return;
    }

    const descriptor = fs.openSync(contentPath, 'r');

    try {
      const header = Buffer.alloc(32);
      const bytesRead = fs.readSync(descriptor, header, 0, header.length, 0);
      res.type(detectContentType(header.subarray(0, bytesRead)));
    } finally {
      fs.closeSync(descriptor);
    }

    res.sendFile(contentPath);
  });
};

module.exports = setRouterContentGet;
module.exports.detectContentType = detectContentType;
