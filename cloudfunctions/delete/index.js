// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()
  const collection = event.collection;
  const opr = event.opr;
  const where = event.where;
  if ('byId' == opr) {
    var _ = db.command;
    return db.collection(collection).where({
      _id: _.in(where._id)
    }).remove();
  }
  return db.collection(collection).where(where).remove();

}