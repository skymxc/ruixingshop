// miniprogram/pages/orderDetail/orderDetail.js
const app = getApp();
const userUtils = require('../../js/Users.js');
const dbUtils = require('../../js/DB.js');
const db = wx.cloud.database();
/**
 * 先从 缓存中读取 order 没有再从 options._id 获取，都没有 返回。
 * 
 */
Page({

  /**
   * 页面的初始数据
   */
  data: {
    _id:'',
    order:{},
    orderState:'等待卖家发货',
    address:{},
    createDateStr:'',
    payDateStr:'',
    deliveryDateStr:'等待发货'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if(options._id){
      this.data._id = options._id;
    }
    this.loadOrderFromStorage();
     
  },
  loadOrderFromStorage:function(){
    app.showLoadingMask('请稍后');
    var that =this;
    var data =this.data;
    wx.getStorageInfo({
      success: function(res) {
        
          if(res.keys.indexOf('order')==-1){
            that.loadOrderFromRemote();
            return;
          }
          wx.getStorage({
            key: 'order',
            success: function(res) {
                that.setOrder(res.data);
            },
            fail: function (error){
              console.error('loadOrderFromStorage ', error);
              that.loadOrderFromRemote();
            }
          })
          
      },
      fail:function(error){
        console.error('loadOrderFromStorage ',error);
        that.loadOrderFromRemote();
      }
    })
  },
  loadOrderFromRemote:function(){
  
    if(this.data._id.length==0){
      wx.showModal({
        title: '订单失效',
        content: '订单已取消或者已废弃',
        showCancel:false,
        success:function(){
          wx.navigateBack({
            
          })
        }
      })
      return;
    }
    var that =this;
    app.showLoadingMask('请稍后');
    db.collection('order').doc(this.data._id).get().then(res=>{
      console.log('loadOrderFromRemote',res);
        wx.setStorage({
          key: 'order',
          data: res.data,
        })
        that.setOrder(res.data);
    }).catch(error=>{
      wx.hideLoading();
      wx.showModal({
        title: '订单异常',
        content: error.errMsg,
        showCancel: false,
        success: function () {
          wx.navigateBack({

          })
        }
      })
    })
  },
  setOrder:function(order){
   
    var stateStr = this.data.orderState;
    var deliveryDateStr = this.data.deliveryDateStr;
    if(order.state==1){
        stateStr = '卖家已发货';
      deliveryDateStr = app.formatDate('yyyy-MM-dd hh:mm:ss', new Date(order.deliveryDate));
    }else if(order.state==2){
        stateStr = '订单已完成';
      deliveryDateStr = app.formatDate('yyyy-MM-dd hh:mm:ss', new Date(order.deliveryDate));
    }
    var createDateStr = app.formatDate('yyyy-MM-dd hh:mm:ss', new Date(order.createDate));
    var payDateStr = app.formatDate('yyyy-MM-dd hh:mm:ss', new Date(order.payDate));

    this.setData({
      order:order,
      address:order.address,
      orderState:stateStr,
      payDateStr: payDateStr,
      createDateStr: createDateStr,
      deliveryDateStr: deliveryDateStr
    })
    wx.hideLoading();
  },
  tapConfrim:function(){
    app.showLoadingMask('请稍后');
    // db.collection('order').doc(this.data.order._id).update({
    //   data:{
    //     state:2
    //   }
    // })
    dbUtils.update('order', this.data.order._id, { state: 2 })
    .then(res=>{
      console.log('收货',res);
        wx.hideLoading();
        if(res.stats.updated==1){
          wx.navigateBack({
            
          })
        }else{
          app.showToast('收货失败');
        }
    }).catch(error=>app.showError(error,'收货失败'));
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    
    wx.removeStorageSync('order');
  }
})