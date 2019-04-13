//index.js
/**
 * 
 * todo
 * - 上啦加载更多 加入时间间隔限制 在搜索有实现
 */
const app = getApp()
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js')
Page({
  data: {
    bannerArray: [],
    goodsTable: 'goods',
    categoryList: [],
    categoryCount: 0,
    categoryPageList: [],
    orderList: [
      'sale_num',
      'name',
      'store_num'
    ],
    orderbyList: [
      'desc',
      'asc'
    ],
    orderBy: '',
    order: '',
    goodsWhere: {
      state: 0
    },
    goodsList: [],
   refreshGoods:true,
   refreshCategory:true,
    lastLoadGoodsTime: 0
  },
  onLoad: function() {

    this.loadBanner();
    this.loadCategory();
    //随机一个排序列，随机一个排序顺序 desc asc
    this.randomOrder();
    this.loadGoods();
  },
  onPullDownRefresh: function() {
    this.refresh();
    this.loadBanner();
    this.loadCategory();
    //随机一个排序列，随机一个排序顺序 desc asc
    
    this.loadGoods();
    wx.stopPullDownRefresh();
  },
  onReachBottom: function() {
    var current = new Date().getTime();
    //5 s
    if ((current - this.data.lastLoadGoodsTime) < 5 * 1000) {
      console.log(' interval time less five second!')
      return;
    }
    this.loadGoods();
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
  loadGoods: function() {
    var that = this;
    app.showLoadingMask('请稍后');
    this.data.lastLoadGoodsTime = new Date().getTime();
    var skip = this.data.refreshGoods?0:this.data.goodsList.length;
    db.collection(this.data.goodsTable).where(this.data.goodsWhere)
      .skip(skip).orderBy(this.data.order, this.data.orderBy)
      .get().then(res => {
        wx.hideLoading();

        if (res.data.length > 0) {
          if (that.data.refreshGoods) {
            that.data.goodsList = res.data;
            that.data.refreshGoods =false;
          } else {
            that.data.goodsList = that.data.goodsList.concat(res.data);
          }
          that.setData({
            goodsList: that.data.goodsList
          })
        } else {
          app.showToast('没有商品了');
        }
      }).catch(error => {
        console.error(error);
        wx.hideLoading();
        wx.showModal({
          title: '商品加载失败',
          content: error.errMsg,
          showCancel: false,
          confirmText: '重试',
          success: function(res) {
            if (res.confirm) {
              that.loadGoods();
            }
          }
        })
      })


  },
  listCategory: function() {
    var that = this;
    var skip = this.data.refreshCategory ? 0 : this.data.categoryList.length;
    db.collection('category').skip(skip).get()
      .then(res => {
        wx.hideLoading();
        console.log('分类',res.data);
        if (res.data.length > 0) {
          if(that.data.refreshCategory){
              that.data.categoryList = res.data;
              that.data.refreshCategory = false;
          }else{
            that.data.categoryList = that.data.categoryList.concat(res.data);
          }
          
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
    var param = '?category_id=' + category._id +'&category_name='+category.name;
    app.navigateTo('../searchGoods/searchGoods'+param);
  },
  tapSearch: function() {
    app.navigateTo('../searchGoods/searchGoods');

  },
  tapBanner: function(event) {
    var goods = event.currentTarget.dataset.goods;
    // 商品详情
   app.navigateTo('../goodsDetail/goodsDetail?_id='+goods._id);
  },
  tapGoods: function(event) {
    var goods = event.currentTarget.dataset.goods;
    console.log(goods);
    app.navigateTo('../goodsDetail/goodsDetail?_id=' + goods._id);
  },
  randomOrder: function() {
    var orderIndex = app.getRandomNum(0, this.data.orderList.length - 1);
    var orderbyIndex = app.getRandomNum(0, 1);
    this.setData({
      order: this.data.orderList[orderIndex],
      orderBy: this.data.orderbyList[orderbyIndex]
    });
    console.log('排序列为-》', this.data.order, ';顺序是-》', this.data.orderBy);
  },
  refresh:function(){
    this.data.refreshGoods =true;
    this.data.refreshCategory =true;
    
  }
})