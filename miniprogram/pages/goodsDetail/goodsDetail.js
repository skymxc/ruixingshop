// miniprogram/pages/goodsDetail/goodsDetail.js
/**
 * 
 * 在选择规格，点击底部按钮时，需要用户信息
 */
const app = getApp();
const db = wx.cloud.database();
const dbUtils = require('../../js/DB.js');
const userUtils = require('../../js/Users.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    chooseVisible: false,
    goods: {},
    rulestring: '',
    detailVisible: true,
    shopcarNum: 0,
    attetion: false,
    chooseNum: 1,
    chooseRule: false,
    addToShopcar: false,
    buy: false,
    selectedRuleArray: [],
    collect: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log('loadGoodsDetail->', options);
    this.data.goods._id = options._id
    this.loadGoods();

  },
  onShow: function() {
    //检查登陆
    if (app.globalData.logged) {
      this.getShopcar();
      this.getCollect();

      return;
    }
    var that = this;
    this.checkUserLogin().then(() => {
      //登陆成功了是否关注了
      that.getCollect();
      that.getShopcar();
    }).catch(() => this.navigateToAuthorize());
  },
  getShopcar: function() {

    var that = this;

    userUtils.getShopcarCount(app.globalData.openid)
      .then(res => {
        console.log('购物车', res);

        that.setData({

          shopcarNum: res.total
        })

      }).catch(error => app.showError(error, '购物车获取失败'));
  },
  getCollect: function() {
    var that = this;
    userUtils.getCollect(this.data.goods._id, app.globalData.openid)
      .then(res => {
        console.log('获取收藏', res.data)
        if (res.data.length > 0) {
          that.setData({
            attetion: true,
            collect: res.data[0]
          })
        }

      }).catch(error => app.showError(error, '检查商品关注'))
  },
  loadGoods: function() {
    app.showLoadingMask('请稍后');
    var that = this;
    db.collection('goods').doc(this.data.goods._id).get()
      .then(res => {
        wx.hideLoading();
        console.log('goods=>', res);
        var string = that.data.rulestring;
        if (res.data.rules) {
          if (res.data.rules.length > 0) {
            for (var i = 0; i < res.data.rules.length; i++) {

              var rule = res.data.rules[i];
              if (rule.array) {
                if (rule.array.length > 0) {
                  string += rule.value;
                }

              }

            }
            if (string.length > 0) {
              string += '等';
            }

          }
        }
        that.setData({
          goods: res.data,
          rulestring: string
        });
      }).catch(error => app.showError(error, '商品加载失败'));
  },
  tapPicture: function(event) {
    var index = event.currentTarget.dataset.index;
    app.showLoading('请稍后');
    wx.previewImage({
      urls: this.data.goods.pictures,
      current: index,
      success: function() {
        wx.hideLoading();
      }
    })
  },
  tapDetailChange: function() {
    this.setData({
      detailVisible: !this.data.detailVisible
    })
  },
  tapAttention: function() {
    console.log('关注-》', this.data.attetion)
    //是否登陆
    var that = this;
    var data = this.data;
    if (app.globalData.logged) {
      app.showLoadingMask('请稍后');
      if (this.data.attetion) {
        //取消关注

        userUtils.removeCollect(data.collect._id)
          .then(res => {
            console.log('取消关注', res);
            wx.hideLoading();
            if (res.stats.removed > 0) {
              data.collect = {};
              data.attetion = false;
              that.setData(data);
            } else {
              app.showToast('取消关注失败');
            }
          }).catch(error => app.showError(error, '取消关注失败'))
      } else {
        //添加关注
        userUtils.addCollect(data.goods, app.globalData.user_id)
          .then(res => {
            console.log('添加关注', res);
            wx.hideLoading();
            if (res._id) {
              var collect = {
                _id: res._id
              }
              data.collect = collect;
              data.attetion = true;
              that.setData(data);
            } else {
              app.showToast('关注失败');
            }
          }).catch(error => app.showError(error, '关注失败'))
      }
      return;
    }
    //需要登陆
    var that = this;
    this.checkUserLogin().then(() => {
      //登陆成功了
      that.tapAttention();
    }).catch(() => this.navigateToAuthorize());
  },
  tapShopcar: function() {
    console.log('购物车')
  },
  tapAddToShopcar: function() {
    console.log('加入购物车')
    //总库存
    var goods = this.data.goods;
    if (goods.store_num == 0) {
      app.showToast('没有库存了');
      return;
    }

    var rules = goods.rules;
    var array = new Array();
    var valueArray = new Array();
    var price = goods.price;
    if (rules && rules.length > 0) {
      var index = -1;
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        var selected = rule.selected;
        if (!app.checkEnable(selected)) {
          index = i;
          break;
        }
        var item = {
          rule_id: rule.rule_id,
          rule_name: rule.value,
          rule_value: rule.array[selected].value,
          rule_price: rule.array[selected].price
        }
        price += item.rule_price;
        array.push(item);
        valueArray.push(item.rule_value);
      }
      if (index != -1) {
        //选择
        this.setData({
          addToShopcar: true,
          chooseVisible: true
        })
        return;
      }
    }
    var shopcar = {
      goods_price: price,
      goods_num: this.data.chooseNum,
      goods_id: goods._id,
      goods_name: goods.name,
      rules: array,
      rule_value_array: valueArray
    }
    this.handleAddGoodsToShopcar(shopcar);

  },
  tapBuy: function() {
    //总库存
    var goods = this.data.goods;
    if (goods.store_num == 0) {
      app.showToast('没有库存了');
      return;
    }

    var rules = goods.rules;
    var array = new Array();
    var valueArray = new Array();
    var price = goods.price;
    if (rules && rules.length > 0) {
      var index = -1;
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        var selected = rule.selected;
        if (!app.checkEnable(selected)) {
          index = i;
          break;
        }
        var item = {
          rule_id: rule.rule_id,
          rule_name: rule.value,
          rule_value: rule.array[selected].value,
          rule_price: rule.array[selected].price
        }
        price += item.rule_price;
        array.push(item);
        valueArray.push(item.rule_value);
      }
      if (index != -1) {
        //选择
        this.setData({
          buy: true,
          chooseVisible: true
        })
        return;
      }
    }
    //下单
    console.log('下单');
  },
  tapMask: function() {
    this.setData({
      chooseVisible: false,
      chooseRule: false,
      buy: false,
      addToShopcar: false
    })
  },
  tapChooseRule: function() {
    this.setData({
      chooseVisible: true,
      chooseRule: true
    })

  },
  /**
   * 绑定了数量的输入值
   */
  inputChooseNum: function(event) {
    // console.log(event);
    var num = event.detail.value;
    if (num < 1) {
      num = 1;
    }
    this.setData({
      chooseNum: num
    })

  },
  /**
   * 选择 规格
   */
  tapRuleValue: function(event) {
    var dataset = event.currentTarget.dataset;
    var rule = dataset.rule;
    var valueindex = dataset.valueindex;
    var item = rule.array[valueindex];
    if (item.store == 0) {

      return;
    }
    var ruleindex = dataset.ruleindex;
    rule.selected = valueindex;
    this.data.goods.rules[ruleindex] = rule;

    this.setData({
      goods: this.data.goods
    })
  },
  /**
   * 增加到购物车
   * 这是在选择规格时的点击，确定选择完后。
   */
  tapToAddToShopcar: function() {
    //总库存
    var goods = this.data.goods;
    if (goods.store_num == 0) {
      app.showToast('没有库存了');
      return;
    }

    var rules = goods.rules;
    var array = new Array();
    var valueArray = new Array();
    var price = goods.price;
    if (rules && rules.length > 0) {
      var index = -1;
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        var selected = rule.selected;
        if (!app.checkEnable(selected)) {
          index = i;
          break;
        }
        var item = {
          rule_id: rule.rule_id,
          rule_name: rule.value,
          rule_value: rule.array[selected].value,
          rule_price: rule.array[selected].price
        }
        price += item.rule_price;
        array.push(item);
        valueArray.push(item.rule_value);
      }
      if (index != -1) {
        app.showToast('请选择' + rules[index].value);
        return;
      }
    }

    var shopcar = {
      goods_price: price,
      goods_num: this.data.chooseNum,
      goods_id: goods._id,
      goods_name: goods.name,
      rules: array,
      rule_value_array: valueArray
    }
    this.handleAddGoodsToShopcar(shopcar);

  },
  handleAddGoodsToShopcar: function(shopcar) {
    app.showLoadingMask('请稍后');
    var that = this;
    userUtils.addGoodsToShopcar(shopcar).then(res => {
      wx.hideLoading();
      if (res.result) {
        app.showToast('添加成功');
        that.tapMask();
        if (res.inc) {
          that.setData({
            shopcarNum: that.data.shopcarNum + 1
          })
        }

      } else {
        app.showToast('添加失败');
      }
    }).catch(error => app.showError(error, '添加失败'));
  },
  checkUserLogin: function() {
    return new Promise((resolve, reject) => {
      app.showLoadingMask("检查授权信息");
      app.checkUserPermission().then(res => {
        console.log('It is has userinfo permission? :' + res);
        if (res) {
          //授权过了 登陆
          app.login().then(() => {
            wx.hideLoading();
            //登陆成功 跳转
            resolve();
          }).catch(error => app.showErrNoCancel('登陆异常', error.errMsg));
        } else { //申请权限
          //去权限申请页
          reject();
        }
      }).catch(err => {
        console.log(err.errMsg);
        app.showErrNoCancel("检查权限异常", err.errMsg);
      });
    })
  },
  /**
   * 去申请获取用户信息的权限
   */
  navigateToAuthorize: function() {
    app.showLoadingMask('申请授权');
    wx.navigateTo({
      url: '../authorize/authorize',
      success: function() {
        wx.hideLoading();
      },
      fail: function(error) {
        app.showErrNoCancel('授权失败', error.errMsg);
      }
    })
  },
  tapChooseConfirm: function() {
    //总库存
    var goods = this.data.goods;
    if (goods.store_num == 0) {
      app.showToast('没有库存了');
      return;
    }

    var rules = goods.rules;
    var array = new Array();
    var valueArray = new Array();
    var price = goods.price;
    if (rules && rules.length > 0) {
      var index = -1;
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        var selected = rule.selected;
        if (!app.checkEnable(selected)) {
          index = i;
          break;
        }
        var item = {
          rule_id: rule.rule_id,
          rule_name: rule.value,
          rule_value: rule.array[selected].value,
          rule_price: rule.array[selected].price
        }
        price += item.rule_price;
        array.push(item);
        valueArray.push(item.rule_value);
      }
      if (index != -1) {
        app.showToast('请选择' + rules[index].value);
        return;
      }
    }

    if (this.data.addToShopcar) {
      var shopcar = {
        goods_price: price,
        goods_num: this.data.chooseNum,
        goods_id: goods._id,
        goods_name: goods.name,
        rules: array,
        rule_value_array: valueArray
      }
      this.handleAddGoodsToShopcar(shopcar);
    } else if (this.data.buy) {
      console.log('下单');
    }
  },
  tapChooseNumReduce:function(){
    if(this.data.chooseNum==1) return;
    this.setData({
      chooseNum:this.data.chooseNum-1
    })
  },
  tapChooseNumAdd:function(){
    this.setData({
      chooseNum: this.data.chooseNum +1
    })
  }
})