// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();
/**
 * 返回数据格式
 * 
 * list[
 * category{
 *  name:男装,
 * _id:alsd,
 * sub:[
 *  {
 *  name:T恤,
 *  _id:li,
 *  parent:ofa,
 *  rule:[
 *  {
 *  name:颜色,
 *  _id:lsd,
 *  category:sl,
 *  subcategory:okls
 * }
 * ]
 * }
 * ]
 * }
 * ]
 * 
 * 首先将所有的 category 列出来。
 * 遍历category 列出来所有的sub;
 * 遍历 sub 列出来 rule
 */
var getSubcategory =  function(category) {
  return db.collection('subcategory').where({
    parent: category._id
  }).get();
}
var listRule = function(sub) {
  return db.collection('rule').where({subcategory:sub._id}).get();
}
// 云函数入口函数
exports.main = async(event, context) => {
  var res = await db.collection('category').get();
  var data = res.data;
   for(var i=0;i<data.length;i++){
     var category = data[i];
     var response = await getSubcategory(category);
      var subData = response.data;
      if(subData.length>0){
        for(var k =0;k<subData.length;k++){
          var sub = subData[k];
          var response1 = await listRule(sub);
          var ruleData = response1.data;
          sub.rule = ruleData;
          subData[k] = sub;
        }
      }
     category.sub = subData;
     data[i] = category;
   }
  return data;
  
}