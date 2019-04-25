// miniprogram/pages/goodsComment/goodsComment.js
const app = getApp();
const db = wx.cloud.database();
Page({

  /**
   * 页面的初始数据
   * 在来之前要确认没有评论过，否则会出现多次评论
   * TODO
   * 
   */
  data: {
    order: {},

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    // app.globalData.openid = 'oEaLm5Tep2eHAwEor4Kjo84QyTXc';
    var that = this;
    this.data.order._id = options._id
    app.loading();
    wx.getStorageInfo({
      success: function(res) {
        console.log('keys->', res)
        if (res.keys.indexOf('goodsCommentOrder') != -1) {
          wx.getStorage({
            key: 'goodsCommentOrder',
            success: function(res) {
              console.log('order-->', res)
              wx.hideLoading();
              that.setData({
                order: res.data
              })
            
            },
            fail: function(error) {
              console.error(error);
              that.loadOrderFromRemote();
            }
          })
        } else {
          //从远程加载
          that.loadOrderFromRemote();
        }
      },
      fail: function(error) {
        console.error('getStorage', error);
        that.loadOrderFromRemote();
      }
    })
  },
  loadOrderFromRemote: function() {
    app.loading();
    db.collection('order').doc(this.data.order._id).get()
      .then(res => {
        wx.hideLoading();
        console.log('loadOrderFromRemote', res);

      }).catch(error => app.showError(error, '加载订单失败'));
  },
  tapAddImage: function(event) {
    var index = event.currentTarget.dataset.index;
    var goods = this.data.order.goodsList[index];
    var result = false;
    var evaluate = goods.evaluate;
    result = app.checkEnable(evaluate);
    if(result){
      var pictures = evaluate.pictures;
      result = app.checkEnable(pictures);
      if(result ){
        if (pictures.length >= 6){
          app.showToast('最多6张图片');
          return;
        }
      }else{
        pictures = new Array();
      }
      evaluate.pictures = pictures;
      // goods.evaluate = evaluate;
    }else{
      evaluate = {
        pictures:new Array()
      };
      goods.evaluate =evaluate;
    }
    var that =this;
    app.loading();
    this.chooseImage()
    .then(res=>this.uploadImage(res))
    .then(res=>{
      var image = {
        local:res,
        remote:res
      }
      goods.evaluate.pictures.push(image);
      that.data.order.goodsList[index] = goods;
      that.setData({
        order:that.data.order
      })
      wx.hideLoading();
    })
    .catch(error=>{
      console.error(error);
      app.showError(error,'图片选择失败');
    })
  },
  uploadImage:function(res){
    if(res.length==0){
      wx.hideLoading();
      return;
    }
    app.showLoadingMask('上传中');
    var cloudName = app.getCloudName(res);
    return app.uploadFile(res,'image/evaluate/'+cloudName);
  },
  chooseImage:function(){
    return new Promise((resolve,reject)=>{
      wx.chooseImage({
        count: 1,
        success: function (res) {
          console.log('图片', res);
          if (res.tempFilePaths.length == 0) {
            resolve('');
            return;
          }
          var path = res.tempFilePaths[0];
          resolve(path)
        },
        fail:function(error){
          reject(error)
        }
      })
    })
  },
  tapDelImage:function(event){
    var imageindex= event.currentTarget.dataset.imageindex;
    var goodsindex = event.currentTarget.dataset.goodsindex;
    var image= this.data.order.goodsList[goodsindex].evaluate.pictures[imageindex];
    console.log('删除', image.remote);
    var that =this;
    app.loading();
    wx.cloud.deleteFile({
      fileList: [image.remote]
    }).then(res=>{
      console.log('删除结果',res)
      if(res.fileList.length>0){
        if(res.fileList[0].status==0){
          //删除成功
          that.data.order.goodsList[goodsindex].evaluate.pictures.splice(imageindex,1);
          that.setData({
            order:that.data.order
          })
        }
      }
      wx.hideLoading();
    }).catch(error=>app.showError(error,'删除失败'));
  },
  tapLogistics:function(event){
    var num = event.currentTarget.dataset.num;
    var index = event.currentTarget.dataset.index;
    var goods = this.data.order.goodsList[index];
    var evaluate = goods.evaluate;
    var result = app.checkEnable(evaluate);
    if(result){
          evaluate.logistics = new Number(num);
        
    }else{
      evaluate = {
        logistics :new Number(num)
      }
    }
    goods.evaluate =evaluate;
    this.data.order.goodsList[index] = goods;
    this.setData({
      order:this.data.order
    })
  },
  tapServe:function(event){
    var num = event.currentTarget.dataset.num;
    var index = event.currentTarget.dataset.index;
    var goods = this.data.order.goodsList[index];
    var evaluate = goods.evaluate;
    var result = app.checkEnable(evaluate);
    if (result) {
      evaluate.serve = new Number(num);

    } else {
      evaluate = {
        serve: new Number(num)
      }
    }
    goods.evaluate = evaluate;
    this.data.order.goodsList[index] = goods;
    this.setData({
      order: this.data.order
    })
  },
  tapLike:function(event){
    var num = event.currentTarget.dataset.num;
    var index = event.currentTarget.dataset.index;
    var goods = this.data.order.goodsList[index];
    var evaluate = goods.evaluate;
    var result = app.checkEnable(evaluate);
    if (result) {
      evaluate.like = new Number(num);

    } else {
      evaluate = {
        like: new Number(num)
      }
    }
    goods.evaluate = evaluate;
    this.data.order.goodsList[index] = goods;
    this.setData({
      order: this.data.order
    })
  },
  sutmitGoodsEvaluate:function(event){
    console.log(event);
    var goodsIndex = event.detail.value.index;

    var content = event.detail.value.content;
    if(content.length==0){
      app.showToast('请填写评价');
      return;
    }

    var goods = this.data.order.goodsList[goodsIndex];
    var evaluate = goods.evaluate;
    if(!app.checkEnable(evaluate)){
        app.showToast('请评价物流服务');
        return;
    }
    if(!app.checkEnable(evaluate.logistics)){
      app.showToast('请评价物流服务');
      return;
    }
    if (!app.checkEnable(evaluate.serve)) {
      app.showToast('请评价服务态度');
      return;
    }
    if (!app.checkEnable(evaluate.like)) {
      app.showToast('请评价描述相符');
      return;
    }
    console.log('goods->',goods);
    if (!app.checkEnable(evaluate.pictures)){
      evaluate.pictures =new Array();
    }else{
      var array =new Array();
      for (var i = 0; i < evaluate.pictures.length;i++){
        var item = evaluate.pictures[i];
        array.push(item.remote);
      }
      evaluate.pictures = array;
    }
    evaluate.content = content;
    evaluate.order_id = this.data.order._id;
    evaluate.goods_id = goods.goods_id;
    evaluate.goods = {
      goods_id: goods.goods_id,
      goods_name:goods.goods_name,
      goods_price:goods.goods_price,
      goods_num:goods.goods_num,
      goods_total:goods.goods_total,
      coverPicture:goods.coverPicture
    };
 
    evaluate.createDate =db.serverDate()
    app.loading();
    console.log('添加评价',evaluate);
    db.collection('evaluate').add({
      data:evaluate
    })
      .then(res => this.addEvaluateAfter(res,goodsIndex,evaluate,goods))
      .catch(error=>app.showError(error,'评价失败'));
  },
  addEvaluateAfter:function(res,goodsIndex,evaluate,goods){

     
      if(res._id){
        evaluate._id = res._id;
        this.data.order.goodsList.splice(goodsIndex,1);
        this.setData({
          order:this.data.order
        })
        wx.showToast({
          title: '评论成功'
        })
        if(this.data.order.goodsList.length==0){

         this.writeOrder(evaluate);
        }else{
          wx.hideLoading();
        }
      }else{
        wx.hideLoading();
        app.showToast('评论失败');
      }
  },

  writeOrder: function (evaluate){
    var collection = 'order';
    var where ={
      _id:this.data.order._id
    }
    var data={
      evaluate_id: evaluate._id
    }
    if(app.checkEnable(this.data.order.evaluate_id)){
      dta.evaluate_id = this.data.order.evaluate_id+','+data.evaluate_id
    }
    wx.cloud.callFunction({
      name:'update',
      data:{
        collection:collection,
        where:where,
        data:data
      }
    }).then(res=>{
      wx.hideLoading();
        console.log('writeOrder-->',res);
        if(res.result.stats.updated==1){
          wx.showToast({
            title: '评价成功',
          })
          wx.setStorageSync('evaluatedOrder', evaluate)
          wx.navigateBack({
            
          })
        }
    }).catch(error=>{
      console.error(error);
      wx.hideLoading();
      wx.navigateBack({
        
      })
    });

  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    wx.removeStorageSync('goodsCommentOrder');
  }
})