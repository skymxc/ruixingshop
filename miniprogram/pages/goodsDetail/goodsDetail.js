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
    detailVisible:true,
    shopcarNum:0,
    attetion:false,
    chooseNum:1,
    chooseRule:true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);
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
                if(rule.array){
                  if(rule.array.length>0){
                    string += rule.value;
                  }

                }
               
              }
              if(string.length>0){
                string += '等';
              }
            
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
  },
  tapDetailChange:function(){
    this.setData({
      detailVisible:!this.data.detailVisible
    })
  },
  tapAttention:function(){
    console.log('关注-》',this.data.attetion)
  },
  tapShopcar:function(){
    console.log('购物车')
  },
  tapAddToShopcar:function(){
    console.log('加入购物车')
  },
  tapBuy:function(){
    console.log('立即购买')
  },
  tapMask:function(){
    this.setData({
      chooseVisible:false
    })
  },
  tapChooseRule:function(){
    this.setData({
      chooseVisible:true
    })
  }
})