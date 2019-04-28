// miniprogram/pages/couponDel/couponDel.js
/**
 * 这里的删除并非真正的删除，只是令优惠卷无效，数量 为0
 */
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    list: [],
    lastTime: 0,
    checkall:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.listCoupon();
  },
  /**
   * 只列出了在有效期的优惠卷
   */
  listCoupon: function() {
    this.data.lastTime = new Date().getTime();
    var _ =db.command;
    app.loading();
    var that =this;
    db.collection('coupon').skip(this.data.list.length)
      .where({ validity: _.gte(this.data.lastTime)}).get()
      .then(res=>{
        wx.hideLoading();
        if(res.data.length==0) return;
        that.data.list = that.data.list.concat(res.data);
        that.setData({
          list:that.data.list
        })
      }).catch(error=>app.showError(error,'加载错误'));
  },
  loadmore:function(){
    var current = new Date().getTime();
    if(current-this.data.lastTime< 5 * 1000){
      return;
    }
    this.listCoupon();
  },
  tapDel:function(event){
    var index = event.currentTarget.dataset.index;
    var coupon = this.data.list[index];
    app.loading();
    var that =this;
    db.collection('coupon').doc(coupon._id).remove()
    .then(res=>{
      wx.hideLoading();
      if(res.stats.removed==1){
        wx.showToast({
          title: '删除成功',
        })
        that.data.list.splice(index,1);
        that.setData({
          list:that.data.list
        })
      }else{
        app.showToast('删除失败');
      }
    }).catch(error=>app.showError(error,'删除失败'))
  },
  bindChange:function(event){
    console.log(event);
    var checked = event.detail.checked;
    var index = event.detail.value;
    this.data.list[index].checked = checked;
    this.setData({
      list:this.data.list
    })
    var result = true;
    var size = this.data.list.length;
    for(var i=0;i<size;i++){
      var coupon = this.data.list[i];
      var checked = coupon.checked;
      result = app.checkEnable(checked);
      if(!result) break;
      if(!checked) {
        result =false;
        break;
      }
    }
    this.setData({
      checkall:result
    })
  },
  bindCheckAllChange:function(event){
    var checked =event.detail.checked;
    var size = this.data.list.length;
    for (var i = 0; i < size; i++) {
      var coupon = this.data.list[i];
     this.data.list[i].checked=checked;
    }
    this.setData({
      list:this.data.list
    })
  },
  tapDelAll:function(event){
    var array = new Array();
    var list =this.data.list;
    var size =list.length;
    for(var i=0;i<size;i++){
      var coupon = list[i];
      if(app.checkEnable(coupon.checked)){
        if(coupon.checked){
          array.push(coupon._id);
        }
      }
    }
    if(array.length==0){
     return;
    }
    var collection = 'coupon';
    var where={
      _id:array
    }
    var data= {
      validity:-1
    }
    app.loading();
    var that =this;
    wx.cloud.callFunction({
      name:'update',
      data:{
        opr:'byId',
        collection:collection,
        data:data,
        where:where
      }
    }).then(res=>{
        console.log('删除全部->',res);
        wx.hideLoading();
       if(res.result.stats.updated>0){
         wx.showToast({
           title: '删除成功',
         })
         that.setData({
           list:[]
         })
         that.listCoupon();
       }else{
         app.showToast('删除失败');
       }
    }).catch(error=>app.showError(error,'删除失败'));
  }
})