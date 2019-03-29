// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = wx.cloud.database();
// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  var _id = event._id;
  //
  db.collection('subcategory').where({
    parent:_id
  }).get().then(res=>{
    if(res.data.length==0){
      return;
    }
    //删除附属的rule
    
  }).catch(error=>{
    console.error(error);
  });
  
  return db.collection('subcategory').where({
    parent: _id
  }).remove().then(res => db.collection('category').doc(_id).remove());
  db.collection

}