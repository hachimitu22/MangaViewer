const { randomUUID } = require('crypto');

class MulterContentStorageResolver {
  constructor(multerInstance) {
    if (!multerInstance || typeof multerInstance.single !== 'function') {
      throw new Error('multer() の戻り値を指定してください。');
    }

    this.multerInstance = multerInstance;
  }

  resolveSingle(fieldName = 'contents') {
    return (req, res, next) => {
      this.multerInstance.single(fieldName)(req, res, (error) => {
        if (error) {
          next(error);
          return;
        }

        if (req.file) {
          const contentId = randomUUID().replace(/-/g, '');
          req.file.filename = contentId;
          req.file.contentId = contentId;
          req.contentId = contentId;
        }

        next();
      });
    };
  }
}

module.exports = MulterContentStorageResolver;
