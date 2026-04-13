const readSummaryTitles = async currentPage => currentPage.evaluate(() => {
  const headingElements = Array.from(document.querySelectorAll('.media-card h2'));
  return headingElements.map(node => (node.textContent || '').trim()).filter(Boolean);
});

module.exports = {
  readSummaryTitles,
};
