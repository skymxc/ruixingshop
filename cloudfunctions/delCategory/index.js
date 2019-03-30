// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  var _id = event._id;

  return db.collection('rule').where({
    category: _id
  }).remove().then(res => db.collection('subcategory').where({
    parent: _id
  }).remove().then(res => db.collection('category').doc(_id).remove()));


}