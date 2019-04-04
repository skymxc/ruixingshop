// miniprogram/pages/addGoods/addGoods.js

/**
 * todo
 * -参数
 */
const app = getApp();
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js');


Page({

  /**
   * 页面的初始数据
   */
  data: {
    goods:{},
    maskVisible: false,
    ruleVisible: false,
    paramVisible: false,
    addCategoryVisible: true,
    inputRule: '',
    goodsCategory: '',
    ruleArray: [],
    storeInputEnable: false,
    imageArray: [],
    paramArray: [],
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
    inputRule: {},
    inputRuleIndex: -1,
    ruleItemAdd: true,
    ruleItemIndex: -1,
    ruleItem: {},
    paramItemAdd: true,
    paramItemIndex: -1,
    paramItem: {},
    totalStore: 0
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
    if (name.length == 0) {
      app.showToast('参数名称未填写');
      return;
    }
    if (paramValue.length == 0) {
      app.showToast('参数值未填写');
      return;
    }

    var item = {
      name: name,
      value: paramValue
    }


    if (this.data.paramItemAdd) {
      this.data.paramArray.push(item);
    } else {
      this.data.paramArray[this.data.paramItemIndex] = item;
    }
    this.setData({
      paramArray: this.data.paramArray
    });
    this.tapMask();
  },
  /**
   * 取消参数写入
   */
  tapParamCancel: function() {
    this.tapMask();
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
    if (ruleValue.length == 0) {
      wx.showToast({
        title: this.data.inputRuleName + '没有输入',
        icon: 'none'
      });
      return
    }
    if (rulePrice.length == 0) {
      rulePrice = 0;
    }
    if (ruleStore.length == 0) {
      ruleStore = 0;
    }
    if (rulePrice < 0) {
      rulePrice = 0;
    }
    if (ruleStore < 0) {
      ruleStore = 0;
    }

    var item = {
      ruleName: rule.value,
      value: ruleValue,
      store: ruleStore,
      price: rulePrice,
      ruleIndex: ruleIndex
    }

    //这里使用 ruleArray 吧，不与 category 关联了
    if (this.data.ruleItemAdd) { //新增

      if (rule.array) {
        rule.array.push(item);
      } else {
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

    } else {
      //修改; ruleArrayValueIndex是修改的index

      this.data.ruleArray[ruleIndex].array[this.data.ruleItemIndex] = item;
      this.setData({
        ruleArray: this.data.ruleArray,
        ruleItem: {},
        ruleIndex: -1,
        ruleItemIndex: -1,
        maskVisible: false,
        ruleVisible: false,
        inputRuleName: ''
      })
    }
    this.calculateTotalStore();
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
        that.listSubcategory(res.data[0], 0, true);
      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('分类加载错误', error.errMsg);

      })
  },
  listSubcategory: function(category, index, loadRule) {
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
      if (loadRule) {
        that.listRule(category, res.data[0], 0, index);
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
        this.listSubcategory(category, event.detail.value, false);
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
      cateIndex: this.data.cateIndex
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
        cateIndex: data.cateIndex
      });
      this.listRule(category, subcategory, event.detail.value[1], event.detail.value[0]);
    }
  },
  listRule: function(category, subcategory, subIndex, cIndex) {
    app.showLoadingMask('规格加载中');
    var that = this;

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
          categoryList: that.data.categoryList,
          category: category,
          subcategory: subcategory,
          ruleArray: subcategory.rule
        })
        that.calculateTotalStore();
      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('规格加载错误', error.errMsg);
      })
  },
  tapAddRule: function(event) {
    console.log(event);
    var rule = event.currentTarget.dataset.rule;
    var index = event.currentTarget.dataset.index;
    var data = {
      inputRuleName: rule.value,
      ruleName: '',
      maskVisible: true,
      ruleVisible: true,
      inputRuleIndex: index,
      ruleItemAdd: true,
      inputRule: rule,
    }
    this.setData(data);
  },
  tapMask: function() {
    console.log('tap mask')
    this.setData({
      maskVisible: false,
      ruleVisible: false,
      paramVisible: false,
      ruleItem: false,
      inputRule: {},
      ruleItemAdd: true,
      inputParam: {},
      paramItemAdd: true,
      paramItemIndex: -1,
      paramItem: {}
    })
  },
  tapRuleItem: function(event) {
    // data-  这个数据名字是不一律小写的，尽管你是在wxml 大写的
    var ruleIndex = event.currentTarget.dataset.ruleindex;
    var itemIndex = event.currentTarget.dataset.itemindex;
    var rule = this.data.ruleArray[ruleIndex];
    var item = rule.array[itemIndex];


    this.setData({
      inputRuleName: rule.value,
      ruleItem: item,
      inputRuleIndex: ruleIndex,
      ruleItemIndex: itemIndex,
      ruleItemAdd: false,
      maskVisible: true,
      ruleVisible: true
    })
  },
  tapDelRule: function() {
    var rule = this.data.ruleArray[this.data.inputRuleIndex];
    var itemIndex = this.data.ruleItemIndex;
    var array = rule.array.splice(itemIndex, 1);

    this.data.ruleArray[this.data.inputRuleIndex] = rule;

    this.setData({
      ruleArray: this.data.ruleArray
    });
    this.calculateTotalStore();
    this.tapMask();
  },
  tapAddParam: function() {
    this.setData({
      maskVisible: true,
      paramVisible: true,
      paraItemAdd: true
    });
  },
  tapDelParamItem: function(event) {
    var index = event.currentTarget.dataset.index;
    this.data.paramArray.splice(index, 1);
    this.setData({
      paramArray: this.data.paramArray
    });
    this.tapMask();
  },
  tapParamItem: function(event) {
    var index = event.currentTarget.dataset.index;
    var item = this.data.paramArray[index];
    this.setData({
      paramItem: item,
      paramItemIndex: index,
      paramItemAdd: false,
      maskVisible: true,
      paramVisible: true
    });
  },
  calculateTotalStore: function() {
    var result = false; //可用
    var ruleArray = this.data.ruleArray;

    var num = 0;
    if (ruleArray.length > 0) {
      for (var i = 0; i < ruleArray.length; i++) {
        var rule = ruleArray[i];
        if (rule.array) {
          if (rule.array.length > 0) {
            result = true;
            var array = rule.array;
            for (var k = 0; k < array.length; k++) {
              var item = array[k];
              num += new Number(item.store);
            }
          }
        }
      }
    }


    this.setData({
      storeInputEnable: result,
      totalStore: num
    })
    console.log('store input enable -->', this.data.storeInputEnable);
  },
  tapAddPicture:function(){
    var that =this;
    wx.chooseImage({
    count:1,
      success: function(res) {
          if(res.tempFilePaths.length>0){
              that.handlerChooseImage(res.tempFilePaths[0]);
          }
      },
    })
  },
  /**
   * 处理选择的图片，
   * 先上传，返回后，显示本地的图片
   * {
   *  local:'',
   *  remote:''
   * }
   */
  handlerChooseImage: function (src){
    app.showLoadingMask('上传中');
    var that =this;
    var name = app.getCloudName(src);
    wx.cloud.uploadFile({
      cloudPath: 'image/goods/' + name,
      filePath: src
    }).then(res=>{
      wx.hideLoading();
        that.data.imageArray.push({local:src,remote:res.fileID});
        that.setData({
          imageArray:that.data.imageArray
        })
    }).catch(error=>{
      console.error(error);
      app.showErrNoCancel('上传失败！',error.errMsg);
    })
  },
  tapDelPicture:function(event){
    var index= event.currentTarget.dataset.index;
    this.data.imageArray.splice(index,1);
    this.setData({
      imageArray:this.data.imageArray
    });
  },
  tapAddDetailImage:function(){
    var that = this;
    wx.chooseImage({
      count: 1,
      success: function (res) {
        if (res.tempFilePaths.length > 0) {
          that.handlerChooseDetailImage(res.tempFilePaths[0]);
        }
      },
    })
  },
  handlerChooseDetailImage:function(src){
    app.showLoadingMask('上传中');
    var that = this;
    var name = app.getCloudName(src);
    wx.cloud.uploadFile({
      cloudPath: 'image/goods/' + name,
      filePath: src
    }).then(res => {
      wx.hideLoading();
      that.data.imageDetailArray.push({ local: src, remote: res.fileID });
      that.setData({
        imageDetailArray: that.data.imageDetailArray
      })
    }).catch(error => {
      console.error(error);
      app.showErrNoCancel('上传失败！', error.errMsg);
    })
  },
  tapDelDetailPicture: function (event) {
    var index = event.currentTarget.dataset.index;
    this.data.imageDetailArray.splice(index, 1);
    this.setData({
      imageDetailArray: this.data.imageDetailArray
    });
  },
  formSubmitGoods:function(event){
    console.log(event);
    var name = event.detail.value.goodsName;
    var postage= new Number(event.detail.value.goodsPostage);
    var price = new Number(event.detail.value.goodsPrice);
    var store = new Number(event.detail.value.goodsStore);
    if(name.length==0){
      app.showToast('名称不能为空');
      return;
    }
    if(price<0){
      app.showToast('价格不能低于0元');
      return ;
    }
    if(store<0){
      app.showToast('库存不能少于0');
      return;
    }
    if(postage<0){
      app.showToast('邮费不能少于0元');
      return;
    }
    if(this.data.imageArray.length==0){
      app.showToast('至少上传一张图片');
      return;
    }
    if(this.data.imageDetailArray.length==0){
      app.showToast('至少上传一张详情图片');
      return;
    }
    if(this.data.category.name.length==0){
      app.showToast('请选择所属分类');
      return;
    }
    //图片处理
    var pictures = new Array();
    for(var i=0;i<this.data.imageArray.length;i++){
      var item  = this.data.imageArray[i];
      pictures.push(item.remote);
    }
    var detailPictures = new Array();
    for (var i = 0; i < this.data.imageDetailArray.length; i++) {
      var item = this.data.imageDetailArray[i];
      detailPictures.push(item.remote);
    }
    //价格
    var min = 0;
    var max = 0;
    if(this.data.ruleArray.length>0){
      for(var i=0;i<this.data.ruleArray.length;i++){
        var rule = this.data.ruleArray[i];
        if(rule.array){
          if(rule.array.length>0){
            for(var k=0;k<rule.array.length;k++){
                var item = rule.array[k];
                var num = new Number(item.price);
                if(num>max){
                  max = num;
                }
                if(num<min){
                  min = num;
                }
            }
          }
        }
      }
    }
    min +=price;
    max+=price;
    //这将 _id 换个名字，不然会出现错误 无效的Key（_id）
    var category={
      category_id : this.data.category._id,
      name:this.data.category.name,
      icon:this.data.category.icon
    }
    var subcategory={
      subcategory_id:this.data.subcategory._id,
      name :this.data.subcategory.name,
      icon:this.data.subcategory.icon
    }
    var rules = new Array();
    for(var i=0;i<this.data.ruleArray.length;i++){
        var rule=this.data.ruleArray[i];
      var item = {
        rule_id:rule._id,
        value: rule.value,
        category: rule.category,
        subcategory: rule.subcategory
      }
      rules.push(item);
    }
    var goods={
      name :name,
      pictures:pictures,
      postage:postage,
      sale_num:0,
      store_num:store,
      detail_pcitures:detailPictures,
      price:price,
      category:category,
      subcategory:subcategory,
      rules: rules,
      state:0,
      params:this.data.paramArray,
      price_min:min,
      price_max:max
    }
    app.showLoadingMask('保存中');
    dbUtils.add('goods',goods)
    // db.collection('goods').add({
    //   data:goods
    // })
    .then(res=>this.addAfter(res))
    .catch(error=>{
      console.error(error);
      app.showErrNoCancel('添加失败',error.errMsg);
    })
  },
  addAfter:function(res){
    wx.hideLoading();
    if(res._id){
      //todo 添加成功 clean data
     this.data.goods.name = '';
      this.data.goods.price = '';
      this.data.goods.postage = '',

      this.setData({
        goods:this.data.goods,
        paramArray:[],
        imageArray:[],
        imageDetailArray:[]
      });
    }else{
      
      app.showErrNoCancel('提示','添加失败');
    }
  }
})