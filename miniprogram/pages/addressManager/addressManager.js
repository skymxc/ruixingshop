// miniprogram/pages/addressManager/addressManager.js
/**
 * options.choose 是表示 选择地址的。否则就是地址管理
 * storage 里的 address 就是默认的收货地址。
 * 
 */
const app =getApp();
const db = wx.cloud.database();
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
  },
  tapDel:function(event){
    var index = event.currentTarget.dataset.index;
    var address = this.data.list[index];
    console.log('删除->', address);
  },
  tapNew:function(){
    console.log('新建地址')
  }
})