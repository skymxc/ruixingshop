// 分类管理
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    maskVisible:false,
    confirmVisible:false,
    data:[
      {
        _id:'0',
        name:'男装',
        icon:'cloud://te-85cb20.7465-te-85cb20/image/goods/WechatIMG11.jpeg'
      },{
        _id: '1',
        name: '女装',
        icon:'cloud://te-85cb20.7465-te-85cb20/image/goods/WechatIMG11.jpeg'
      }
    ],
    category:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //为了测试
    app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
  },
  /**
   * 点击分类
   */
  tapCategory:function(event){
    var category = event.currentTarget.dataset.category;
    var index = event.currentTarget.dataset.index;
    app.showLoadingMask('请稍候');
    wx.navigateTo({
      url: '../subcategoryManager/subcategoryManager',
      success:function(){
        wx.hideLoading();
      },
      fail:function(error){
        app.showErrNoCancel('跳转错误',error.errMsg);
      }
    })
  },
  /**
   * 长按分类
   */
  longtapCategory:function(event){
    console.log(event);
    var category = event.currentTarget.dataset.category;
    var index = event.currentTarget.dataset.index;
    this.setData({
      maskVisible:true,
      confirmVisible:true,
      category:category
    });
  },
  tapMask(){
    this.setData({
      maskVisible: false,
      confirmVisible: false
    })
  }
})