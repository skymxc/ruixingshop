# 瑞星购物

简单的购物商场

包括后台商品管理，入口在“我的”。

ps:这个商场没有店铺的概念。

## 首页

banner 从 物品表按照销量排序拉取前5个。（可以考虑建一个banner表，专门存储推广商品）

商品随机排序（销量，价格，名字）从商品表拉取，每次20个上拉加载更多。

## Log

## 2019.4.7
- 搜索页布局搭建，数据获取

## 2019.4.6
- 所有的 image 全部使用默认 mode
- 首页获取及展示数据
- 全部分类

### 2019.4.5

- 修改 addGoods 增加封面图片一项
- 修改 addGoods 分类下没有子分类时将 picker里的二级分类清空
- 修改 category 在名称查重时添加条件，只有在同一分类下才不允重复。
- index 开始写 banner，category。
