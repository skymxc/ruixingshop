// miniprogram/pages/category/allcategory/allcategory.js

/**
 * 
 * 加载 分类和子分类目前是 直接加载出全部，没有用上拉加载更多的方式。（！赶时间！）
 */
const app = getApp()
const db = wx.cloud.database();
const dbUtils = require('../../../js/DB.js')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    chooseIndex: 0,
    categoryList: [],
    categoryCount: 0,
    refreshCategory: true,
    category: {},
    subcateogryList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.loadCategory();
  },
  loadCategory: function() {
    app.showLoadingMask('请稍后');
    var that = this;
    var data = this.data;
    dbUtils.count('category', {})
      .then(res => {
        if (res.total == 0) {
          wx.hideLoading();
          app.showErrNoCancel('提示', '没有分类');
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
    var skip = this.data.refreshCategory ? 0 : this.data.categoryList.length;
    db.collection('category').skip(skip).get()
      .then(res => {
        wx.hideLoading();
        console.log(res.data);
        if (res.data.length > 0) {
          var chooseIndex = that.data.chooseIndex;
          if (that.data.refreshCategory) {
            that.data.categoryList = res.data;
            that.data.refreshCategory = false;
            chooseIndex = 0;
            that.data.category = res.data[0];
            //加载 子分类
            that.loadSubcategory(res.data[0], 0)
          } else {
            that.data.categoryList = that.data.categoryList.concat(res.data);
          }

          that.setData({
            categoryList: that.data.categoryList,
            chooseIndex: chooseIndex,
            category: that.data.category
          })
          if(skip)
          if (that.data.categoryCount > that.data.categoryList.length) {
            //继续加载
            that.listCategory();
          }
        }

      })
      .catch(error => app.showError(error, '分类加载异常'));
  },
  loadSubcategory: function(category, index) {
    app.showLoadingMask('加载中')
    var that = this;
    dbUtils.count('subcategory', {
        parent: category._id
      }).then(res => {


        if (res.total == 0) {
          wx.hideLoading();
          app.showToast('没有子分类');
          that.setData({
            subcateogryList: []
          })
          return;
        }
        category.subtotal = res.total;
        that.data.categoryList[index] = category;
        if (category.sub) {
          if (category.sub.length < category.subtotal) {
            that.listSubcategory(category, index);
          }
        } else {
          that.listSubcategory(category, index);
        }

      }).catch(error => app.showError(error, '子分类异常'));
  },
  /**
   * 加载子分类
   * 考虑到最多只能加载20个
   * 循环加载直至加载完成（也可以使用上拉加载更多的方法）
   */
  listSubcategory: function(category, index) {
    app.showLoadingMask('请稍后');
    var skip = 0;
    if (category.sub) {
      skip = category.sub.length;
    }
    var that =this;
    db.collection('subcategory').where({
      parent: category._id
    }).skip(skip).get().then(res => {
      wx.hideLoading();
      if (res.data.length == 0) {
        return;
      }
      console.log(res.data);
      var array = new Array();
      array = array.concat(res.data);
      if(category.sub){
        category.sub = category.sub.concat(res.data);
      }else{
        category.sub = res.data;
      }
      that.data.categoryList[index] = category;
      that.setData({
        categoryList:that.data.categoryList,
        category:category,
        subcateogryList:category.sub
      });
      if(category.sub.length==category.subtotal){
        wx.hideLoading();
      }else{
        // continue load
        that.listSubcategory(category,index);
      }
    }).catch(error => app.showError(error, '子分类加载异常'));

  },
  tapCategory: function(event) {
    var category = event.currentTarget.dataset.category;
    var index = event.currentTarget.dataset.index;

    this.setData({
      category: category,
      chooseIndex: index
    });

    if (category.sub) {
      if (category.sub.length == 0) {
        this.loadSubcategory(category, index);
      } else {
        this.setData({
          subcateogryList: category.sub
        })
      }

    } else {
      this.loadSubcategory(category, index);
    }
  },
  tapSubcategory:function(event){
    var subcategory = event.currentTarget.dataset.subcategory;
    //去搜索页
  },
  tapSearch:function(){
    //去搜索页
  }
})