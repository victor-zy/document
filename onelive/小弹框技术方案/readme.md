# 小弹框 技术方案

* [需求文档](https://upyun.feishu.cn/wiki/wikcnWw1sC1DAOrLpANuAKz1ZLb)
* [原型图](https://ln16hr.axshare.com)

## 介绍
* 在manage后台中，新增一个活动下的弹框管理，可以在用户观看活动时弹出相应的弹框。

## 增加功能

### manage后台
 * 创建小弹框
 * 编辑小弹框
 * 推送小弹框
 * 查看小弹框列表信息
 * 删除小弹框

### 观看页
 * 查看单个小弹框配置信息

### ad后台
 * 新增小弹框功能的配置信息

## 数据表结构
`activity_snackbar` 活动小弹框
|   id  |   activityId  |   scene   |   heding  |   countdown   |   image   |   link    |   remark  |
|---|---|---|---|---|---|---|---|
| 主键  |   所属活动ID  |   使用场景    |   标题    |   弹框倒计时  |   图片    |   链接地址    |   其他信息    |
|   int |   int |   varchar(60) |   varchar(60) |   int |   varchar(255)    |   varchar(255)    |   text    |   

### 字段说明

`scene` 字段(**目前不在数据库做限制，在接口做枚举限制**) ：
|   字段值  |   说明    |
|---|---|
|   luckyDraw   |   外部抽奖    |
|   satisfactionSurvey  |   满意度调研  |
|   chatGroup   |   引导加群    |
|   focusOn |   引导关注    |
|   coupons |   优惠领券    |
|   ifream  |   弹框内嵌网页    |


## 接口列表

> 新增加接口
* ***创建小弹框*** `POST /api/v3/activity/{id}/snackbar`
* ***编辑小弹框*** `PUT /api/v3/activity/{id}/snackbar/{id}/edit`
* ***推送小弹框*** `PUT /api/v3/activity/{id}/snackbar/{id}/push`
    * 使用websocket发送弹框配置信息给前端
* ***查看小弹框列表信息*** `GET /api/v3/activity/{id}/snackbar`
* ***删除小弹框*** `DELETE /api/v3/activity/{id}/snackbar`
    * 日志记录这一操作
* ***查看单个小弹框信息*** `GET /api/v3/snackbar`
    * 留有备用，暂时无用

> 修改接口

* ***添加Agent的功能配置(小弹框)*** `PUT /api/admin/agent/{id}/package` 
    * isSnackbarEnabled: 是否开启小弹框功能