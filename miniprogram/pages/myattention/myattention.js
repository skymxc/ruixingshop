// miniprogram/pages/myattention/myattention.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    lastTime: 0,
    bufferList: [],
    editEnable: false,
    checkall: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
    this.loadCollectionList();
  },
  loadCollectionList: function() {

    this.data.lastTime = new Date().geTime;
    app.loading();
    db.collection('collect').where({
        _openid: app.globalData.openid
      }).skip(this.data.list.length).get()
      .then(res => this.loadCollectionAfter(res))
      .then(array => this.loadGoods(array))
      .then(res => this.loadGoodsAfter(res))
      .catch(error => app.showError(error, '加载错误'));
  },
  loadCollectionAfter(res) {
    console.log('我的关注->',res)
    var array = new Array();
    if (res.data.length > 0) {
      this.data.bufferList = res.data;
      var size = res.data.length;
      for (var i = 0; i < size; i++) {
        array.push(res.data[i].goods_id);
      }
    } else {
      if (this.data.list.length > 0) {
        app.showToast('没有更多关注了');
      }

    }
    return array;
  },
  loadGoods: function (array) {
    console.log('loadGoods-》', array);
  
    if (array.length == 0) {
      wx.hideLoading();
      return;
    }
    var _ = db.command;

    return db.collection('goods').where({
      _id: _.in(array)
    }).get();

  },
  loadGoodsAfter: function(res) {
    console.log('loadGoodsAfter', res);
    if (!app.checkEnable(res)) {
      return;
    }
   
    console.log('关注list', this.data.bufferList);
    var array =res.data;
    if (array.length > 0 && this.data.bufferList.length > 0) {
      var data = new Array();
      for (var i = 0; i < array.length; i++) {
        var goods = array[i];
        for (var k = 0; k < this.data.bufferList.length; k++) {
          var collect = this.data.bufferList[k];
          console.log(collect);
          if (collect.goods_id == goods._id) {
            collect.goods = goods;
            data.push(collect);
          }
        }
      }
      this.data.list = this.data.list.concat(data);
      console.log(this.data.list);
      this.setData({
        list: this.data.list,
        bufferList: []
      })
    }
    wx.hideLoading();
  },
  tapComplete: function() {
    this.setData({
      editEnable: false
    })
  },
  tapEdit: function() {
    this.setData({
      editEnable: true
    })
  },
  bindCheckChange: function(event) {
    console.log(event);
    var index = event.detail.value;
    var checked = event.detail.checked;
    this.data.list[index].checked = checked;
    this.setData({
      list: this.data.list
    })
    var size = this.data.list.length;
    var result = true;
    for (var i = 0; i < size; i++) {
      var checked = this.data.list[i].checked;
      result = app.checkEnable(checked);
      if (!result) break;
      result = checked;
      if (!result) break;
    }
    this.setData({
      checkall: result
    })
  },
  tapGoods: function(event) {
    var goods = event.currentTarget.dataset.goods;
    //应该使用缓存 避免在 商品详情再次加载
    app.navigateTo('../goodsDetail/goodsDetail?_id=' + goods._id);
  },
  bindCheckAllChange: function(event) {
    var checked = event.detail.checked;
    var size = this.data.list.length;
    var result = true;
    for (var i = 0; i < size; i++) {
      this.data.list[i].checked = checked;

    }
    this.setData({
      list: this.data.list
    })
  },
  tapDel: function() {
    var array = new Array();
    var size = this.data.list.length;

    for (var i = 0; i < size; i++) {
      var checked = this.data.list[i].checked;
      if (app.checkEnable(checked)) {
        if (checked) {
          array.push(this.data.list[i]._id);
        }
      }
    }
    if (array.length == 0) {
      return;
    }
    var that =this;
    wx.cloud.callFunction({
      name:'delete',
      data:{
        collection:'collect',
        opr:'byId',
        where:{
          _id:array
        }
      }
    }).then(res=>{
        wx.hideLoading();
        console.log('删除->',res);
        if(res.result.stats.removed>0){
          that.setData({
            list:[]
          })
          that.loadCollectionList();
        }
    }).catch(error=>app.showError(error,'删除失败'));
  }
})