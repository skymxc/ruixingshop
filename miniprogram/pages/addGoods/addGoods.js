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
    goodsCategory:'男装 T恤',
    ruleArray:[
      {name:'颜色',
      value:[
        'white',
        'black',
        'yellow',
        'red',
        'gray',
        'grey',
        'green',
        'blue',
        'dark'
      ]},{
        name:'尺寸',
        value:[
          's',
          'm',
          'l',
          'xl'
        ]
      }
    ],
    storeInputEnable:false,
    imageArray:[],
    paramArray:[
      {
        name:'制造厂家里卡多说了你发裂了那份快递蓝山咖啡价格来看日记',
        value:'波司登'
      },{
        name:'制造地',
        value:'中国厂家里卡多说了你发裂了那份快递蓝山咖啡价格来看日记'
      }
    ],
    imageDetailArray:[]
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