//index.js
const app = getApp()
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js')
Page({
  data: {
    bannerArray: [],
    goodsTable: 'goods',
    categoryList: [],
    categoryCount: 0,
    categoryPageList: []
  },
  onLoad: function() {
    this.loadBanner();
    this.loadCategory();
  },
  loadBanner: function() {
    var data = this.data;
    var that = this;
    app.showLoadingMask('请稍后');
    dbUtils.load(data.goodsTable, {}, 5, 0, 'sale_num', 'desc')
      .then(res => {
        wx.hideLoading();
        if (res.data.length > 0) {
          that.setData({
            bannerArray: res.data
          })
        } else {
          console.error('没有商品吗？banner没有加载到')
        }

      }).catch(error => app.showError(error, 'banner加载错误'));
  },
  loadCategory: function() {
    app.showLoadingMask('请稍后');
    var that = this;
    var data = this.data;
    dbUtils.count('category', {})
      .then(res => {
        if (res.total == 0) {
          wx.hideLoading();
          app.showErrNoCancel('提示', '没有商品');
          return;
        }
        data.categoryCount = res.total;
        that.setData(data);
        that.listCategory();
      })
      .catch(error => app.showError(error, '分类加载失败'));
  },
  loadGoods:function(){

  },
  listCategory: function() {
    var that = this;
    db.collection('category').skip(this.data.categoryList.length).get()
      .then(res => {
        wx.hideLoading();
        console.log(res.data);
        if (res.data.length > 0) {
          that.data.categoryList = that.data.categoryList.concat(res.data);
          that.setData({
            categoryList: that.data.categoryList
          })
          if (that.data.categoryCount > that.data.categoryList.length) {
            //继续加载
            that.listCategory();
          }
        }
        that.handleCategory()
      })
      .catch(error => app.showError(error, '分类加载异常'));
  },
  /**
   * 将 category List 转化为 page{index,array},10个为一页
   */
  handleCategory: function() {
    var list = this.data.categoryList;
    if (list.length == 0) return;
    var pageList = new Array();
    if (list.length <= 10) {
      pageList.push({
        index: 0,
        array: list
      });
      this.setData({
        categoryPageList: pageList
      })
      return;
    }
    var size = Math.floor(list.length / 10); //下舍入 取整


    if (Math.floor(list.length / 10) != (list.length / 10)) { //如果 不是整数 那么 就需要再加一个
      size++
    }
    var temp = 0;
    for (var i = 0; i < size; i++) {
      var end = 10;
      if (list.length - temp < 10) {
        end = list.length;
      }
      var data = list.slice(temp, end);
      temp += end;
      pageList.push({
        index: i,
        array: data
      });
    }
    this.setData({
      categoryPageList: pageList
    })

  },
  tapCategory: function(event) {
    var category = event.currentTarget.dataset.category;
    console.log(category);
    //todo  携带参数去搜索页
  },
  tapSearch: function() {
    //todo  直接打开搜索页
  },
  tapBanner: function(event) {
    var goods = event.currentTarget.dataset.goods;
    //todo  商品详情
  }
})