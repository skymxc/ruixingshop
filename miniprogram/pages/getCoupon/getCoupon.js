// miniprogram/pages/getCoupon/getCoupon.js
const app =getApp();
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[],
    refresh:false,
    ids:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.listCoupon();
  },
  /**
   * 只列出了在有效期的优惠卷
   */
  listCoupon: function () {
    this.data.lastTime = new Date().getTime();
    var _ = db.command;
    app.loading();
    var that = this;
    var skip = this.data.list.length;
    if (that.data.refresh){
      skip =0;
    }
    var time = new Date().getTime();
    var _ = db.command;
    db.collection('coupon').skip(skip)
      .where({ 
        validity: _.gte(time) ,
        _id:_.nin(that.data.ids),
        num:_.gt(0)
        })
      .orderBy('createDate','desc').get()
      .then(res => {
        wx.hideLoading();
        if(that.data.refresh){
          that.data.list =res.data;
        }else{
          that.data.list = that.data.list.concat(res.data);
        }
        
        that.setData({
          list: that.data.list
        })
      }).catch(error => app.showError(error, '加载错误'));
  },
  onReachBottom: function () {
    var current = new Date().getTime();
    if (current - this.data.lastTime < 5 * 1000) {
      return;
    }
    this.listCoupon();
  },
  tapGet:function(event){
    var index = event.currentTarget.dataset.index;
    var coupon = this.data.list[index];
    app.loading();
    var where={
      _openid:app.globalData.openid,
      coupon_id:coupon._id
    }
    dbUtils.count('mycoupon',where)
    .then(res=>this.countAfter(res,index,coupon))
    .then(res=>this.updateCoupon(res,index))
    .catch(error=>app.showError(error,'领取失败'));
  },
  /**
   * 查看是否已经领取了之后
   */
  countAfter(res,index,coupon){
    console.log('是否已经领取了',res);
    if(res.total!=0){//已经领取过了
      wx.hideLoading();
      this.data.list.splice(index,1);
      this.data.ids.push(coupon);
      this.setData({
        list:this.data.list,
        ids:this.data.ids
      })
      return;
    }
   return wx.cloud.callFunction({
     name:'incCoupon',
     data:{
       _id:coupon._id
     }
   });
  },
  /**
   * 更改 coupon
   */
  updateCoupon:function(res,index){
    if(!app.checkEnable(res)){
      return;
    }
    console.log('更改优惠卷后',res)
    var coupon = this.data.list[index];
    if(!res.result){
      wx.hideLoading();
      app.showToast('没抢上哦！');
      this.data.list.splice(index,1);
      this.data.ids.push(coupon._id);
      this.setData({
        list:this.data.list,
        ids:this.data.ids
      })
      return;
    }
    var mycoupon={
      coupon_id:coupon._id,
      coupon:coupon
    }
   return db.collection('mycoupon').add({data:mycoupon});
  },
  /**
   * 是否插入成功
   */
  addAfter:function(res,index){
    if (!app.checkEnable(res)) {
      return;
    }
    var coupon = this.data.list[index];
    console.log('addAfter-》',res);
    wx.hideLoading();
    if(res._id){
     
     
      this.data.list.splice(index, 1);
      this.data.ids.push(coupon._id);
      this.setData({
        list: this.data.list,
        ids: this.data.ids
      })
      wx.showToast({
        title: '领取成功',
      })
    }else{
      app.showToast('请稍后再试')
    }
  }
})