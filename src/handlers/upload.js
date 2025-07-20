const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../tmp'));
    // cb(null, '/tmp');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });

const handlers = [
  upload.single('image'),
  (req, res) => {
    const itemId = req.params && parseInt(req.params.id) || null;
    res.redirect(`/edit/${itemId}`);
  },
];

module.exports = handlers;