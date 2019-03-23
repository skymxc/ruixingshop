// miniprogram/pages/authorize/authorize.js
const app = getApp();
/**
 *  使用 wx.reLaunch(Object object)；可以关闭之前所有的页面，这样就算不同意也可以 很直接退出了。
 * 
 * 在授权后 使用 wx.redirectTo(Object object) 跳转回去，这样就把当前页面关闭了。就不会返回回来了。
 */
Page({

  /**
   * 页面的初始数据
   */
  data: {
    permiession_text:'获得你的公开信息（昵称，头像等）'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      //检查 当前用户是否拥有 获取用户信息的权限
    var that = this;
    app.showLoadingMask('拉取授权');
    app.checkUserPermission().then(res=>{
        wx.hideLoading();
        if(res){
            //直接登陆
            that.login();
        }
    }).catch(app.showErrNoCancel('拉取错误',error.errMsg));
   
  },
  onGetUserInfo:function(event){
    app.globalData.userInfo = event.detail.userInfo;
    app.globalData.logged = true;
    this.login();
    
  },
  login:function(){

    app.showLoadingMask('正在登陆');

    var that = this;

    //登陆 获取openID
    app.login().then(res => {
          wx.hideLoading();
          //返回首页
          that.toReturn();
       
    }).catch(error => {
      wx.hideLoading();

      wx.showModal({
        title: '网络异常！',
        content: error.errMsg,
        showCancel: false
      });
    });
  },
  toReturn:function(){
    //返回首页
    wx.showLoading({
      title: '登陆成功，返回中',
      mask:true
    })
    wx.redirectTo({
      url: '../booklist/booklist',
      success: function () {
        wx.hideLoading();
      },
      fail: function (err) {
        console.error(err);
        wx.showModal({
          title: '异常！',
          content: err.errMsg,
          showCancel: false
        });
      }
    });
  },
  tapAuthLogin:function(){
    wx.showLoading({
      title: '请稍后',
      mask:true
    })
  }
})