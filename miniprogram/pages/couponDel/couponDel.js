// miniprogram/pages/couponDel/couponDel.js
/**
 * 这里的删除并非真正的删除，知识令优惠卷无效，数量 为0
 */
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    lastTime: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.listCoupon();
  },
  /**
   * 只列出了在有效期的优惠卷
   */
  listCoupon: function() {
    this.data.lastTime = new Date().getTime();
    var _ =db.command;
    app.loading();
    var that =this;
    db.collection('coupon').skip(this.data.list.length)
      .where({ validity: _.gte(this.data.lastTime)}).get()
      .then(res=>{
        wx.hideLoading();
        if(res.data.length==0) return;
        that.data.list = that.data.list.concat(res.data);
        that.setData({
          list:that.data.list
        })
      }).catch(error=>app.showError(error,'加载错误'));
  }
})