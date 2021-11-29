# 什么是redis？
redis是一个内存中的数据结构存储系统，可以用作数据库,缓存和消息队列中间件。Redis是C语言开发的一个开源的高性能键值对的内存数据库，可以用作数据库，缓存，消息中间件
等等。
它是一种NoSQL非关系型数据库
redis 作为一个内存数据库，有以下有点：
* 性能优秀，数据存在内存中，读写速度非常快，支持并发10wQPS
* 单进程单线程，是线程安全的，采用IO多路复用机制
* 丰富的数据类型，支持： 字符串，散列，列表，集合，有序集合等
* 支持数据持久化，可以将内存数据保存在磁盘中，重启时加载
* 主从复制，哨兵，高可用
* 可以用作分布式锁
* 可以作为消息中间件，支持发布订阅

## 5种数据类型
在抄之前，有必要先来了解一下Redis内部内存管理是如何描述这5种数据类型的
![image.png](https://upload-images.jianshu.io/upload_images/21849446-466ab934e713a36e.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

首先，Redis内部使用一个RedisObject对象来表示所有的key和value
RedisObject 最主要的信息如上图所示：type表示一个value对象具体是何种数据类型，encoding是不同数据类型在Redis内部的存储方式
比如：type = string baioshi value 存储的是一个普通字符串，那么encoding可以是raw 或者 int


* 字符串 string
string 是redis最基本的类型，可以理解成与Memcached一模一样的类型，一个Key对应一个value。value不仅是String,也可以是数字
string 类型是二进制安全的，意思是Redis的string类型可以包含任何数据，比如jpg图片或者序列化的对象，string类型的值最大能存储512M

* 散列 hashe
Hash是一个键值（key-value）的集合，Redis的Hash是一个string的key和value的映射表，Hash特别适合存储对象，常用命令：hget，hset，hgetall等

* 列表 list
List列表是简单的字符串列表，按照插入顺序排序，可以添加一个元素到列表的头部或者尾部，常用的命令：lpush, rpush, lpop, rpop, lrange(获取列表片段)
应用场景：List应用场景非常多，惹事Redis最重要的数据结构之一，比如说，B站的关注列表，粉丝列表都可以用List来实现
数据结构：List就是链表，可以用来当消息队列用，Redis提供了List的Push和Pop操作，还提供了操作某一段的API，可以直接查询或者删除某一段的元素。
实现方式：Redis List的实现是一个双向链表，既可以支持反向查找和遍历，更方便操作，不过带来了额外的内存开销。

* 集合 set
Set 是String类型的无序集合，集合是通过hashtable实现的，Set中的元素没有顺序的，而且是没有重复的，常用命令：sadd，spop， smembers, sunion
* 有序集合 sorted sets

**重点：列表缓存**
***./lib/index.js***
