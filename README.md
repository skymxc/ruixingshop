# 瑞星购物

简单的购物商场

包括后台商品管理，入口在“我的”。



## 首页

banner 从 物品表按照销量排序拉取前5个。（可以考虑建一个banner表，专门存储推广商品）

商品随机排序（销量，价格，名字）从商品表拉取，每次20个上拉加载更多。



## 待优化
### 发布优惠卷
- 使用范围的选择，目前在选择范围时，是动态加载子分类的，但是 loading没有mask 住 picker,考虑使用 picker-view 这样在 加载时能被 mask 住，不会出现错误

# Log
## 2019.5.8
- 修复更改地址没有更改本地缓存的问题
- 修复购物车不选择任何商品时的总价 显示 问题
- 修复云函数订单处理时没有优惠卷出单失败的问题
## 2019.5.7
- 结算时使用优惠卷
## 2019.5.3
- 我的优惠卷
## 2019.4.28
- 删除优惠卷
- 领取优惠卷界面搭建
## 2019.4.27
- 优惠卷管理，删除优惠卷 界面搭建
- 发布优惠卷
## 2019.4.25
- 我的评价 
- 进入评论前判断是否已经评论过了
- 评论完成后反写入订单 （逻辑上不恨严谨）
## 2019.4.23
- 收货地址 新建，删除，编辑
- 结算选择地址
## 2019.4.22
- 收货地址管理 界面搭建
## 2019.4.21 
- 我的关注
- 评价商品
## 2019.4.20
- 我的订单
## 2019.4.18
- 个人中心 界面搭建
## 2019.4.16
- 搜索 ，修复清楚筛选后没有加载商品的问题
- 订单详情 确认收货
## 2019.4.15
- 购物车 结算，删除，更改数量，全选，单选
## 2019.4.14
- 确认订单，生成订单
- 订单详情 还不能确认收货
- 购物车 界面搭建
## 2019.4.13
- 确认订单 界面搭建，添加地址
- 自定义地址表单组件
## 2019.4.12
- app.js 修复登陆时openid 的获取
- 商品详情 购物车的操作，数量获取，添加。
## 2019.4.11
- 商品详情 登陆，关注
## 2019.4.10
- 商品详情，选择规格
- 首页，搜索到详情的入口
### 2019.4.9
- 商品详情，展示数据
### 2019.4.8
- 搜索页分类筛选，名字模糊查询
- 首页 上拉设置最低间隔时间
- 首页及全部分类可以携带参数进入搜索页
### 2019.4.7
- 搜索页布局搭建，数据获取

### 2019.4.6
- 所有的 image 全部使用默认 mode
- 首页获取及展示数据
- 全部分类

### 2019.4.5

- 修改 addGoods 增加封面图片一项
- 修改 addGoods 分类下没有子分类时将 picker里的二级分类清空
- 修改 category 在名称查重时添加条件，只有在同一分类下才不允重复。
- index 开始写 banner，category。
