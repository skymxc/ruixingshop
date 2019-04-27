// miniprogram/pages/couponPublish/couponPublish.js
const app = getApp();
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    category: {
      _id: 'all',
      name: '全部'
    },
    subcategory: {
      _id: 'all',
      name: '全部'
    },
    categoryList: [],
    subcategoryList:[],
    validityStr: '',
    validityStart: '',
    validity: {},
    categoryIndex: [0, 0],
    cateArray: [],
    categoryCount:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var date = new Date();
    this.setData({
      validityStr: app.formatDate('yyyy-MM-dd', date),
      validityStart: app.formatDate('yyyy-MM-dd', date),
      validity:date
    })
    this.loadCategory();
  },
  loadCategory: function () {
    app.showLoadingMask('请稍后');
    var that = this;
    var data = this.data;
    dbUtils.count('category', {})
      .then(res => {
        if (res.total == 0) {
          wx.hideLoading();

          return;
        }
        data.categoryCount = res.total;
        that.setData(data);
        that.listCategory();
      })
      .catch(error => app.showError(error, '分类加载失败'));
  },
  listCategory: function() {
    var that = this;
    var skip = this.data.categoryList.length;
    var data = this.data;

    if (this.data.categoryList.length == 0) {
      var all = {
        _id: 'all',
        name: '全部',
        sub: [{
          _id: 'all',
          name: '全部'
        }]
      }
      this.data.categoryList.push(all);
    }
    db.collection('category').skip(skip).get()
      .then(res => {

        console.log('listCategory',res.data);
        if (res.data.length > 0) {
          data.categoryList = that.data.categoryList.concat(res.data);

          
            data.categoryIndex[0] = 0;
            data.cateArray[0] = data.categoryList
            data.category = data.categoryList[0];
         

          that.setData(data);
          if (skip == 0) {
            ///加载子分类
            that.loadSubcategory(data.category, data.categoryIndex[0]);
          }

          if (data.categoryCount > that.data.categoryList.length) {
            //继续加载
            that.listCategory();
          } else {

          }
        } else {
          wx.hideLoading();
        }

      })
      .catch(error => app.showError(error, '分类加载异常'));
  },
  loadSubcategory: function (category, index) {
    app.showLoadingMask('加载中');
    var that = this;
    var data = this.data;
    dbUtils.count('subcategory', {
      parent: category._id
    }).then(res => {
      if (res.total == 0) {
        wx.hideLoading();
        var all = {
          _id: 'all',
          name: '全部'
        }
        var array = new Array();
        array.push(all);
        category.sub = array;
        data.categoryList[index] = category;
        data.subcategoryList = category.sub;
        data.subcategory = all;
        data.categoryIndex[1] = 0;
        data.cateArray[1] = category.sub;
        that.setData(data);
        return;
      }

      category.subtotal = res.total;
      data.categoryList[index] = category;
      that.setData(data);

      that.listSubcategory(category, index);


    }).catch(error => app.showError(error, '使用范围子分类异常'));
  },/**
   * 在加载之前，应该将
   * 加载子分类
   * 考虑到最多只能加载20个
   * 循环加载直至加载完成（也可以使用上拉加载更多的方法）
   */
  listSubcategory: function (category, index) {
    app.showLoadingMask('请稍后');
    var skip = 0;
    if (category.sub) {
      skip = category.sub.length;
    }
    var that = this;
    var data = this.data;
    db.collection('subcategory').where({
      parent: category._id
    }).skip(skip).get().then(res => {
      wx.hideLoading();
      if (res.data.length == 0) {
        return;
      }
      console.log('listSubcategory',res.data);
      if (category.sub) {
        category.sub = category.sub.concat(res.data);
      } else {
        category.sub = new Array();
        var all = {
          _id: 'all',
          name: '全部'
        }
        category.sub.push(all);
        category.sub = category.sub.concat(res.data);
        data.categoryIndex[1] = 0;
        data.subcategory = category.sub[0];
       
      }
     
       
      
      data.categoryList[index] = category;
      data.subcategoryList = category.sub;
      data.cateArray[1] = category.sub
      that.setData(data);

      that.setData({
        categoryIndex: data.categoryIndex
      })
      if (category.sub.length == category.subtotal) {
        wx.hideLoading();
      } else {
        // continue load
        that.listSubcategory(category, index);
      }
    }).catch(error => app.showError(error, '子分类加载异常'));

  },
  getCategory: function() {
    app.showLoadingMask('加载中');
    var that = this;

    db.collection('category').get()
      .then(res => {
        if (res.data.length == 0) {
          wx.hideLoading();

          return;
        }
        res.data.push(that.data.category);
        that.data.cateArray[0] = res.data;
        that.data.categoryIndex[0] = 0;
        that.setData({
          categoryList: res.data,
          category: res.data[0],
          cateArray: that.data.cateArray,
          categoryIndex: that.data.categoryIndex
        });
        that.listSubcategory(res.data[0], 0);

      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('使用范围加载错误', error.errMsg);

      })
  },
  submit: function(event) {
    console.log(event);
    var value = event.detail.value;
    //面额
    var denomination = new Number(value.denomination);
    //门槛
    var threshold = new Number(value.threshold);
    if(denomination<=0){
      app.showToast('面额必须大于零')
      return;
    }
    if (threshold < 0) {
      app.showToast('门槛不得低于零')
      return;
    }
    // 数量
    var num = new Number(value.num);
    //领取限制
    var getLimit = value.getLimit;
    //使用说明
    var useDesc = value.useDesc;
    //失效时间
    var time = this.data.validity.getTime();
    //使用范围
    var category = this.data.category;
    if(category.sub){
      category={
        _id:category._id,
        _openid:category._openid,
        icon:category.icon,
        name:category.name
      }
    }
    var subcategory = this.data.subcategory;
    app.loading();
    db.collection('coupon').add({data:{
      denomination: denomination,
      threshold: threshold,
      num:num,
      getLimit: getLimit,
      useDesc: useDesc,
      validity: time,
      category:category,
      subcategory:subcategory,
      createDate:db.serverDate(),
      validityStr:app.formatDate('yyyy-MM-dd',this.data.validity)
    }}).then(res=>{
        wx.hideLoading();
        if(res._id){
          
          wx.showModal({
            title: '提示',
            content: '发布成功',
            showCancel:false,
            success:function(res){
              wx.navigateBack({
                
              })
            }
          })
        }else{
          wx.showModal({
            title: '提示',
            content: '发布失败',
            showCancel:false
          })
        }
    }).catch(error=>app.showError(error,'发布失败'));
  },
  calidityChange: function(event) {
    console.log('calidityChange',event)
    var str = event.detail.value;
    var date = new Date(str);
    var time = date.getTime();
    
    this.setData({
      validityStr:str,
      validity:date
    })
  },
  categoryChange: function(event) {
    // 修改的column 为 event.detail.column;修改的值为 event.detail.value
    var category = this.data.categoryList[event.detail.value[0]];
    var subcategory = category.sub[event.detail.value[1]];
    var data = {
      category: category,
      subcategory: subcategory,
      
      categoryIndex: this.data.categoryIndex
    }
    data.categoryIndex[0] = event.detail.value[0];
    data.categoryIndex[1] = event.detail.value[1];
    //规格是否已经加载过了
    this.setData(data);
  },
  categorycolumnchange:function(event){
    console.log('categorycolumnchange', event)
    var data = {
      cateArray: this.data.cateArray,
      categoryIndex: this.data.categoryIndex
    }
    if (event.detail.column == 0) {
      var category = this.data.categoryList[event.detail.value];
      data.categoryIndex[0] = event.detail.value;
      if (category.sub) {
        console.log(category.sub);
        data.cateArray[1] = category.sub;

        this.setData(data);
      } else {
        this.loadSubcategory(category, event.detail.value);
      }
    }
  }
})