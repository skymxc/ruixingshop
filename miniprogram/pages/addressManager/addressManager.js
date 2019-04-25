// miniprogram/pages/addressManager/addressManager.js
/**
 * options.choose 是表示 选择地址的。否则就是地址管理
 * storage 里的 address 就是默认的收货地址。
 * 
 */
const app =getApp();
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list:[],
    defIndex:-1,
    defAddress:{},
    choose:false,
    lastTime:0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
    if(options.choose){
      this.setData({
        choose:true
      })
    }
    this.loadList();
  },
  onShow:function(){
    console.log('onShow')
    var res = wx.getStorageInfoSync();
    var that = this;
    console.log(res.keys);
    if (res.keys.indexOf('addaddress')!=-1){
      
     wx.getStorage({
       key: 'addaddress',
       success: function(res) {
         console.log('addaddress->',res);
         that.data.list.push(res.data);
         that.setData({
           list:that.data.list
         })
         wx.removeStorage({
           key: 'addaddress',
           success: function(res) {},
         })
       },
     })
    } else if (res.keys.indexOf('updateAddress')!=-1){
        wx.getStorage({
          key: 'updateAddress',
          success: function(res) {
            var address = res.data;
            var size = that.data.list.length;
            for(var i=0;i<size;i++){
              var item = that.data.list[i];
              if(item._id==address._id){
                that.data.list[i] = address;
                break;
              }
            }
            that.setData({
              list:that.data.list
            })
          wx.removeStorage({
            key: 'updateAddress',
            success: function(res) {},
          })
          },
        })
    }
  },
  loadList:function(){
    this.data.lastTime = new Date().getTime();
    var where={
      _openid:app.globalData.openid
    }
    app.loading();
    db.collection('address').where(where).skip(this.data.list.length).get()
    .then(res=>this.loadListAfter(res))
    .then(()=>this.findDef())
    .catch(error=>app.showError(error,'加载错误'));
  },
  loadListAfter:function(res){
    wx.hideLoading();
    if(res.data.length==0){
      return;
    }
    this.data.list = this.data.list.concat(res.data);
    this.setData({
      list:this.data.list
    })

  },
  findDef:function(){
    if(this.data.list.length==0) return;
    var that =this;
    wx.getStorageInfo({
      success: function (res) {
        if (res.keys.indexOf('address') != -1) {
            wx.getStorage({
              key: 'address',
              success: function(res) {
                var address = res.data;
                var size = that.data.list.length;
                var index=  -1;
                for(var i=0;i<size;i++){
                  var item = that.data.list[i];
                  if(item._id ==address._id){
                      index  =i;
                      break;
                  }
                }
                that.setData({
                  defAddress:res.data,
                  defIndex:index
                })
                
              },
            })
        }
      },
    })
  },
  tapAddress:function(event){
    var index=  event.currentTarget.dataset.index;
    var address = this.data.list[index];
    console.log('选择地址->',address)
    if(this.data.choose){
        wx.setStorage({
          key: 'chooseAddress',
          data: address,
          success:function(){
            wx.navigateBack({
              
            })
          }
        })
    }
  },
  bindChange:function(event){
    console.log(event);
    var index= event.detail.value;
    var checked = event.detail.checked;
    if(checked){
      this.setData({
        defIndex:index,
        defAddress:this.data.list[index]
      })
      wx.setStorage({
        key: 'address',
        data: this.data.list[index],
      })
    }else{
        this.setData({
          defIndex:-1,
          defAddress:{}
        })
        wx.removeStorage({
          key: 'address',
          success: function(res) {},
        })
    }
  },
  tapEdit:function(event){
    var index= event.currentTarget.dataset.index;
    var address = this.data.list[index];
    console.log('编辑->',address);
    wx.setStorage({
      key: 'toupdateaddress',
      data: address,
      success:function(){
        app.navigateTo('../createAddress/createAddress')
      }
    })
  },
  tapDel:function(event){
    var index = event.currentTarget.dataset.index;
    var address = this.data.list[index];
    console.log('删除->', address);
    var that =this;
    wx.showModal({
      title: '提示',
      content: '确认删除吗？',
      success:function(res){
        if(res.confirm){
          app.loading();
          dbUtils.remove('address',address._id)
          .then(res=>{
              console.log('删除',res);
              wx.hideLoading();
              if(res.stats.removed==1){
                that.data.list.splice(index,1);
                that.setData({
                  list:that.data.list
                })
                if(index==that.data.defIndex){
                  that.removeDefAddress();
                }
              }else{
                app.showToast('删除失败');
              }
          }).catch(error=>app.showError(error,'删除失败'));
        }
      }
    })
  },
  removeAddressFromRemote:function(address,index){
    app.loading();
    db.collection('address').doc(address._id).remove()
    .then(res=>this.delAddressFromRemoteAfter(res,index))
    .catch(error=>app.showError(error,'删除失败'));
  },
  delAddressFromRemoteAfter:function(res,index){
    wx.hideLoading();
    if(res.stats.removed==0){
      app.showToast('删除失败');
      return;
    }
    this.data.list.splice(index,1);
    if(this.data.defIndex==index){
      this.data.defIndex=-1;
      this.data.defAddress= {}
    }
    this.setData({
      defIndex:this.data.defIndex,
      defAddress:this.data.defAddress,
      list:this.data.list
    })
  },
  /**
   * 移除默认地址
   */
  removeDefAddress:function(){
    wx.removeStorage({
      key: 'address',
      success: function (res) { },
    })
    this.setData({
      defIndex: -1,
      defAddress: {}
    })
  },
  tapNew:function(){
   if(this.data.list.length>=20){
    wx.showModal({
      title: '提示',
      content: '地址已达到上限',
      showCancel:false
    })
     return;
   }
    app.navigateTo('../createAddress/createAddress')
  }
})