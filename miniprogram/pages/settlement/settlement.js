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
    address:{},
    comment:'',
    coupon:{}
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
            totalPrice += new Number(goods.goods_total);
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
            console.log('setStorage address-->', res.data[0]);
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
    // this.setAddress();
    // 地址 chooseAddress
    var that = this;
    wx.getStorageInfo({
      success: function(res) {
        if (res.keys.indexOf('chooseAddress')!=-1){
          wx.getStorage({
            key: 'chooseAddress',
            success: function(res) {
                that.setData({
                  address:res.data
                })
                wx.removeStorage({
                  key: 'chooseAddress',
                  success: function(res) {},
                })
            },
          })
        }
         if (res.keys.indexOf('choosecoupon')!=-1){
          var mycoupon= wx.getStorageSync('choosecoupon');
          that.setData({
            coupon:mycoupon
          })
          //  wx.removeStorageSync('choosecoupon')
        }
      },
    })

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
  },
  tapChooseAddress:function(){
    //todo  选择地址
    app.navigateTo('../addressManager/addressManager?choose=true')
  },
  bindInputComment:function(event){
    // console.log('留言',event);
    this.setData({
      comment:event.detail.value
    })
  },
  tapPay:function(){
    var data =this.data;
    if(data.goodsList.length==0){
      return;
    }
    if(data.addressList.length==0){
      app.showToast('请填写地址');
      return;
    }

    var date = new Date();
    var date_str = app.formatDate('yyyy-MM-dd HH:mm:ss',date);
    //待发货 0；
    //
    var order  = {
      address:this.data.address,
      goodsList: this.data.goodsList,
      comment: this.data.comment,
      totalPrice:this.data.totalPrice,
      totalPostage:this.data.totalPostage,
      state:0,
      stateStr:'待发货'
      
    }

    if(this.data.coupon._id){
      order.coupon = this.data.coupon;
      
    }
    console.log('生成订单',order);
    app.showLoadingMask('请稍后');
    wx.cloud.callFunction({
      name:'handleOrder',
      data:{
        order:order
      }
    }).then(res=>this.handleOrderResult(res.result))
    .catch(error=>{
      app.showError(error,'出单失败');
      // console.error('出单失败',error);
    })
  },
  handleOrderResult(res){
    wx.hideLoading();
    console.log('出单结果', res);
    var data =this.data;
    if (res.code == -1) {
      var goods = data.goodsList[res.index];
     wx.showModal({
       title: '出单失败',
       content: goods.goods_name+'库存不够了',
       showCancel:false
     })
      return;
    }

    if(res.code ==-2){
      app.showError(res.error,'出单失败');
      return;
    }
    if(res.code==-3){
      wx.showModal({
        title: '出单失败',
        content: res.msg,
        showCancel:false
      })
      return;
    }
    if(res.code ==0){
        app.showToast('购买成功');
        //todo 去 订单详情
        wx.removeStorageSync('orderlist');
        app.showLoadingMask('请稍后');

            
            wx.redirectTo({
              url: '../orderDetail/orderDetail?_id='+res.order._id,
              success: function () {
                wx.hideLoading();
              }
              });

       
    }else{
      app.showToast('出单异常');
    }
  },
  onUnload:function(){
    wx.removeStorage({
      key: 'orderlist',
      success: function(res) {},
    })
  },
  tapChooseCoupon:function(){
    wx.setStorage({
      key: 'choosecoupongoods',
      data: this.data.goodsList,
      success:function(res){
        app.navigateTo('../chooseMyCoupon/chooseMyCoupon')
      },
      fail:function(error){
        app.showError(error,'优惠卷加载失败')
      }
    })
   
  }
})