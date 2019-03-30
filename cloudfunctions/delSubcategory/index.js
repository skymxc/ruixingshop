// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  var _id = event._id;
  //删除所有的规格
  return db.collection('rule').where({
    subcategory:_id
  }).remove()
  .then(res=>db.collection('subcategory').doc(_id).remove());

}