// miniprogram/pages/memberCenter/memberCenter.js 


/**
 * 会员中心
 */
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    manager: false,
    userInfo:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //用户登陆
    //是否已经登陆
    if (app.globalData.logged) {
      this.setData({
        userInfo: app.globalData.userInfo.info,
        manager:app.globalData.userInfo.manager
      })
      // console.log('是否是管理员->',this.data.manager)
    }else{
      var that =this;
      this.checkUserLogin().then(() => {
        that.setData({
          userInfo: app.globalData.userInfo.info,
          manager: app.globalData.userInfo.manager
        })
        // console.log('是否是管理员->', that.data.manager)
      }).catch(() => this.navigateToAuthorize());
    }
   
  },
  tapMyAttention:function(){
    app.navigateTo('../myattention/myattention')
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },
  /**
   * 点击商品管理
   */
  tapManagerGoods: function(event) {
    //是否已经登陆
    if (app.globalData.logged) {
      app.navigateTo('../goodsManager/goodsManager');
      return
    }
    this.checkUserLogin().then(() => {
      //跳转管理；
      app.navigateTo('../goodsManager/goodsManager');
    }).catch(() => this.navigateToAuthorize());
  },
  /**
   * 点击订单管理
   */
  tapManagerOrder: function(event) {

  },
  /**
   * 点击优惠卷管理
   */
  tapManagerCoupon: function(event) {
    app.navigateTo('../couponManager/couponManager')
  },
  checkUserLogin: function() {
    return new Promise((resolve, reject) => {
      app.showLoadingMask("检查授权信息");
      app.checkUserPermission().then(res => {
        console.log('It is has userinfo permission? :' + res);
        if (res) {
          //授权过了 登陆
          app.login().then(() => {
            wx.hideLoading();
            //登陆成功 跳转
            resolve();
          }).catch(error => app.showErrNoCancel('登陆异常', error.errMsg));
        } else { //申请权限
          //去权限申请页
          reject();
        }
      }).catch(err => {
        console.log(err.errMsg);
        app.showErrNoCancel("检查权限异常", err.errMsg);
      });
    })
  },
  /**
   * 去申请获取用户信息的权限
   */
  navigateToAuthorize: function() {
    app.showLoadingMask('申请授权');
    wx.navigateTo({
      url: '../authorize/authorize',
      success: function() {
        wx.hideLoading();
      },
      fail: function(error) {
        app.showErrNoCancel('授权失败', error.errMsg);
      }
    })
  },
  tapOrder:function(event){
    var state = event.currentTarget.dataset.state;
    app.navigateTo('../orderlist/orderlist?state='+state)
  },
  tapOrderManager:function(){
    app.navigateTo('../orderlist/orderlist?manager=true')
  },
  tapManagerAddress:function(){
    app.navigateTo('../addressManager/addressManager');
  },
  tapMyEvaluate:function(){
    app.navigateTo('../myEvaluate/myEvaluate');
  }
})