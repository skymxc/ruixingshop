// miniprogram/pages/searchGoods/searchGoods.js
/**
 * 
 * 页面可能会从多个页面进来，所以参数可能会不同，例如，直接点击搜索和点击分类进来的。
 * 点击搜索进来的，没有参数。
 * 点击分类进来的，携带分类ID和子分类ID
 * 加载商品之前首先还是构建 where 和 order；
 * where 比较简单 name 和 category
 * order 就是那三个，name，price sale_num;默认是 name
 * 
 * 关于分类的加载，因为每次最多只能加载20个，所以这里使用循环加载，不考虑使用上啦加载更多了，子分类也是一样。分类是在点击筛选的时候，子分类是在选中所付属分类的时候。
 * 
 * 排序 第一次点击是升序排序，第二次点击是降序
 * 
 */

const app = getApp();
const dbUtils = require('../../js/DB.js');
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsList: [],
    goodsWhere: {
      state: 0
    },
    goodsOrder: 'name',
    goodsOrderBy: 'asc',
    category: {},
    subcategory: {},
    refreshGoods: true,
    categoryCount: 0,
    orderIndex: 0,
    categoryList: [],
    categoryIndex: [0, 0],
    subcategoryList: [],
    chooseVisible: false,
    orderArray: ['name', 'sale_num', 'price'],
    lastLoadGoodsTime: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    if (options.category_id) {
      var category = {
        _id: options.category_id,
        name: options.category_name
      }
      var subcategory = {
        _id: options.subcategory_id,
        name: options.subcategory_name,
        parent: category._id
      }
      var where = this.data.goodsWhere;
      where.category = {
        category_id: category._id
      }

      where.subcategory = {
        subcategory_id: subcategory._id
      }

      this.setData({
        goodsWhere: where,
        category: category,
        subcategory: subcategory
      })

    }

    //加载商品
    this.loadGoods();
    // this.loadCategory();
  },
  loadGoods: function() {
    var skip = this.data.refreshGoods ? 0 : this.data.goodsList.length;
    var that = this;
    var data = this.data;
    data.lastLoadGoodsTime = new Date().getTime();
    this.setData(data);
    app.showLoadingMask('加载中');
    db.collection('goods').where(this.data.goodsWhere).skip(skip).orderBy(this.data.goodsOrder, this.data.goodsOrderBy).get()
      .then(res => {
        wx.hideLoading();
        if (res.data.length == 0) {
          if (that.data.refreshGoods) {
            data.goodsList = [];
            that.setData(data);
            app.showToast('没有找到商品');
            return;
          }
          app.showToast('没有商品了');
          return;
        }
        if (that.data.refreshGoods) {
          data.refreshGoods = false;
          data.goodsList = res.data;
        } else {
          data.goodsList = data.goodsList.concat(res.data);
        }

        that.setData(data);
      }).catch(error => app.showError(error, '加载错误'));
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
    var skip = this.data.categoryList.length;
    var data = this.data;
   
    if(this.data.categoryList.length==0){
      var all = {
        _id: 'all',
        name: '全部',
        sub:[{
            _id: 'all',
            name: '全部'
        }]
      }
      this.data.categoryList.push(all);
    }
    db.collection('category').skip(skip).get()
      .then(res => {

        console.log(res.data);
        if (res.data.length > 0) {
          data.categoryList = that.data.categoryList.concat(res.data);

          if (data.category._id) {
            //是否有选中的category 找到那个
            for (var i = 0; i < data.categoryList.length; i++) {
              var choose = data.categoryList[i];
              if (choose.name == data.category.name) {
                data.categoryIndex[0] = i;
                data.category = choose;
                break;
              }
            }
          } else {
            data.categoryIndex[0] = 0;
            data.category = data.categoryList[0];
          }

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
  loadSubcategory: function(category, index) {
    app.showLoadingMask('加载中');
    if (category.sub) { //已经有了，不需要再次加载


      this.data.categoryIndex[1] = 0;
      this.setData({
        subcategoryList: category.sub,
        subcategory: category.sub[0],
        categoryIndex: this.data.categoryIndex
      });
      wx.hideLoading();
      return;


    }

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
        that.setData(data);
        return;
      }

      category.subtotal = res.total;
      data.categoryList[index] = category;
      that.setData(data);

      that.listSubcategory(category, index);


    }).catch(error => app.showError(error, '子分类异常'));
  },
  /**
   * 在加载之前，应该将
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
    var that = this;
    var data = this.data;
    db.collection('subcategory').where({
      parent: category._id
    }).skip(skip).get().then(res => {
      wx.hideLoading();
      if (res.data.length == 0) {
        return;
      }
      console.log(res.data);
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
      }
      if (data.subcategory._id) {
        for (var i = 0; i < category.sub.length; i++) {
          var subcategory = category.sub[i];
          if (subcategory._id == data.subcategory._id && subcategory.parent == data.subcategory.parent) {
            data.categoryIndex[1] = i;
            data.subcategory = subcategory;
            break;
          }
        }
      } else {
        data.categoryIndex[1] = 0;
        data.subcategory = category.sub[0];
      }
      data.categoryList[index] = category;
      data.subcategoryList = category.sub;
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

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.setData({
      refreshGoods: true
    })
    this.loadGoods();
    wx.stopPullDownRefresh();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  loadMoreGoods: function(event) {
    console.log(event);
    var current = new Date().getTime();
    //5 s
    if ((current - this.data.lastLoadGoodsTime) < 5 * 1000) {
      console.log(' interval time less five second!')
      return;
    }
    this.loadGoods();
  },
  submitSearch: function(event) {

    var name = event.detail.value.name;
    console.log('搜索 ->', name);
    var name = db.RegExp({
      regexp: name,
      options: 'i'
    });
    this.data.goodsWhere.name = name;
    this.setData({
      goodsWhere: this.data.goodsWhere,
      refreshGoods: true
    })
    this.loadGoods();
  },
  tapOrderDesc: function(event) {
    console.log(event);
    if (this.data.chooseVisible) {
      this.setData({
        chooseVisible: false
      })
      return;
    }
    var index = event.currentTarget.dataset.index;
    var order = this.data.orderArray[index];
    var orderby = 'desc';
    if (this.data.goodsOrderBy == 'desc') {
      orderby = 'asc';

    }
    this.setData({
      goodsOrder: order,
      goodsOrderBy: orderby,
      orderIndex: index,
      refreshGoods: true
    })
    console.log('排序-desc>', order);
    this.loadGoods();

  },
  tapOrder: function(event) {
    console.log(event);
    if (this.data.chooseVisible) {
      this.setData({
        chooseVisible: false
      })
      return;
    }
    var index = event.currentTarget.dataset.index;
    var order = this.data.orderArray[index];
    var orderby = 'asc';
    if (this.data.goodsOrderBy == 'asc') {
      orderby = 'desc';

    }
    console.log('排序-asc>', order);
    this.setData({
      goodsOrder: order,
      goodsOrderBy: orderby,
      orderIndex: index,
      refreshGoods: true
    })
    this.loadGoods();
  },
  tapChooseCondition: function(event) {
    console.log('筛选')
    this.setData({
      chooseVisible: !this.data.chooseVisible
    })
    if (this.data.categoryList.length == 0) {
      this.loadCategory();
    }
  },
  tapGoods: function(event) {
    var goods = event.currentTarget.dataset.goods;
    console.log('tap ->', goods);
    app.navigateTo('../goodsDetail/goodsDetail?_id=' + goods._id)
  },
  bindCategoryChange: function(event) {
    var data = this.data;
    var parentIndex = event.detail.value[0];
    var subIndex = event.detail.value[1];
    data.category = this.data.categoryList[parentIndex];

    if (this.data.subcategoryList.length > subIndex) {
      data.subcategory = this.data.subcategoryList[subIndex];
    }
    data.categoryIndex = event.detail.value;
    this.setData(data);

    if (data.category.sub) {
      this.setData({
        subcategoryList: data.category.sub
      })
    } else {
      data.categoryIndex[1] = 0;
      this.setData({
        subcategoryList: [],
        subcategory: {},
        categoryIndex: data.categoryIndex
      })
      this.loadSubcategory(data.category, parentIndex);
    }
  },
  tapConfirmCondition: function() {
    //加载商品
    var data = this.data;
    data.chooseVisible = false;
    var where = this.data.goodsWhere;
    if(data.category._id!='all'){
      where.category = {
        category_id: data.category._id
      }
    }else{
      where.category={}
    }
    
    
    if (data.subcategory._id != 'all') {
      where.subcategory = {
        subcategory_id: data.subcategory._id
      }
    }else{
      where.subcategory={}
    }
    // if (data.goodsWhere.name) {
    //   where.name = data.goodsWhere.name;
    // }
    data.goodsWhere = where;
    data.refreshGoods = true;
    this.setData(data);
    this.loadGoods();
  },
  tapCleanCondition: function() {
    var where = this.data.goodsWhere;
    where.category = {};
    where.subcategory = {};
    this.setData({
      category: {},
      subcategory: {},
      categoryIndex: [0, 0],
      chooseVisible: false,
      goodsWhere:where
    });
    this.loadGoods();
    
    

  },
  tapCancelCondition: function() {
    this.setData({
      chooseVisible: false
    })
  }
})