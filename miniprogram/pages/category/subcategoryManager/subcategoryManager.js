// miniprogram/pages/category/subcategoryManager/subcategoryManager.js
const app = getApp();
const db = wx.cloud.database();
const dbUtils = require('../../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  
  data: {
    parent:{},
    maskVisible: false,
    confirmVisible: false,
    pureAdd: false,
    addImageVisible: true,
    list: [],
    category: {},
    updateIndex: -1,
    addImageSrc: '',
    pageIndex: 0,
    pageSize: 20,
    table: 'subcategory'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options);

    this.data.parent._id = options._id;
    this.data.parent.name = options.name;
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    app.showLoadingMask('加载中');
    var that = this;
    dbUtils.load(this.data.table, {parent:this.data.parent._id}, this.data.pageSize, this.data.pageIndex, 'name', 'asc')
      .then(res => {
        console.log(res);
        wx.hideLoading();
        that.setData({
          pageSize: res.data.length,
          list: res.data
        })
      }).catch(error => {
        app.showErrNoCancel('加载失败', error.errMsg);
      })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.maskVisible) {

      return;
    }
    if(this.data.list.length<this.data.pageSize){
      return;
    }
    var that = this;
    app.showLoadingMask('加载中')
    dbUtils.load(this.data.table, { parent: this.data.parent._id}, this.data.pageSize, this.data.list.length, 'name', 'asc')
      .then(res => {
        wx.hideLoading();
        if (res.data.length > 0) {
          that.data.list = that.data.list.concat(res.data);
          that.setData({
            list: that.data.list
          });
        }
      }).catch(error => {
        app.showErrNoCancel('加载失败', error.errMsg);
      })
  },
  /**
   * 点击分类
   */
  tapCategory: function (event) {
    var category = event.currentTarget.dataset.category;
    var index = event.currentTarget.dataset.index;
    app.showLoadingMask('请稍候');
    var param = '?_id=' + category._id + '&parent=' + this.data.parent._id;
    app.navigateTo('../ruleManager/ruleManager' + param)

  },
  /**
   * 长按分类
   */
  longtapCategory: function (event) {
    console.log(event);
    var category = event.currentTarget.dataset.category;
    var index = event.currentTarget.dataset.index;
    this.setData({
      maskVisible: true,
      confirmVisible: true,
      category: category,
      addImageSrc: category.icon,
      pureAdd: false,
      updateIndex: index,
      addImageVisible: false
    });
  },
  tapMask: function () {
    this.setData({
      maskVisible: false,
      confirmVisible: false,
      pureAdd: false,
      category: {},
      updateIndex: -1,
      addImageSrc: ''
    })
  },
  /**
   * 弹出添加按钮
   */
  tapToAdd: function () {
    this.setData({
      maskVisible: true,
      confirmVisible: true,
      pureAdd: true,
      addImageVisible: true,
      addImageSrc: ''
    });
  },
  /**
   * 选择图标
   */
  tapAddImage: function () {
    var that = this;
    app.showLoadingMask('请稍后');
    wx.chooseImage({
      count: 1,
      success: function (res) {
        wx.hideLoading();
        console.log(res.tempFilePaths);
        that.data.addImageSrc = res.tempFilePaths[0];
        that.setData({
          addImageSrc: that.data.addImageSrc,
          addImageVisible: false
        });
      },
      fail: function (error) {
        wx.hideLoading();
        // console.error(error);
        // app.showErrNoCancel('微信异常', error.errMsg);
      }
    });
  },
  /**
   * 移除图标
   */
  tapDelImage: function () {
    var that = this;
    this.setData({
      addImageSrc: '',
      addImageVisible: true
    });
  },
  /**
   * 提交修改 || 添加
   */
  submitUpdate: function (event) {
    console.log(event);
    var that = this;
    var name = event.detail.value.categoryName;
    if (name.length == 0) {
      wx.showToast({
        title: '名称不能为空',
        icon: 'none'
      });
      return;
    }

    if (this.data.addImageSrc.length == 0) {
      wx.showToast({
        title: '请选择图标',
        icon: 'none'
      })
      return;
    }

    var category = {
      name: name,
      icon: this.data.addImageSrc
    }

    if (this.data.pureAdd) {
      this.toAdd(category);
    } else {
      this.toUpdate(category);
    }
  },/**
   * 去修改分类
   */
  toUpdate: function (category) {


    var index = category.icon.indexOf('cloud:');
    var that = this;

    if (this.data.list[this.data.updateIndex].icon == category.icon) {
      //没有修改图标
      if (this.data.list[this.data.updateIndex].name == category.name) {

        wx.showToast({
          title: '没做任何修改',
          icon: 'none'
        });

        return
      }
      this.isExist(category.name).then(res => {
        if (res.total != 0) {
          wx.showToast({
            title: '分类名称已经存在',
            icon: 'none'
          });
          return;
        }
        app.showLoadingMask('修改中');

        var _id = that.data.list[that.data.updateIndex]._id;
        dbUtils.update(this.data.table, _id, category)
          .then(res => that.updateAfter(res, category))
          .catch(error => {
            console.error(error);
            app.showErrNoCancel('修改错误', error.errMsg);
          });
      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('名字查重错误', error.errMsg);
      });
    } else {
      //修改了图标
      app.showLoadingMask('修改中');
      if (this.data.list[this.data.updateIndex].name == category.name) {
        //如果没有修改名字
        this.uploadFile(category.icon)
          .then(res => this.submitCategory(res, category))
          .then(res => this.updateAfter(res, category))
          .catch(error => {
            app.showErrNoCancel('修改错误', error.errMsg);
          });
        return;
      }
      //修改了名字 需要判断名字是否重复
      this.isExist(category.name).then(res => {
        if (res.total != 0) {
          wx.hideLoading();
          wx.showToast({
            title: '分类名称已经存在',
            icon: 'none'
          });
          return;
        }
        var _id = that.data.list[that.data.updateIndex]._id;
        dbUtils.update(this.data.table, _id, category)
          .then(res => that.updateAfter(res, category))
          .catch(error => {
            console.error(error);
            app.showErrNoCancel('修改错误', error.errMsg);
          });

      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('名字查重错误', error.errMsg);
      });

    }
  },
  /**
   * 去添加分类
   */
  toAdd: function (category) {
    app.showLoadingMask('添加中');
    this.isExist(category.name).then(res => {
      console.log(category.name + ' :count:' + res.total);
      if (res.total != 0) {
        wx.hideLoading();
        wx.showToast({
          title: '分类名称已经存在',
          icon: 'none'
        });
        return;

      }

      this.uploadFile(category.icon)
        .then(res => this.submitCategory(res, category))
        .then(res => this.addAfter(res, category))
        .catch(error => {
          app.showErrNoCancel('添加错误', error.errMsg);
        });
    }).catch(error => {
      console.error(error);
      app.showErrNoCancel('检索重名错误', error.errMsg);
    });


  },
  /**
   * 提交表单 根据 pureAdd 判断是不是添加或者修改
   * @icon 上传后的 图标 fileid
   * @category 需要提交的 category
   * return 数据库执行后的结果
   */
  submitCategory: function (icon, category) {
    category.icon = icon;
    if (this.data.pureAdd) {
      console.log('submitCategory--add')
      category.parent = this.data.parent._id;
      return dbUtils.add(this.data.table, category);
    } else {
      console.log('submitCategory--udpate')
      var _id = this.data.list[this.data.updateIndex]._id;
      return dbUtils.update(this.data.table, _id, category);
    }
  },
  updateAfter: function (res, category) {
    wx.hideLoading();
    console.log(res);
    if (res.stats.updated == 1) {
      wx.showToast({
        title: '修改成功',
      })
      this.data.list[this.data.updateIndex].name = category.name;
      this.data.list[this.data.updateIndex].icon = category.icon;
      this.setData({
        category: {},
        updateIndex: -1,
        addImageSrc: '',
        addImageVisible: true,
        list: this.data.list,
        maskVisible: false,
        confirmVisible: false,
        pureAdd: true
      })
    } else {
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      });
    }
  },
  /**
   * 添加之后
   */
  addAfter: function (res, category) {
    wx.hideLoading();
    if (res._id) {
      category._id = res._id;
      this.data.list.push(category);
      this.setData({
        category: {},
        pureAdd: false,
        maskVisible: false,
        confirmVisible: false,
        list: this.data.list,
        addImageSrc: ''

      });


    } else {

    }

  },
  /**
   * 上传图标
   */
  uploadFile: function (src) {
    var cloudName = app.getCloudName(src);
    return app.uploadFile(src, 'image/category/' + cloudName);
  },
  isExist: function (name) {
    var where = {
      name: name
    }
    return dbUtils.count(this.data.table, where);
  },
  /**
   * 删除
   * 检测当前分类下是否有商品，有商品的话，不能删除
   * 没有商品的话，检查是否有子分类，有子分类的话 直接删除
   */
  tapDel: function () {
    var that = this;
    wx.showModal({
      title: '删除提示',
      content: '将会删除该分类下所有规格，如果该分类下有商品将删除失败',
      cancelText: '取消',
      confirmText: '删除',
      confirmColor: '#FF0000',
      success: function (res) {
        if (res.confirm) {
          that.hasGoods();
        } else if (res.cancel) {

        }
      }
    })
  },
  hasGoods: function () {
    var _id = this.data.list[this.data.updateIndex]._id;
    app.showLoadingMask('删除中');
    var that = this;
    dbUtils.count('goods', { subcategory: _id })
      .then(res => {
        if (res.total == 0) {
          // 准备删除
          that.toDelCategory();
        } else {
          app.showErrNoCancel('删除失败', '该分类下有商品无法删除');
        }
      }).catch(error => {
        console.error(error);
        app.showErrNoCancel('删除失败', error.errMsg);
      })
  },
  toDelCategory: function () {

    var category = this.data.list[this.data.updateIndex];
    wx.cloud.callFunction({
      name: 'delSubcategory',
      data: {
        _id: category._id
      }
    }).then(res => this.delAfter(res))
      .catch(error => {
        console.error(error);
        app.showErrNoCancel('删除错误', error.errMsg);
      })
  },
  delAfter: function (res) {
    console.log(res);
    wx.hideLoading();
    var index = this.data.updateIndex;
    if (res.result.stats.removed != 0) {
      wx.showToast({
        title: '删除成功',
      });
      this.data.list.splice(index, 1);
      this.setData({
        list: this.data.list,
        category: {},
        maskVisible: false,
        confirmVisible: false,
        addImageSrc: false,
        addImageVisible: true,
        pureAdd: true
      })
    } else {
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
    }
  }
})