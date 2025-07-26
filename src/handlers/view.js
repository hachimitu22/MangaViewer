const { getMangaDetail } = require('../repositories/items');


module.exports = async (req, res) => {
  const itemId = req.params && parseInt(req.params.id) || null;
  if (!itemId) {
    return res.redirect('/');
  }

  const item = await getMangaDetail(itemId);
  if (!item) {
    return res.redirect('/');
  }

  res.render('pages/view', {
    ...item,
  });
};