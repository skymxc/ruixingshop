// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database();

/**
 * 将要买的商品都列出来，主要是看库存
 */
var listGoods = function(goodsList){
  var array = new Array();
  for(var i=0;i<goodsList.length;i++){
    array.push(goodsList[i].goods_id);
  }
  var _ = db.command;
  return db.collection('goods').where({
    _id: _.in(array)
  }).get();
}
var handleOrder = function(order){
  order.createDate = db.serverDate();
  order.payDate = db.serverDate();
  order.deliveryDate = null;

 return db.collection('order').add({ data: order });
}
var  handleGoods =function(goods,storenum){
  var _ = db.command;
 return db.collection('goods').doc(goods._id).update({
    data:{
      store_num:_.inc(storenum*-1),
      sale_num:_.inc(storenum)
    }
  });
}
var invalidOrder =function(order){
  return db.collection('order').doc(order._id).update({
    state:-1
  })
}
// 检查 商品是否有库存 这里没有那么严谨，，没有针对每个属性规格做库存判断，只对总库存做检查
/**
 * result.code = 0 购买成功 result.order 是订单信息
 * result.code = -1 有不存在的； result.index 是下标
 * result.code =-2 ;出错 result.error 是错误消息
 * result.code = -3 ;出单失败 ;result.msg 是出单失败提示
 * 
 * 
 * 1. 获取所有商品，检查商品库存
 * 2. 下单，保存到order数据表
 * 3. 处理所有商品的库存 自减
 * 4. 返回
 */
exports.main = async (event, context) => {
  var result = {}
try{
  var order = event.order;
  var _ = db.command;
  var goodsList = await listGoods(order.goodsList);
  var index= -1;
  for(var i=0;i<goodsList.length;i++){
      var goods = goodsList[i];
      var num = order.goodsList[i].goods_num;
    if (goods.store_num<num){
      index = i;
      break;
    }
  }
  if(index!=-1){
    result.code = -1;
    result.index = index;
    return result;
  }

  //开始出单
  var res = await handleOrder(order);
  if(res._id){
   
    //处理 库存
    var sotreIndex= -1;
    for(var i=0;i<goodsList.length;i++){
      var store = order.goodsList[i].goods_num;
      var num = new Number(sotre);
     var handleRes = await handleGoods(goodsList[i],num);
      console.log(handleRes);
     if(handleRes.stats.updated!=1){
       sotreIndex = i;
        break;
     }
    }
    if(sotreIndex==-1){
      //成功了
      order._id = res._id;
      result.code = 0;
      result.order = order;
    }else{
      //出单失败 将刚才的订单废了吧
      var invalidRes = await invalidOrder(roder);
      console.log('作废订单',order,invalidRes);
      result.code = -3;
      result.msg = goodsList[index]+' 出单失败';
    }
  }else{
    result.code = -3;
    result.msg = '下单异常';
  }
}catch(error){
  console.log('处理订单失败！',error)
  result.code = -2;
  result.error = error;
}
  return result;
}