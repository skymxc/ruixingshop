// miniprogram/pages/goodsDetail/goodsDetail.js
const app = getApp();
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chooseVisible:false,
    goods:{},
    rulestring:'',
    detailVisible:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   this.data.goods._id = options._id
   this.loadGoods();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  loadGoods:function(){
    app.showLoadingMask('请稍后');
    var that =this;
    db.collection('goods').doc(this.data.goods._id).get()
    .then(res=>{
      wx.hideLoading();
        console.log(res);
        var string = that.data.rulestring;
        if(res.data.rules){
          if(res.data.rules.length>0){
              for(var i=0;i<res.data.rules.length;i++){
                var rule = res.data.rules[i];
                string+=rule.value;
              }
              string+='等';
          }
        }
        that.setData({
          goods:res.data,
          rulestring:string
        });
    }).catch(error=>app.showError(error,'商品加载失败'));
  },
  tapPicture:function(event){
    var index = event.currentTarget.dataset.index;
    app.showLoading('请稍后');
    wx.previewImage({
      urls: this.data.goods.pictures,
      current:index,
      success:function(){
        wx.hideLoading();
      }
    })
  }
})