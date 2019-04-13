// miniprogram/pages/settlement/settlement.js
const app = getApp();
const userUtils = require('../../js/Users.js');
const dbUtils = require('../../js/DB.js');
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    addressList:[],
    goodsList:[],
    totalPrice:0,
    totalPostage:0,
    writeAddress:false,
    address:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadGoodsList();
  },
  loadGoodsList:function(){
    app.showLoadingMask('请稍后');
    var that =this;
    wx.getStorage({
      key: 'orderlist',
      success: function(res) {
        console.log('loadGoodsList',res);
          wx.hideLoading();
          var totalPrice = new Number();
          var totalPostage =new Number();
          for(var i=0;i<res.data.length;i++){
              var goods = res.data[i];
            totalPrice += new Number(goods.goods_price);
            totalPostage += new Number(goods.postage);
          }
          that.setData({
            goodsList:res.data,
            totalPostage:totalPostage,
            totalPrice:totalPrice
          })
          //加载 地址
          wx.hideLoading();
          that.loadAddress();
      },
      fail:function(error){
        console.error('加载结算订单',error);
        app.showError(error,'请稍后重试');
      }
    })
  },
  loadAddress:function(){
      if(this.data.addressList.length!=0)return;
    app.showLoadingMask('请稍后');
    var that =this;
    //读取缓存
    wx.getStorageInfo({
      success: function(res) {
        console.log('loadAddress ',res.keys);
        if(res.keys.indexOf('address')!=-1){
            that.setAddress();
        }else{
          that.loadAddressFromRemote();
        }
      },
      fail:function(error){
        console.error('loadAddress ',error)
        that.loadAddressFromRemote();
      }
    })
   
  },
  loadAddressFromRemote:function(){
    var that =this;
    db.collection('address').where({
      _openid: app.globalData.openid
    }).get().then(res => {
      console.log('loadAddressFromRemote',res);
      if (res.data.length > 0) {
        that.setData({
          address:res.data[0],
          addressList:res.data
        })
        wx.setStorage({
          key: 'address',
          data: res.data[0],
          success: function () {
            console.log('setStorage address-->',address);
          }
        })
        that.setAddress();

      } else {
        wx.hideLoading();
      }
    }).catch(error => {
      wx.hideLoading();
      console.error('地址加载', error);
    })
  },
  setAddress:function(){
    app.showLoadingMask('请稍后')
    var that =this;
    wx.getStorage({
      key: 'address',
      success: function(res) {
        console.log('setAddress',res);
        wx.hideLoading();
        var address = res.data;
        that.data.addressList.push(address);
        that.setData({
          addressList: that.data.addressList,
          address:address
        })
      },
      fail:function(error){
        wx.hideLoading();
        console.error('setAddress',error)
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setAddress();
  },
  tapMask:function(){
    this.setData({
      writeAddress:false
    })
  },
  /**
   * 选择地址
   */
  tapWriteAddress:function(){
    this.setData({
      writeAddress:true
    })
  },
  submitAddress:function(event){
    console.log('submitAddress',event);
    var address = event.detail;
    //增加
    app.showLoadingMask('请稍后');
    var that =this;
    dbUtils.add('address',address).then(res=>{
      wx.hideLoading();
        if(res._id){
            address._id = res._id;
            address._openid = app.globalData.openid;
            that.data.addressList.push(address);
            that.setData({
              address:address,
              addressList:that.data.addressList
            })
            app.showToast('添加成功');
            that.tapMask();
            wx.setStorageSync('address', address)
        }else{
          app.showToast('添加失败');
        }
    }).catch(error=>app.showError(error,'添加失败！'))
  }
})