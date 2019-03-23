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
    manager: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

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
        wx.showToast({
          title: '跳转到管理',
        })
      return
    }
   this.checkUserLogin().then(()=>{
      //跳转管理；
      wx.showToast({
        title: '跳转到管理',
      })
   }).catch(()=>{
     //申请权限
     wx.showToast({
       title: '去申请权限',
       icon:'none'
     })
   });
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

  },
  checkUserLogin:function(){
    return new Promise((resolve,reject)=>{
      app.showLoadingMask("检查授权信息");
      app.checkUserPermission().then(res => {
        console.log('It is has userinfo permission? :' + res);
        if (res) {
          //授权过了 登陆
          app.login().then(() => {
            wx.hideLoading();
            //登陆成功 跳转
            resolve();
          }).catch(app.showErrNoCancel('登陆异常', error.errMsg));
        } else { //申请权限
          //去权限申请页
          reject();
        }
      }).catch(err => {
        console.log(err.errMsg);
        app.showErrNoCancel("检查权限异常", err.errMsg);
      });
    })
  }
})