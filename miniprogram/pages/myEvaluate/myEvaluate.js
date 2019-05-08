// miniprogram/pages/myEvaluate/myEvaluate.js
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
    app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
    this.loadList();
  },
  loadList: function() {
    this.data.lastTime = new Date().getTime();
    app.loading();
    var that = this;
    db.collection('evaluate').skip(this.data.list.length)
      .where({
        _openid: app.globalData.openid
      }).get().then(res => {
        that.data.list = that.data.list.concat(res.data);
        that.setData({
          list: that.data.list
        })
        wx.hideLoading();
      }).catch(error => app.showError(error, '加载失败'));
  },
 tapImage:function(event){
   var index=  event.currentTarget.dataset.index;
   var evaluate =event.currentTarget.dataset.evaluate;
   wx.previewImage({
     urls: evaluate.pictures,
     current:index
   })
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
    var current = new Date().getTime();
    if (current - this.data.lastTime < 5 * 1000) {
      return;
    }
    this.loadList();
  },
  tapDelEvaluate:function(event){
    var index = event.currentTarget.dataset.index;
    var evaluate = this.data.list[index];
    var collection = 'order';
    var where = {
      _id:evaluate.order_id
    }
    var data={
      evaluate_id:''
    }
    var that =this;
    app.loading();
    wx.cloud.callFunction({
     name:'update',
     data:{
       where:where,
       data:data,
       collection:collection
     }
    }).then(res=>{
      console.log('更改订单',res);
      // if (res.result.stats.updated == 1){
          that.delEvaluate(index,evaluate);
      // }else{
        // wx.hideLoading();
        // app.showToast('删除失败');
      // }
    })
    .catch(error=>app.showError(error,'删除失败'));
  },
  delEvaluate:function(index,evaluate){
    var that =this;
    console.log('删除',evaluate);
    db.collection('evaluate').doc(evaluate._id).remove()
    .then(res=>{
        if(res.stats.removed==1){
          wx.hideLoading();
            that.data.list.splice(index,1);
            wx.showToast({
              title: '删除成功'
            })
            that.setData({
              list:that.data.list
            })
        }else{
          that.delEvaluateFaild(evaluate)
        }
    }).catch(error=>this.delEvaluate(evaluate));
  },
  delEvaluateFaild:function(evaluate){
    wx.cloud.callFunction({
      name: 'update',
      data: {
        collection: 'order',
        data: {
          evaluate_id: evaluate._id
        },
        where: {
          _id: evaluate.order_id
        }
      }
    }).then(res => {
      
      console.log('删除失败后的更改订单', res)
      app.showError({
        errMsg:'删除失败'
      }, '提示')
    }).catch(err => {
      
      app.showError(err, '删除失败')
    })
  }
})