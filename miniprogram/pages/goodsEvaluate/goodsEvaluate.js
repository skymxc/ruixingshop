// miniprogram/pages/goodsEvaluate/goodsEvaluate.js
const app =getApp();
const db =wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goods_id:'',
    list:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      this.data.goods_id=options.goods_id;
      this.listEvaluate();
  },
  listEvaluate:function(event){
    app.loading();
    var that =this;
    db.collection('evaluate').where({goods_id:this.data.goods_id}).skip(this.data.list.length)
    .get().then(res=>{
      wx.hideLoading();
      that.data.list = that.data.list.concat(res.data);
      that.setData({
        list:that.data.list
      })
    }).catch(error=>app.showError(error,'加载错误'));
  },
  onReachBottom:function(){
    this.listEvaluate();
  },
  tapImage: function (event) {
    var index = event.currentTarget.dataset.index;
    var evaluate = event.currentTarget.dataset.evaluate;
    console.log('index-',index)
    console.log('evaluate-pictures-',evaluate.pictures);
    wx.previewImage({
      urls: evaluate.pictures,
      current: index
    })
  }
})