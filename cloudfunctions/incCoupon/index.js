// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  var _id = event._id;
  var coupon = await db.collection('coupon').doc(_id);
  if(coupon.num>1){
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