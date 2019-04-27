// miniprogram/pages/couponManager/couponManager.js
const app =getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  tapPublish(){
    app.navigateTo('../couponPublish/couponPublish')
  },
  tapDel(){
    app.navigateTo('../couponDel/couponDel')
  }
})