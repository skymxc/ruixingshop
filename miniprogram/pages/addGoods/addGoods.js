// miniprogram/pages/addGoods/addGoods.js

/**
 * 
 * 这里第一次要加载的只有分类。为了方便，最好是将所有的分类，子分类，相关规格都加载出来。
 * 所以这个加载需要调用云函数，在服务端查询，然后一并返回。
 * list[
 * category{
 *  name:男装,
 * _id:alsd,
 * sub:[
 *  {
 *  name:T恤,
 *  _id:li,
 *  parent:ofa,
 *  rule:[
 *  {
 *  name:颜色,
 *  _id:lsd,
 *  category:sl,
 *  subcategory:okls
 * }
 * ]
 * }
 * ]
 * }
 * ]
 */
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
    addCategoryVisible:true,
    inputRule:'',
    goodsCategory:'',
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
    imageDetailArray:[],
    categoryList:[]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      //为了测试
    this.listCategory();
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
  },
  listCategory:function(){
    var that =this;
    app.showLoadingMask('分类加载中');
    wx.cloud.callFunction({
      name:'getCategory'
    }).then(res=>{
      wx.hideLoading();
      if(res.result.length==0){
        app.showErrNoCancel('提示','目前没有分类，无法添加商品');
        return;
      }
      // 分类处理
      that.setData({
        categoryList:res.result
      })
    }).catch(error=>{
      console.error(error);
      app.showErrNoCancel('分类加载错误',error.errMsg);
    })
  }
})