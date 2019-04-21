// miniprogram/pages/orderlist/orderlist.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   * state 数据
   *  -2 ：全部 全部
   *  0 ：待发货 待发货
   *  1 ：待收货 已发货 
   *  2 : 已完成 已完成
   *  3 ：已退货 被退货
   * 
   * 
   * 这里对 list 应该做缓存处理，在切换时不必再次去重新加载
   */
  data: {
    state: -2,
    manager: false,
    list: [],
    refresh: false,
    loadTime: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
    
    console.log(options);
    if(options.state){
      this.setData({
        state: new Number(options.state)
      })
    }
    
    if (options.manager) {
      this.setData({
        manager: options.manager
      })
    }
    this.loadOrderList();
  },
  loadOrderList: function() {
    this.data.loadTime = new Date().getTime();
    var _ = db.command;

    var where = {
      state: this.data.state
    }
    if (where.state == '-2') {
      where.state = _.neq(-1)
    }
    if(!this.data.manager){
      where._openid=app.globalData.openid
    }
    app.showLoadingMask('请稍后');
    var skip = this.data.refresh ? 0 : this.data.list.length;
    var that = this;
    db.collection('order').where(where).skip(skip).orderBy('createDate', 'desc').get()
      .then(res => {
        wx.hideLoading();
        if (that.data.refresh) {
          that.data.list = res.data;
        } else {
          that.data.list = that.data.list.concat(res.data);
        }
        that.setData({
          list: that.data.list,
          refresh: false
        })
      }).catch(error => app.showError(error, '加载错误'));
  },
  tapState: function(event) {
    var state = event.currentTarget.dataset.state;
    if (state == this.data.state) return;
    this.setData({
      state: new Number(state)
    })
    this.setData({
      refresh: true
    })
    this.loadOrderList();
  },
  loadMoreOrder: function(event) {

    var current = new Date().getTime();
    if ((current - this.data.loadTime) < 5 * 1000) {
      console.log('load more less 5s')
      return;
    }
    this.loadOrderList();
  },
  /**
   * 确认收货
   */
  tapConfirmDelivery: function(event) {
    var index = event.currentTarget.dataset.index;
    var order = this.data.list[index];
    var data = {
      state: 2,
      stateStr: '已完成',
      confirmDate: new Date().getTime()
    }
    app.loading();
    this.changeState(order, data)
      .then(res => this.changeAfter(res, index,data))
      .catch(error => app.showError(error, '确认收货失败'));
  },
  /**
   * 确认发货
   */
  tapConfirmPost: function(event) {
    var index = event.currentTarget.dataset.index;
    var order = this.data.list[index];
    //这里的时间应该使用 服务器时间，但是，懒得再写一个云函数
    var data = {
      state: 1,
      stateStr: '已发货',
      deliveryDate: new Date().getTime()
    }
    app.loading();
    this.changeState(order, data)
      .then(res => this.changeAfter(res, index,data))
      .catch(error => app.showError(error, '确认发货失败'));
  },
  /**
   * 确认退货
   */
  tapReturn: function(event) {
    var index = event.currentTarget.dataset.index;
    var order = this.data.list[index];
    var data = {
      state: 3,
      stateStr: '已退货',
      confirmDate: new Date().getTime()
    }
    app.loading();
    this.changeState(order, data)
      .then(res => this.changeAfter(res, index,data))
      .catch(error => app.showError(error, '退货失败'));
  },
  /**
   * 改变状态
   */
  changeState: function(order, data) {
    return wx.cloud.callFunction({
      name: 'update',
      data: {
        collection: 'order',
        where: {
          _id: order._id
        },
        data: data
      }
    });
  },
  changeAfter: function(res, index,data) {
    console.log(res);
    wx.hideLoading();
    if (res.result.stats.updated == 1) {
      var order = this.data.list[index];
      if(this.data.state==-2){
          
          order.state = data.state;
          order.stateStr = data.stateStr;
          this.data.list[index] = order;
          this.setData({
            list:this.data.list
          })
      }else{
        this.data.list.splice(index, 1);
        this.setData({
          list: this.data.list
        })
      }
      //
      if (data.state==2 &&!this.data.manager){
        var that =this;
        wx.showModal({
          title: '收货成功',
          content: '前往评价?',
          cancelText:'取消',
          confirmText:'评价',
          success:function(res){
            if(res.confirm){
              // app.navigateTo('../goodsComment/goodsComment?_id=' + order._id);
              that.toEvaluate(order);
            }
          }
        })
      }else{
        wx.showToast({
          title: '成功',
        })
      }
      
    } else {
      wx.shoaToast('操作失败！');
    }
  },
  tapOrder:function(event){
    var index= event.currentTarget.dataset.index;
    var order= this.data.list[index];
    console.log(order);
    wx.setStorage({
      key: 'order',
      data: order,
      success:function(){
        app.navigateTo('../orderDetail/orderDetail')
      }
    })
  },
  tapEvaluate:function(event){
    var index = event.currentTarget.dataset.index;
    var order = this.data.list[index];
    this.toEvaluate(order);
  },
  toEvaluate:function(order){
    console.log('评价', order);
    wx.setStorage({
      key: 'goodsCommentOrder',
      data: order,
    })
    app.navigateTo('../goodsComment/goodsComment?_id=' + order._id);
  }
})