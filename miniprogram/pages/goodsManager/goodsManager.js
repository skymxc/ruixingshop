// miniprogram/pages/goodsManager/goodsManager.js
const app =getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   * 检查是否登陆了，可能会有从消息的地方直接打开这页面的可能。
   */
  onLoad: function (options) {
      
  },
  /**
   * 添加商品
   */
  tapAddGoods:function(){
    app.navigateTo('../addGoods/addGoods');
  },
  /**
   * 下架商品
   */
  tapLockGoods:function(){

  },
  /**
   * 全部商品
   */
  tapAllGoods:function(){

  },
  /**
   * 分类管理
   */
  tapCategoryManager:function(){

  }
})