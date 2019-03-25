// miniprogram/pages/addGoods/addGoods.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    maskVisible: false,
    ruleVisible: false,
    paramVisible: false,
    addCategoryVisible:false,
    inputRule:'颜色',
    goodsCategory:'男装 T恤'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      //为了测试
    app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
  },
  /**
   * 参数提交
   */
  formSubmitParam:function(event){
    console.log(event);
    var value = event.detail.value;
    console.log(value);
   var name =  value.paramName;
   var paramValue = value.paramValue;
   console.log(name);
    console.log(paramValue);
  },
  /**
   * 取消参数写入
   */
  tapParamCancel:function(){
    this.setData({
      paramVisible:false,
      maskVisible:false
    });
  },
  /**
   * 取消规格输入
   */
  tapRuleInputCancel:function(){
    this.setData({
      ruleVisible: false,
      maskVisible: false
    });
  },
  /**
   * 规格提交
   */
  formSubmitRule:function(event){
    console.log(event.detail.value);
  }
})