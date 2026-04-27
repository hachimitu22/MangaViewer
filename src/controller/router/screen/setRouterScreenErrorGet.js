const setRouterScreenErrorGet = ({
  router,
}) => {
  router.get('/screen/error', (_req, res) => {
    res.status(200).render('screen/error', {
      pageTitle: 'エラーが発生しました',
      currentPath: '/screen/error',
      currentUserId: null,
      errorTitle: 'ページを表示できませんでした',
      errorMessage: '対象のデータが見つからない場合や、一時的な問題が発生した場合にこの画面が表示されます。時間をおいて再度お試しいただくか、別の画面へお戻りください。',
      navigationLinks: [
        {
          href: '/screen/summary',
          label: '一覧・サマリー画面へ戻る',
        },
        {
          href: '/screen/entry',
          label: '登録画面へ戻る',
        },
      ],
    });
  });
};

module.exports = setRouterScreenErrorGet;
