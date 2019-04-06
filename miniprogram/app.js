//app.js

App({
  onLaunch: function() {

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
        env: 'te-85cb20'
      })
    }

    this.globalData = {}
  },
  /**
   * 检查 当前是否拥有某项权限
   * @scope 某项权限
   * resolve(auth) auth:true?false;
   */
  checkPermission: function(scope) {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: res => {
          resolve(res.authSetting[scope]);
        },
        fail: error => {
          reject(error)
        }
      })
    });
  },
  /*
   **
   * 检查 用户信息是否授权
   */
  checkUserPermission: function() {
    return this.checkPermission('scope.userInfo');
  },
  showErr: function(title, msg, showCancel) {
    wx.hideLoading();
    wx.showModal({
      title: title,
      content: msg,
      showCancel: showCancel
    });
  },
  showErrNoCancel: function(title, msg) {
    this.showErr(title, msg, false);
  },
  showLoadingMask(title) {
    wx.showLoading({
      title: title,
      mask: true
    })
  },
  showLoading(title) {
    wx.showLoading({
      title: title,
    })
  },
  /**
   * 获取用户的openid
   * 获取成功后，直接赋予 globalData.openid;
   * resolve(globalData.openid);
   */
  getOpenid: function() {
    var that = this;
    this.showLoadingMask('登陆中');
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login'
      }).then(res => {
        that.globalData.openid = res.openid;
        wx.hideLoading();
        resolve();
      }).catch(err => {
        console.log(err);
        reject(err)
      });
    });

  },
  /**
   * 获取用户信息
   * 在获取成功后直接赋予 app.globalData.userInfo;
   * resolve();
   */
  getUserInfo: function() {
    var that = this;
    this.showLoadingMask('获取信息中');
    return new Promise((resolve, reject) => {
      wx.getUserInfo({ //获取用户信
        success: response => {
          wx.hideLoading();
          that.globalData.userInfo = response.userInfo;
          that.globalData.logged = true;
          resolve();
        },
        fail: err => {
          reject(err);
        }

      })
    });
  },
  /**
   * 用户是否存在于数据库
   */
  userExistInDB: function() {
    var that = this;
    const db = wx.cloud.database();
    this.showLoadingMask('更新用户信息');
    return new Promise((resolve, reject) => {
      var db = wx.cloud.database();
      db.collection('user')
        .where({
          _openid: that.globalData.openid
        }).get().then(res => {
          wx.hideLoading();
          resolve(res.data);
        }).catch(err => {
          console.error(err);
          reject(err)
        });
    });

  },
  /**
   * 因为 nickName 和 province 无法直接存储到云数据库，所以这里专门拿出来了。
   */
  countDBUser: function(data) {
    console.log(data);
    var that = this;
    var user = {
      info: this.globalData.userInfo,
      manager: false,
      nickName:this.globalData.userInfo.nickName
    }

    const db = wx.cloud.database();
    this.showLoadingMask('检索信息');
    return new Promise((resolve, reject) => {

      if (data.length == 0) {
        console.log('插入用户信息');
        console.log(user);
        db.collection('user').add({
          data: user
        }).then(res => {
          that.globalData.user_id = res._id;
          wx.hideLoading();
          resolve();
        }).catch(error=>reject(error));
      } else {
        that.globalData.user_id = data[0]._id;
        console.log('更新用户信息')
        console.log(user.info);
        db.collection('user').doc(data[0]._id).update({
          data: {
            info: user.info,
            nickName:user.nickName
          }
        }).then(res => {
          wx.hideLoading();
          console.log('update user result =>:' );
          console.log(res);
          resolve();
        }).catch(error=>reject(error));
      }
    });

  },
  /**
   * 登陆
   * 前提条件是有获取用户信息的权限
   * 1. 获取用户信息 =>globalData.userInfo
   * 2. 获取用户openid => globalData.openid
   * 3. 检查数据库是否存在user => (updateUser(),addUser())
   */
  login: function() {
    var that = this;
    this.showLoadingMask('登陆中')
    return this.getUserInfo()
      .then(() => that.getOpenid())
      .then(() => that.userExistInDB())
      .then(data => that.countDBUser(data));
    // .then(() => {

    // })
    // .catch(app.showErrNoCancel('登陆异常', error.errMsg));
  },
  navigateTo:function(url){
    this.showLoadingMask('请稍后');
    var that = this;
    wx.navigateTo({
      url: url,
      success:function(){
        wx.hideLoading();
      },
      fail:function(error){
          that.showErrNoCancel('跳转失败',error.errMsg);
      }
    })
  },
  /**
   * 获取上传文件的 cloudname
   */
  getCloudName:function(src){
    var split = src.split('.');
    //时间戳
    var time = new Date().getTime();
    var cloudName = this.globalData.openid + '_' + time + '.' + split[split.length - 1];
    return cloudName;
  },
  /**
   * 上传文件
   */
  uploadFile: function (src,cloudPath) {
    
    return new Promise((resolve,reject)=>{
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: src,
        success:function(res){
          console.log(res);
          if (res.statusCode == 200) {
            resolve(res.fileID);
          }else{
            var error={
              errMsg:'上传失败('+res.statusCode+')'
            }
            reject(error);
          }
        
        },
        fail:function(error){
          var err = {
            errMsg: error.errMsg + '(' + error.errCode + ')'
          }
          console.log(error);
          reject(err);
        }
      });
    }); 

  },
  showToast:function(text){
    wx.showToast({
      title: text,
      icon: 'none'
    });
    
  },
  showError:function(error,txt){
   console.error(error);
   app.showErrNoCancel(txt,error.errMsg);
  },
  getRandomNum:function(min,max){
  var range = max-min;
  var rand = Math.random();
  return min+Math.round(rand*range);
  }
})