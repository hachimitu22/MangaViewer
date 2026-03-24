const waitForApiResponse = ({ pageInstance, baseUrl, pathSuffix, method }) => {
  const expectedUrl = `${baseUrl}${pathSuffix}`;
  return pageInstance.waitForResponse(response => response.url() === expectedUrl
    && response.request().method() === method);
};

module.exports = {
  waitForApiResponse,
};
