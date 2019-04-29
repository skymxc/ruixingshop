// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
 
  var _id = event._id;
  var res = await db.collection('coupon').doc(_id).get();
  if(res.data.num>1){
    var _ = db.command;
    var result = await db.collection('coupon').doc(_id).update({
      data: {
        num: _.inc(-1)
      }});
      console.log('result->',result)
      return result.stats.updated==1;
  }
  return false;
}