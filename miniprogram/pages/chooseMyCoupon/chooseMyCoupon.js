// miniprogram/pages/chooseMyCoupon/chooseMyCoupon.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   *  openid 区分所属
   * 
   */
  data: {
    goodsList: [],
    couponList:[],
    lastTime:0,
    categoryList:[],
    subcategoryList:[],
    minTotal:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
 
    var info = wx.getStorageInfoSync();
    var time = new Date().getTime();
    if (info.keys.indexOf('choosecoupongoods') != -1) {
      var res = wx.getStorageSync('choosecoupongoods');
      console.log('res-',res);
      this.data.goodsList = res;
      var length = res.length;
      this.data.minTotal = res[0].goods_total;
      for(var i=0;i<length;i++){
        var goods = res[i];
        console.log('goods-',goods)
        this.data.categoryList.push(goods.category.category_id);
        this.data.subcategoryList.push(goods.subcategory.subcategory_id);
        if(goods.goods_total<this.data.minTotal){
          this.data.minTotal = goods.goods_total;
        }
      }

    }
  this.listCoupon();
  },
  listCoupon:function(){
    app.loading();
    this.data.lastTime = new Date().getTime();
    var _ = db.command;
    console.log(this.data.lastTime)
    var where={
       // _openid:app.globalData.openid,
      validity:_.gte(this.data.lastTime),
      used:false,
      category_id:_.or([_.in(this.data.categoryList),_.eq('all')]),
      threshold:_.lte(this.data.minTotal)
    }
    var that =this;
    db.collection('mycoupon').where(where)
    .skip(this.data.couponList.length)
    .get().then(res=>{
        wx.hideLoading();
        that.data.couponList = that.data.couponList.concat(res.data);
        that.setData({
          couponList:that.data.couponList
        })
    }).catch(error=>app.showError(error,'加载失败'));
  },
  tapCoupon:function(event){
    var coupon = event.currentTarget.dataset.coupon;
   
    if(coupon.coupon.category._id='all'){
      //直接选择了
      this.handleCoupon(coupon);
      return;
    }
    var list = this.getGoodsByCoupon(coupon.coupon);
    if(list.length==0){
      app.showToast('使用范围不符合');
    }
    var total = new Number();
    var length =list.length;
    for(var i=0;i<length;i++){
      var goods = list[i];
      total+=goods.goods_total;
    }
    if(total<coupon.threshold){
      app.showToast('门槛为'+coupon.threshold+'元');
      return;
    }
    this.handleCoupon(coupon);

  },
  /**
   * 根据 优惠卷的分类 过滤寻找商品。
   * 1. 将所有符合 category的商品列出来。
   * 2. 继续在 categorylist里寻找 将符合 subcategory 的列出来。
   */
  getGoodsByCoupon:function(coupon){
    var list = new Array();
    var length = this.data.goodsList;
    var categoryList = new Array();
    for(var i=0;i<length;i++){
      var goods = this.data.goodsList[i];
      if(goods.category.category_id==coupon.category_id){
        categoryList.push(goods);
      }
    }
    if(categoryList.length==0) return list;
    if (coupon.subcategory_id == 'all')return categoryList;
    length = categoryList.length;
    for(var i=0;i<length;i++){
      var goods = categoryList[i];
      if(goods.subcategory_id==coupon.subcategory_id){
        list.push(goods);
      }
    }
    return list;
  },
  /**
   * 处理选择的优惠卷
   */
  handleCoupon(mycoupon){
    console.log('选择了优惠卷-',mycoupon);
    wx.setStorage({
      key: 'choosecoupon',
      data: mycoupon,
      success:function(){
        wx.navigateBack({
          
        })
      },
      fail:function(error){
        app.showError(error,'选择失败')
      }
    })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    wx.removeStorage({
      key: 'choosecoupongoods',
      success: function(res) {},
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {
    var current = new Date().getTime();
    if(current-this.data.lastTime<5*1000){
      return;
    }
    this.listCoupon();
  }
})