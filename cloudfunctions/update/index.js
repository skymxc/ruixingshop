// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
  var collection = event.collection;
  var data = event.data;
  var where = event.where;
  var opr = event.opr;
  if('byId'==opr){
    var _ = db.command;
    return db.collection(collection).where({
      _id:_.in(where._id)
    }).update({data:data});
  }
  // console.log(collection,where,data);
  return db.collection(collection).where(where).update({
    data: data
  });
}