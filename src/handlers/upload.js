const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const itemId = req.params && parseInt(req.params.id) || null;
    const dir = path.join(__dirname, `../../tmp/${itemId}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
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
    const filename = req.file.originalname;
    const src = path.join(__dirname, `../../tmp/${itemId}/${filename}`);
    const dest = path.join(__dirname, `../../public/images/${itemId}/${filename}`);
    if (!fs.existsSync(`../../public/images/${itemId}`)) {
      fs.mkdirSync(`../../public/images/${itemId}`, { recursive: true });
    }
    fs.renameSync(src, dest);
    res.redirect(`/edit/${itemId}`);
  },
];

module.exports = handlers;
