﻿# zigbee-http

## 启动

```javascript
npm start   //本地环境,其他环境查看package.json
```

## 服务

- [localhost:3000](localhost:3000)


## 插件

| 名称      |     描述 |
| :-------- | :--------|
| mongoose    |   mongodb数据库存储 |
| redis    |   缓存和进程间通信 |
| socket.io    |   websocket通信 |
| bootstrap    |   响应式设计 |
| bootstrap-table    |   丰富的表格形式 |
| metisMenu   |   菜单 |
| angular   |   前端库 |
| chart | |
| angular-chart   |   丰富的图表形式 |

## 工具

| 名称      |     描述 |
| :-------- | :--------|
| Redis DeskTop Manager | Redis可视化工具 |
| MongoChef Core   |   Mongodb可视化工具(Robomongo对于mongodb 3.0以上版本无效) |


## 目录

```javascript
.
├── client                      # 客户端
│   ├── css/                    # 样式
│   ├── imgs/                   # 图片
│   ├── js/                     # 脚本
│   │  ├── angular/             # angular应用
│   │  │  ├── controllers/   	# angular控制器
│   │  │  ├── services/	        # angular服务
│   │  │  └── webapp.js/	 	# angular自动引导应用程序
│   │  └── sockets/			  # sockets应用
│   └── lib                     # 插件
├── config                      # 配置
│   ├── config.js               # 参数配置
│   └── index.config.js         # 导出配置
├── server                      # 服务端
│   ├── constants/              # 常量
│   ├── controllers/            # 逻辑
│   ├── events/                 # 事件(有问题，移除，使用socket全局变量)
│   ├── models/                 # 数据
│   ├── routes/                 # 路由
│   ├── sockets/                # socket.io
│   ├── pubs/                   # 发布
│   └── subs/                   # 订阅
├── views                       # 视图
└── app.js                      # 启动脚本

```


## 全局变量
| 变量   			|     说明 |
| :-------- 			| :--------|
|  global.redis_sub 		|  http服务的redis发布客户对象，config/config.js |
|  global.redis_pub 		|  http服务的redis订阅客户对象，config/config.js |
|  global.global.socket_index 	|  index.html保持的socket通信对象 |
|  global.global.socket_doorList|  doorList.html保持的socket通信对象 |


## socket.io redis通信对象格式（基站状态获取除外，因为基站状态是tcp服务主动推送）

### 发送对象数据格式

| 属性   			|     说明 |
| :-------- 			| :--------|
|  baseIP			|  发送命令的基站IP地址 |
|  cmd 				|  发送的命令类型 |
|  data				|  发送的数据 |
|  doorId			|  门锁的16位网络短地址 |


### 反馈对象数据格式

| 属性   			|     说明 |
| :-------- 			| :--------|
|  baseIP			|  发送命令的基站IP地址 |
|  cmd 				|  发送的命令类型 |
|  data				|  发送的数据 |
|  doorId			|  门锁的16位网络短地址 |
|  httpStatus			|  反馈状态 |

>提示：如果反馈的data=[0x01,0xFF]则表明基站不存活，不能进行tcp通信,通常情况下data都不可能是0x01,0xFF.


### 命令类型cmd

| 数据  			|     说明 |
| :-------- 			| :--------|
|  0x01				|  获取门锁关联列表 |
|  0x02                         |  远程开门 |





## 问题

| 类型      |     说明 |
| :-------- | :--------|
| redis发布订阅    |  在Redis中，一旦一个client发出了SUBSCRIBE命令，它就处于监听的模式，此时除了SUBSCRIBE， PSUBSCRIBE，UNSUBSCRIBE，PUNSUBSCRIBE这4条命令之外的所有其它命令都不能用，所以需要使用两个client. |
| event事件   |  不知什么原因导致了监听器建立了多个，所以socket发送给客户端的redis数据（来自于tcp服务端）重复了好多次，所以去掉了事件触发，采用全局变量socket通信对象的方式，追加原因：每次页面刷新会导致执行sockets-> index.js触发页面的socket的connection事件，在事件里添加了监听函数....socket并不是一直长连着的，socket可能断开重连 |
| mongodb   | 数据库操作时，尽量给字段赋值默认值，这很重要,追加：去掉tcp服务器的数据库操作，统一放在http服务里处理，数据操作的统一性 |
| redis发布订阅  | redis发布和订阅是无状态的，没有办法检测发布成功和发布失败，例如tcp服务进程如果挂了，那么http的发布消息仍然是可以发布的，只是tcp服务程序挂了之后没有在订阅而已，那么客户端如何检测tcp服务进程挂了呢（最终程序做了守护进程，如果再加上pm2，按道理来说是不会挂进程的，但是如果本身人为就没有开启tcp进程时，客户端如何检测tcp进程没有开启呢）？追加：先尝试采用心跳机制，tcp服务器使用定时器定时1s产生一个心跳时间存入redis，用于表明tcp服务进程的存活时间，http去读取这个存活时间，如果当前时间-存活时间>tcp定时器定时时间，则判断tcp进程挂了！需要注意的是最后采用多进程，那么多进程会每一个进程去定时记录存活时间，所以真正在存活时记录的存活时间肯定小于定时器的定时时间，不过这个应该不影响存活判断 |
| 定时器  |  angularjs的$timeout总是会返回一个promise对象，一般情况下最好使用$timeOut.cancel(promise)在合适的情况下取消定时器 |
| global.global.socket_index和global.global.socket_doorList  |  在使用时，需要确保sockets/index.js中的connection事件先触发，才会成功，例如刚刷新页面的时候如果想使用socket.io通信，那么需要注意可能connection事件的触发时间在页面刷新请求之后，在刷新请求的时候想要发送socket通信数据可能会失败！（也有成功的概率，比较少） |






## 进度记录

| 日期      |     进度 |
| :-------- | :--------|
| 2016/11/01    |  socket.io成功 |
| 2016/11/06    |  redis订阅成功 |
| 2016/11/07    |  redis订阅数据成功通过socket.io发送至浏览器 |
| 2016/12/07    |  修复windows环境运行问题 |
| 2016/12/26    |  添加了获取门锁关联列表页面 |
| 2016/12/27    |  使用angular实现了控制器，并实现了socket不同的页面之间的连接，实现了redis发布，成功发布命令给tcp程序 |
| 2016/12/28    |  可以发送命令给基站，并从基站获取数据显示到网页客户端，通过socket和redis实现，添加了开门命令，可以远程进行开门 |
| 2016/12/29    |  远程开门得到反馈或者超时触发开门失败，更新了协议的实现，获取关联地址时获取了MAC地址和网络地址，获取基站下每一把门锁的信号强度，电池电量以及MAC地址等 |
| 2016/12/30    |  添加了操作员账号注册功能，添加了操作的删除和修改功能 |
| 2016/12/31    |  添加了基站的连接和断开状态数据库存储，添加了基站断开的检测功能，优化了获取门锁列表的数据库处理 |
| 2017/01/01    |  添加了tcp通讯程序存活的判断和客户端显示 |

