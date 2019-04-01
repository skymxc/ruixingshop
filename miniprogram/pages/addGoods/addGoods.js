// miniprogram/pages/addGoods/addGoods.js

/**
 * todo
 * -参数
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
    addCategoryVisible: true,
    inputRule: '',
    goodsCategory: '',
    ruleArray: [],
    storeInputEnable: false,
    imageArray: [],
    paramArray: [{
      name: '制造厂家里卡多说了你发裂了那份快递蓝山咖啡价格来看日记',
      value: '波司登'
    }, {
      name: '制造地',
      value: '中国厂家里卡多说了你发裂了那份快递蓝山咖啡价格来看日记'
    }],
    imageDetailArray: [],
    categoryList: [],
    cateArray: [],
    cateIndex: [0, 0],
    category: {
      name: ''
    },
    subcategory: {
      name: ''
    },
    disablePicker: false,
    inputRule:{},
    inputRuleIndex:-1,
    ruleItemAdd:true,
    ruleItemIndex:-1,
    ruleItem:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    //为了测试
    this.getCategory();
  },
  /**
   * 参数提交
   */
  formSubmitParam: function(event) {
    console.log(event);
    var value = event.detail.value;
    console.log(value);
    var name = value.paramName;
    var paramValue = value.paramValue;
    console.log(name);
    console.log(paramValue);
  },
  /**
   * 取消参数写入
   */
  tapParamCancel: function() {
    this.setData({
      paramVisible: false,
      maskVisible: false
    });
  },
  /**
   * 取消规格输入
   */
  tapRuleInputCancel: function() {
    this.setData({
      ruleVisible: false,
      maskVisible: false
    });
  },
  /**
   * 规格提交
   * 应该提交到所附属的 rule下 array
   *  array[
   *  {
   *    value:'white',
   *    sotre:10,
   *    price:20
   *  }
   * ]
   */
  formSubmitRule: function(event) {
    console.log(event.detail.value);
    var ruleValue = event.detail.value.ruleName;
    var rulePrice = event.detail.value.rulePrice;
    var ruleStore = event.detail.value.ruleStoreNum;
    var rule = this.data.inputRule;
    var ruleIndex = this.data.inputRuleIndex;
    //
    if(ruleValue.length==0){
      wx.showToast({
        title: this.data.inputRuleName+'没有输入',
        icon:'none'
      });
      return
    }
    if(rulePrice.length==0){
      rulePrice = 0;
    }
    if(ruleStore.length==0){
      ruleStore = 0;
    }
    if(rulePrice<0){
        rulePrice=0;
    }
    if(ruleStore<0){
      ruleStore = 0;
    }
    
    var item = {
      ruleName: rule.value,
      value: ruleValue,
      store: ruleStore,
      price: rulePrice,
      ruleIndex:ruleIndex
    }

    //这里使用 ruleArray 吧，不与 category 关联了
    if(this.data.ruleItemAdd){ //新增

    if(rule.array){
      rule.array.push(item);
    }else{
      var array = new Array();
      array[0] = item;
      rule.array = array;
    }
      this.data.ruleArray[ruleIndex] = rule;
      this.setData({
        ruleArray: this.data.ruleArray,
        rule: {},
        ruleIndex: -1,
        inputRuleName: '',
        maskVisible: false,
        ruleName: '',
        ruleVisible: false
      });
      
    }else{
      //修改; ruleArrayValueIndex是修改的index
     
      this.data.ruleArray[ruleIndex].array[this.data.ruleItemIndex] =item;
        this.setData({
          ruleArray:this.data.ruleArray,
          ruleItem:{},
          ruleIndex:-1,
          ruleItemIndex:-1,
          maskVisible:false,
          ruleVisible:false,
          inputRuleName:''
        })
    }
  },
  listCategory: function() {
    var that = this;
    var data = {
      categoryList: that.data.categoryList,
      cateArray: that.data.cateArray,
      cateIndex: that.data.cateIndex
    }

    app.showLoadingMask('分类加载中');
    wx.cloud.callFunction({
      name: 'getCategory'
    }).then(res => {
      wx.hideLoading();
      if (res.result.length == 0) {
        app.showErrNoCancel('提示', '目前没有分类，无法添加商品');
        return;
      }


      // 分类处理
      data.categoryList = res.result;
      data.cateArray[0] = data.cateArray;
      data.cateArray[1] = data.cateArray[0].sub;
      that.setData(data);
    }).catch(error => {
      console.error(error);
      app.showErrNoCancel('分类加载错误', error.errMsg);
    })
  },
  getCategory: function() {
    app.showLoadingMask('加载中');
    var that = this;

    db.collection('category').get()
      .then(res => {
        if (res.data.length == 0) {
          wx.hideLoading();
          app.showErrNoCancel('提示', '没有分类无法添加商品');
          return;
        }
        that.data.cateArray[0] = res.data;
        that.data.cateIndex[0] = 0;
        that.setData({
          categoryList: res.data,
          category: res.data[0],
          cateArray: that.data.cateArray,
          cateIndex: that.data.cateIndex
        });
        that.listSubcategory(res.data[0], 0,true);
      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('分类加载错误', error.errMsg);

      })
  },
  listSubcategory: function(category, index,loadRule) {
    app.showLoadingMask('子分类加载中');
    var that = this;
    this.setData({
      disablePicker: true
    })
    db.collection('subcategory').where({
      parent: category._id
    }).get().then(res => {
      wx.hideLoading();
      if (res.data.length == 0) {
        wx.showErrNoCancel('提示', category.name + '下没有子分类');
        return
      }
      category.sub = res.data;
      that.data.categoryList[index] = category;
      that.data.cateArray[1] = category.sub;
      that.data.cateIndex[1] = 0;
      that.setData({
        categoryList: that.data.categoryList,
        cateArray: that.data.cateArray,
        cateIndex: that.data.cateIndex,
        subcategory: res.data[0],
        disablePicker: false
      })
      if(loadRule){
        that.listRule(category,res.data[0],0,index);
      }
    }).catch(error => {
      console.error(error);
      app.showErrNoCancel('子分类加载错误', error.errMsg);
    })
  },
  bindMultiPickerColumnChange: function(event) {
    // 修改的column 为 event.detail.column;修改的值为 event.detail.value
    var data = {
      cateArray: this.data.cateArray,
      cateIndex: this.data.cateIndex
    }
    if (event.detail.column == 0) {
      var category = this.data.categoryList[event.detail.value];
      data.cateIndex[0] = event.detail.value;
      if (category.sub) {
        console.log(category.sub);
        data.cateArray[1] = category.sub;

        this.setData(data);
      } else {
        this.listSubcategory(category, event.detail.value,false);
      }
    }
  },
  bindMultiPickerChange: function(event) {
    var category = this.data.categoryList[event.detail.value[0]];
    var subcategory = category.sub[event.detail.value[1]];
    var data = {
      category: category,
      subcategory: subcategory,
      ruleArray: this.data.ruleArray,
      cateIndex:this.data.cateIndex
    }
    data.cateIndex[0] = event.detail.value[0];
    data.cateIndex[1] = event.detail.value[1];
    //规格是否已经加载过了
    if (subcategory.rule) {
      data.ruleArray = subcategory.rule;
      this.setData(data);
    } else {
      //加载rule
      this.setData({
        cateIndex:data.cateIndex
      });
      this.listRule(category,subcategory,event.detail.value[1],event.detail.value[0]);
    }
  },
  listRule: function(category, subcategory, subIndex, cIndex) {
    app.showLoadingMask('规格加载中');
    var that =this;

    db.collection('rule').where({
      category: category._id,
      subcategory: subcategory._id
    }).get()
    .then(res => {
      wx.hideLoading();
      subcategory.rule = res.data;
      category.sub[subIndex] = subcategory;
      that.data.categoryList[cIndex] = category;
       that.setData({
          categoryList:that.data.categoryList,
          category:category,
          subcategory:subcategory,
          ruleArray:subcategory.rule
       })
    }).catch(error => {
        console.error(error);
        app.showErrNoCancel('规格加载错误',error.errMsg);
    })
  },
  tapAddRule:function(event){
    console.log(event);
    var rule = event.currentTarget.dataset.rule;
    var index = event.currentTarget.dataset.index;
    var data={
      inputRuleName:rule.value,
      ruleName:'',
      maskVisible:true,
      ruleVisible:true,
      inputRuleIndex:index,
      ruleItemAdd:true,
      inputRule:rule,
    }
    this.setData(data);
  },
  tapMask:function(){
    console.log('tap mask')
    this.setData({
      maskVisible:false,
      ruleVisible:false,
      paramVisible:false,
      ruleItem:false,
      inputRule:{},
      ruleItemAdd:true
    })
  },
  tapRuleItem:function(event){
    // data-  这个数据名字是不一律小写的，尽管你是在wxml 大写的
    var ruleIndex = event.currentTarget.dataset.ruleindex;
    var itemIndex = event.currentTarget.dataset.itemindex;
    var rule = this.data.ruleArray[ruleIndex];
    var item = rule.array[itemIndex];
   

    this.setData({
      inputRuleName:rule.value,
      ruleItem:item,
      inputRuleIndex:ruleIndex,
      ruleItemIndex:itemIndex,
      ruleItemAdd:false,
      maskVisible:true,
      ruleVisible:true
    })
  },
  tapDelRule:function(){
    var rule = this.data.ruleArray[this.data.inputRuleIndex];
    var itemIndex= this.data.ruleItemIndex;
   var array  = rule.array.splice(itemIndex,1);

    this.data.ruleArray[this.data.inputRuleIndex] = rule;
    
    this.setData({
        ruleArray:this.data.ruleArray
    });
    this.tapMask();
  }
})