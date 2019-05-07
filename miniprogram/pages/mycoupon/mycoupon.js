// miniprogram/pages/mycoupon/mycoupon.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   * state{
   * 0 未使用
   * 1 已使用
   * 2 已过期
   * }
   */
  data: {
    list: [],
    lastTime: 0,
    state: '0',
    key:'unused'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
    this.listCoupon();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    var current = new Date().getTime();
    if (current - this.data.lastTime < 5 * 1000) {
      return;
    }
   this.listCoupon();
  },
  listCoupon: function() {
    this.data.lastTime = new Date().getTime();
    var _ = db.command;
    app.loading();
    var that = this;
    var skip = this.data.list.length;

    var order = 'getDate'
    var time = this.data.lastTime;
    var where = {
      validity: _.gte(time),
      used: false,
      _openid:app.globalData.openid
    }

    if (this.data.state == '1') {
      where = {
        used: true,
        _openid: app.globalData.openid
      }
      order = 'usedDate'
    } else if (this.data.state == '2') {
      where.validity = _.lte(time)

    }
    var _ = db.command;
    app.loading();
    console.log('listcoupon->',where)
    db.collection('mycoupon').skip(skip)
      .where(where)
      .orderBy(order, 'desc').get()
      .then(res => {
        wx.hideLoading();
        that.data.list = that.data.list.concat(res.data);
        that.setData({
          list: that.data.list
        })
      }).catch(error => app.showError(error, '加载错误'));
  },
  tapState: function(event) {
    var state = event.currentTarget.dataset.state;
    if (state == this.data.state) return;
    var key = 'unused'
    if (state == '1') {
      key = 'used'
    } else if (state == '2') {
      key = 'lose'
    }
    app.loading();
    //将现在显示的放入缓存
    if(this.data.list.length>0){
      wx.setStorageSync(this.data.key, this.data.list);
    }
   
   var res= wx.getStorageInfoSync();
   console.log('res-->',res);
   if(res.keys.indexOf(key)!=-1){
     //有缓存
     var list = wx.getStorageSync(key);
    
     this.setData({
       list:list,
       key:key,
       state:state
     });
     wx.hideLoading();
   }else{
     //无缓存
      this.setData({
        key:key,
        list: [],
        state: state
      })
      this.listCoupon();
   }
   

  },
  onUnload:function(){
    var res =wx.getStorageInfoSync();
    if(res.keys.indexOf('unused')!=-1){
      wx.removeStorage({
        key: 'unused',
        success: function(res) {},
      })
    }
    if (res.keys.indexOf('used') != -1) {
      wx.removeStorage({
        key: 'used',
        success: function (res) { },
      })
    }
    if (res.keys.indexOf('lose') != -1) {
      wx.removeStorage({
        key: 'lose',
        success: function (res) { },
      })
    }
  }
})