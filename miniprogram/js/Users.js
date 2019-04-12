const db = wx.cloud.database();
const tableCollect = 'collect';
const tableShopcar = 'shopcar'
var collect = function(goods,userid){
  var collect={
    goods_id:goods._id,
    user_id:userid
  }
  return db.collection(tableCollect).add({
    data:collect
  });
}
var collectCancel = function(_id){
  return db.collection(tableCollect).doc(_id).remove();
}
var getCollect = function(goods_id,openid){
 return db.collection(tableCollect).where({
    goods_id:goods_id,
    _openid:openid
  }).get();
}
var getShopcarCount = function(openid){
 
  return db.collection(tableShopcar).where({
    _openid:openid
  }).count();
}
var existInShopcar = function(shopcar){
  return db.collection(tableShopcar).where({
    goods_id:shopcar.goods_id,
    rule_value_array: shopcar.rule_value_array
  }).get();
}
var incShopCarNUm =function(_id,num){
  var _ = db.command;
 return db.collection(tableShopcar).doc(_id).update({
    data:{
      goods_num:_.inc(num)
    }
  });
}
/**
 * 现判断购物车里是不是已经有了这个东西，
 * 有了的话 直接将数量+1
 * 没有的话 再加入
 */
var addGoodsToShopcar =  function(shopcar){
  return new Promise((resolve,reject)=>{
    existInShopcar(shopcar).then(res=>{
      console.log('existInShopcar',res);
      if(res.data.length==0){//增加
        db.collection(tableShopcar).add({
          data: shopcar
        }).then(res =>{
          console.log('add Goods to shopcar ',res);
          if (typeof (res._id) !='undefined'){
              resolve({result:true,inc:true});
            }else{
            resolve({ result: false,inc:false });
            }
        }).catch(error => reject(error));
      }else{//更新
        incShopCarNUm(res.data[0]._id,shopcar.goods_num).then(res=>{
          console.log('incShopCarNUm ->',res);
          var result={
            result: res.stats.updated == 1,
            inc:false
          }
            resolve(result);
        }).catch(error=>reject(error));
      }
    }).catch(error=>reject(error));
  });

}
module.exports={
  addCollect:collect,
  removeCollect:collectCancel,
  getCollect:getCollect,
  getShopcarCount: getShopcarCount,
  addGoodsToShopcar:addGoodsToShopcar
}