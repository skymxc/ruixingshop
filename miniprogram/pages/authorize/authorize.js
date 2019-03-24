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
    permiession_text: '获得你的公开信息（昵称，头像等）'
  },

  /**
   * 生命周期函数--监听页面加载
   * 
   */
  onLoad: function(options) {
    //检查 当前用户是否拥有 获取用户信息的权限
    var that = this;
    app.showLoadingMask('拉取授权');
    app.checkUserPermission().then(res => {
      wx.hideLoading();
      if (res) {
        //直接获取用户信息登陆
        app.login().then(() =>that.back()).catch(error =>app.showErrNoCancel('登陆失败', error.errMsg));
      }
    }).catch(error=>app.showErrNoCancel('拉取错误', error.errMsg));

  },
  onGetUserInfo: function(event) {
    console.log(event);
    var that = this;
    if(event.detail.userInfo){
      console.log(event.detail.userInfo)
      app.globalData.userInfo = event.detail.userInfo;
      app.globalData.logged = true;
      app.getOpenid()
        .then(() => app.userExistInDB())
        .then(data => app.countDBUser(data))
        .then(() => that.back())
        .catch(error =>{
          console.error(error);
          app.showErrNoCancel('登陆失败', error.errMsg)
        });
    }else{
      wx.hideLoading();
  
    }
    
  },
  back:function(){
    //登陆成功 关闭
    app.showLoadingMask('登陆成功');
    wx.navigateBack({
      success: function () {
        wx.hideLoading();
      },
      fail: function (error) {
        app.showErrNoCancel('跳转失败', error.errMsg);
      }
    });
  },
  tapAuth:function(){
    app.showLoadingMask('拉取中');
  }
})