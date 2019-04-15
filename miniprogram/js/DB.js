const db = wx.cloud.database();
/**
 * 添加数据
 * resolve 返回的 res._id
 */
var add = function(table,object){
  const db = wx.cloud.database();
 return  db.collection(table).add({
    data:object
  });
}
var load = function(table,where,limit,skip,orderFieldName,orderBy){
 return db.collection(table)
.where(where)
.orderBy(orderFieldName,orderBy)
.limit(limit)
.skip(skip)
.get();
}
/**
 * 
 * {total: 1, errMsg: "collection.count:ok"}
 */
var count = function(table,where){
 return  db.collection(table).where(where).count();
}
var update= function(table,_id,data){
  
  return db.collection(table).doc(_id).update({data:data});
}
var del = function(table,_id){
 return db.collection(table).doc(_id).remove();
}

module.exports = {
  add:add,
  load:load,
  count:count,
  update:update,
  remove :del
}