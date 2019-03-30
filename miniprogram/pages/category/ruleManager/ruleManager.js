// 规格管理
const app = getApp();
const db = wx.cloud.database();
const dbUtils = require('../../../js/DB.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    category: {},
    list: [],
    rule: {},
    updateIndex: -1,
    pageIndex: 0,
    pageSize: 20,
    table: 'rule',
    maskVisible: false,
    confirmVisible: false,
    pureAdd: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(options);
    this.data.category._id = options._id;
    this.data.category.parent = options.parent;
   
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    app.showLoadingMask('加载中');
    var that = this;

    dbUtils.load(this.data.table, {
        subcategory: this.data.category._id
      }, this.data.pageSize, this.data.pageIndex, 'name', 'asc')
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
  onReachBottom: function() {
    if (this.data.maskVisible) {

      return;
    }
    if (this.data.list.length < this.data.pageSize) {
      return;
    }
    var that = this;
    app.showLoadingMask('加载中')
    dbUtils.load(this.data.table, {
        subcategory: this.data.category._id
      }, this.data.pageSize, this.data.list.length, 'name', 'asc')
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
   * 弹出添加按钮
   */
  tapToAdd: function() {
    this.setData({
      maskVisible: true,
      confirmVisible: true,
      pureAdd: true
    });
  },
  /**
   * 点击规格，弹出修改窗框
   */
  tapRule: function(event) {
    var rule = event.currentTarget.dataset.rule;
    var index = event.currentTarget.dataset.index;
    this.setData({
      maskVisible: true,
      confirmVisible: true,
      rule: rule,
      updateIndex: index,
      pureAdd: false
    });

  },
  /**
   * 长按规格 询问删除
   */
  longtapRule: function(event) {
    console.log(event);

    var rule = event.currentTarget.dataset.rule;
    var index = event.currentTarget.dataset.index;
    var that = this;
    wx.showModal({
      title: '删除确认',
      content: '删除\'' + rule.value + '\'?\n不会影响已使用该规格的商品',
      cancelText: '取消',
      confirmColor: '#FF0000',
      confirmText: '删除',
      success: function(res) {
        if (res.confirm) {
          that.delRule(rule, index);
        } else if (res.cancel) {

        }
      }
    })
  },
  /**
   * 取消修改弹框
   */
  tapMask: function() {
    this.setData({
      maskVisible: false,
      confirmVisible: false,
      rule: {},
      updateIndex: -1,
      pureAdd: true
    })
  },
  /**
   * 删除 规格
   */
  delRule: function(rule, index) {
    var that = this;
    app.showLoadingMask('删除中');
    dbUtils.remove(this.data.table,rule._id).then(res => {
      console.log(res);
      wx.hideLoading();
      if (res.stats.removed == 0) {
        wx.showToast({
          title: '删除失败！',
        })
        return;
      }
      wx.showToast({
        title: '删除成功',
      });

      that.data.list.splice(index, 1);
      that.setData({
        list: that.data.list
      });
    }).catch(error => {
      console.error(error);
      app.showErrNoCancel('删除失败',error.errMsg);
    })
  },
  /**
   * 提交修改
   */
  submitUpdate: function(event) {
    console.log(event);
    var ruleName = event.detail.value.ruleName;
    if (ruleName.length == 0) {
      wx.showToast({
        title: '名称不能为空',
        icon: 'none'
      });
      return;
    }
    if (this.data.pureAdd && this.data.rule.name == ruleName) {
      wx.showToast({
        title: '没做任何修改',
        icon: 'none'
      });
      return;
    }
    var that = this;
    if (this.data.pureAdd) {
      var rule = {
        subcategory: this.data.category._id,
        category: this.data.category.parent,
        value: ruleName
      }
     
      app.showLoadingMask('添加中');
      this.isExist(rule.value).then(res=>{
          if(res.total!=0){
            wx.hideLoading();
            wx.showToast({
              title: '名字已存在',
              icon:'none'
            });
            return;
          }
        dbUtils.add(that.data.table, rule)
          .then(res => that.addAfter(res, rule))
          .catch(error => {
            console.error(error);
            app.showErrNoCancel('添加失败', error.errMsg);
          });
      }).catch(error=>{
        console.error(error);
        app.showErrNoCancel('重名检索失败', error.errMsg);
      })
     
    } else {
      app.showLoadingMask('修改中');
      var _id = this.data.rule._id;
      this.isExist(ruleName).then(res=>{
        if (res.total != 0) {
          wx.hideLoading();
          wx.showToast({
            title: '名字已存在',
            icon: 'none'
          });
          return;
        }

        dbUtils.update(that.data.table, _id, {
          value: ruleName
        }).then(res => that.updateAfter(res, ruleName))
          .catch(error => {
            console.error(error);
            app.showErrNoCancel('修改失败', error.errMsg);
          });
      }).catch(error=>{
        console.error(error);
        app.showErrNoCancel('重名检索失败', error.errMsg);
      })
      
    }
  },
  /**
   * 添加之后
   */
  addAfter: function(res, rule) {
    wx.hideLoading();
    if (res._id) {
      wx.showToast({
        title: '添加成功'
      });
      rule._id = res._id;
      this.data.list.push(rule);
      this.setData({
        list: this.data.list,
        maskVisible: false,
        confirmVisible: false
      });
    } else {
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    }
  },
  /**
   * 修改之后
   */
  updateAfter: function(res, value) {
    wx.hideLoading();
    if (res.stats.updated == 0) {
      wx.showToast({
        title: '修改失败',
        icon: 'none'
      });
      return;
    }
    this.data.list[this.data.updateIndex].value = value;
    this.setData({
      list: this.data.list,
      maskVisible: false,
      confirmVisible: false,
      rule:{},
      updateIndex:-1,
      pureAdd:true
    });
  },
  /**
   * 是否存在
   */
  isExist:function(value){
    return dbUtils.count(this.data.table, { value: value });
   
  }
})