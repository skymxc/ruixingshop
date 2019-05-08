// miniprogram/pages/shopcar/shop
/**
 * 检查用户是否登陆，
 * 加载购物车
 * todo
 * customcheckbox 观察值的变化作出反应
 * 加载更多。
 */
const app = getApp();
const userUtils = require('../../js/Users.js');
const dbUtils = require('../../js/DB.js');
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsList: [],
    editVisible: false,
    checkall: false,
    selectedTotal: 0,
    lastLoadGoodsTime:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

  },
  checkUserLogin: function() {
    return new Promise((resolve, reject) => {
      app.showLoadingMask("检查授权信息");
      app.checkUserPermission().then(res => {
        console.log('It is has userinfo permission? :' + res);
        if (res) {
          //授权过了 登陆
          app.login().then(() => {
            wx.hideLoading();
            //登陆成功 跳转
            resolve();
          }).catch(error => app.showErrNoCancel('登陆异常', error.errMsg));
        } else { //申请权限
          //去权限申请页
          reject();
        }
      }).catch(err => {
        console.log(err.errMsg);
        app.showErrNoCancel("检查权限异常", err.errMsg);
      });
    })
  },
  /**
   * 去申请获取用户信息的权限
   */
  navigateToAuthorize: function() {
    app.showLoadingMask('申请授权');
    wx.navigateTo({
      url: '../authorize/authorize',
      success: function() {
        wx.hideLoading();
      },
      fail: function(error) {
        app.showErrNoCancel('授权失败', error.errMsg);
      }
    })
  },
  loadGoodsList: function() {
    app.showLoadingMask('请稍后');
    var that = this;
    this.data.lastLoadGoodsTime = new Date().getTime();
    db.collection('shopcar').where({
        _openid: app.globalData._openid
      }).skip(this.data.goodsList.length)
      .get().then(res => {
        console.log('loadGoodsList ', res);
        wx.hideLoading();
        that.data.goodsList = that.data.goodsList.concat(res.data);
        that.setData({
          goodsList: that.data.goodsList
        })
        that.checkAllChecked();
        that.setSelectedTotal();
      })
      .catch(error => app.showError(error, '加载失败'));
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    //检查权限
    if (app.globalData.logged) {
      this.loadGoodsList();
      return;
    }
    var that = this;
    app.showLoadingMask('检查用户');
    this.checkUserLogin().then(() => {
      //登陆成功了是否关注了
      that.loadGoodsList();

    }).catch(() => this.navigateToAuthorize());
  },
  bindGoodsChange: function(event) {
    console.log('bindGoodsChange', event);
    var data = this.data;
    var checkall = true;
    var id = event.detail.value;
    var checked = event.detail.checked;

    for (var i = 0; i < this.data.goodsList.length; i++) {
      var goods = this.data.goodsList[i];
      if (goods._id == id) {
        goods.checked = checked;
        this.data.goodsList[i] = goods;
        break;
      }
    }
    this.setData({
      goodsList: this.data.goodsList
    })
    this.checkAllChecked();
    this.setSelectedTotal();
  },
  checkAllChecked: function() {
    var result = true;

    for (var i = 0; i < this.data.goodsList.length; i++) {
      var goods = this.data.goodsList[i];

      var checked = goods.checked;

      if (!app.checkEnable(checked)) {
        result = false;
        break;
      }

      result = checked;
      if (!result) {
        break;
      }


    }
    console.log('全选-->', result);
    this.setData({
      checkall: result
    })
  },
  setSelectedTotal: function() {

    var sum = new Number();
    for (var i = 0; i < this.data.goodsList.length; i++) {
      var goods = this.data.goodsList[i];

      var checked = goods.checked;

      if (app.checkEnable(checked)) {
        if (checked) {
          sum += new Number(goods.goods_total);
        }
      }

    }
    if(sum==0){
      sum=0;
    }

    this.setData({
      selectedTotal: sum
    })
  },
  bindCheckAllChange: function(event) {
    var checked = event.detail.checked;
    for (var i = 0; i < this.data.goodsList.length; i++) {
      var goods = this.data.goodsList[i];
      goods.checked = checked;
      this.data.goodsList[i] = goods;
    }
    this.setData({
      goodsList: this.data.goodsList
    })
    this.checkAllChecked();
    this.setSelectedTotal();
  },
  tapEdit: function() {
    this.setData({
      editVisible: true
    })
  },
  tapEditComplete: function() {
    this.setData({
      editVisible: false
    })
  },
  tapCalc: function() {
    console.log('结算')
    var array = this.getSelectArray();
    if (array.length == 0) {
      app.showToast('请选择商品');
      return;
    }
    //从购物车删除
    app.showLoadingMask('请稍后')
    this.delArray(array)
    .then(res=>this.toSettlement(res,array))
    .catch(error=>app.showError(error,'结算失败'))
    

  },
  tapDel: function() {

    var array = this.getSelectArray();
    if (array.length == 0) {
      app.showToast('请选择商品');
      return;
    }
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确认删除选中的商品吗',
      success: function(res) {
        if (res.confirm) {
          that.handleDelGoods(array);
        }
      }
    })
  },
  getSelectArray: function() {
    var array = new Array();
    for (var i = 0; i < this.data.goodsList.length; i++) {
      var goods = this.data.goodsList[i];
      var checked = goods.checked;
      if (app.checkEnable(checked)) {
        if (checked) {
          array.push(goods);
        }
      }
    }
    return array;
  },
  handleDelGoods:function(array){
    app.showLoadingMask('请稍后');
    var that =this;
    this.delArray(array).then(res=>{
        wx.hideLoading();
      console.log('handleDelGoods',res);
      if(res.result.stats.removed>0){
        app.showToast('删除成功')
        that.setData({
          goodsList:[]
        })
      };
      that.loadGoodsList();
    }).catch(error=>app.showError(error,'删除失败'))
  },
  delArray: function(array) {
    var ids = new Array();
    for (var i = 0; i < array.length; i++) {
      var goods = array[i];
      ids.push(goods._id);
    }
    return wx.cloud.callFunction({
      name: 'delTableById',
      data: {
        ids: ids,
        table: 'shopcar'
      }
    });
  },
  toSettlement:function(res,array){
    console.log('toSettlement',res)
   var that =this;
    wx.setStorage({
      key: 'orderlist',
      data: array,
      success: function() {
        wx.hideLoading();
        console.log('下单走你')
        that.setData({
          goodsList:[]
        })
        app.navigateTo('../settlement/settlement')
      },
      fail: function(error) {
        app.showError(error, '结算失败');
      }
    })
  },
  onReachBottom: function () {
    var current = new Date().getTime();
    //5 s
    if ((current - this.data.lastLoadGoodsTime) < 5 * 1000) {
      console.log(' interval time less five second!')
      return;
    }
    this.loadGoodsList();
  },
  /**
   * 没有更新到数据库
   */
  tapGoodsNumAdd:function(event){
    var index= event.currentTarget.dataset.index;
    var goods =this.data.goodsList[index];
    goods.goods_num+=1;
    this.data.goodsList[index] = goods;
    goods.goods_total = goods.goods_num * goods.goods_price;
    this.setData({
      goodsList:this.data.goodsList
    })
    this.setSelectedTotal();
  },
   /**
   * 没有更新到数据库
   */
  tapGoodsNumReduce:function(event){
    var index = event.currentTarget.dataset.index;
    var goods = this.data.goodsList[index];
    goods.goods_num -=1;
    if(goods.goods_num<1){
      goods.goods_num=1;
    }
    goods.goods_total = goods.goods_num * goods.goods_price;
    this.data.goodsList[index] = goods;
    this.setData({
      goodsList: this.data.goodsList
    })
    this.setSelectedTotal();
   
  }

})