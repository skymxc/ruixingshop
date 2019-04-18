// miniprogram/pages/orderlist/orderlist.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    state: -2,
    manager: true,
    list:[],
    refresh:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(options);
    this.setData({
      state: options.state,
      manager: app.globalData.userInfo.manager
    })
    this.loadOrderList();
  },
  loadOrderList: function() {
    var _ = db.command;

    var where={
      state:this.data.state
    }
    if(where.state=='-2'){
       where.state= _.neq(-1)
    }
    var skip = this.data.refresh?0:this.data.list.length;
    var that =this;
    db.collection('order').where(where).skip(skip).get()
    .then(res=>{
        if(that.data.refresh){
          that.data.list = res.data;
        }else{
          that.data.list = that.data.list.concat(res.data);
        }
        that.setData({
          list:that.data.list
        })
    }).catch(error=>app.showError(error,'加载错误'));
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
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})