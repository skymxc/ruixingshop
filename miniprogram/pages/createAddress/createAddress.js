// miniprogram/pages/createAddress/createAddress.js
const app =getApp();

const dbUtils = require('../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    address:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that =this;
    app.loading();
    wx.getStorageInfo({
      success: function(res) {
        if(res.keys.indexOf('toupdateaddress')!=-1){
         
            wx.getStorage({
              key: 'toupdateaddress',
              success: function(res) {
                wx.hideLoading();
                  that.setData({
                    address:res.data
                  })
              },
            })
        }else{
          wx.hideLoading();
        }
      }
    })
  },
  submitAddress:function(event){
    var address = event.detail;
    console.log('保存地址',address)
    app.loading();
    if(this.data.address._id){
        this.updateAddress(address)
        .then(res=>{
          console.log('更改地址',res);
            if(res.stats.updated==0){
              app.showToast('保存失败');
              return;
            }
            wx.showToast({
              title: '保存成功',
            })
            wx.setStorage({
              key: 'updateAddress',
              data: address,
            })
        })
        .catch(error=>app.showError(error,'保存失败'));
    }else{
      dbUtils.add('address', address)
      .then(res=>{
        wx.hideLoading()
        if (res._id) {
          address._id = res._id;
          address._openid = app.globalData.openid;
          wx.showToast({
            title: '添加成功',
          })
        
          wx.setStorageSync('addaddress', address)

          wx.navigateBack({
            
          })
        } else {
          app.showToast('添加失败');
        }
      })
      .catch(error=>app.showError(error,'保存失败'));
    }

  },
  updateAddress:function(address){
    var data = {
      consignee: address.consignee,
      phone:address.phone,
      postcode:address.postcode,
      region:address.region,
      street:address.street
    }
    return dbUtils.update('address',address._id,data);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if(this.data.address._id){
      wx.removeStorageSync('toupdateaddress');
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})