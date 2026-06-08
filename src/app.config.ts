export default defineAppConfig({
  pages: [
    'pages/scan/index',
    'pages/medicine/index',
    'pages/store/index',
    'pages/report/index',
    'pages/profile/index',
    'pages/detail/index',
    'pages/circulation/index',
    'pages/verify/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0EA5E9',
    navigationBarTitleText: '药品追溯',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F9FF',
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#0EA5E9',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/scan/index',
        text: '扫码核验',
      },
      {
        pagePath: 'pages/medicine/index',
        text: '用药管理',
      },
      {
        pagePath: 'pages/store/index',
        text: '门店登记',
      },
      {
        pagePath: 'pages/report/index',
        text: '异常上报',
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人中心',
      },
    ],
  },
});
