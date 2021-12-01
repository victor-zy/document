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
List列表是简单的字符串列表，按照插入顺序排序，可以添加一个元素到列表的头部或者尾部;
常用的命令：lpush, rpush, lpop, rpop, lrange(获取列表片段)
应用场景：List应用场景非常多，惹事Redis最重要的数据结构之一，比如说，B站的关注列表，粉丝列表都可以用List来实现
数据结构：List就是链表，可以用来当消息队列用，Redis提供了List的Push和Pop操作，还提供了操作某一段的API，可以直接查询或者删除某一段的元素。
实现方式：Redis List的实现是一个双向链表，既可以支持反向查找和遍历，更方便操作，不过带来了额外的内存开销。

* 集合 set
Set 是String类型的无序集合，集合是通过hashtable实现的，Set中的元素没有顺序的，而且是没有重复的，常用命令：sadd，spop， smembers, sunion(并集)，sinter(交集)， sdiff(差集)
应用场景：Redis Set对外提供的功能和list一样是一个列表，特殊之处在于Set是自动去重的，而且Set提供了判断某个成员是否在一个Set集合中。

* 有序集合 sorted sets
zest 和 set一样是string类型元素的集合，而且不允许重复的元素。常用命令：zadd， zrange，zrem， zcard等
使用场景：sorted set 可以通过用户额外提供一个优先级(score)的参数来为成员排序，并且是插入有序的，（自动排序）
当你需要一个有序的并且不重复的集合列表，那么可以选择sorted set结构
和set相比，sorted set关联了一个double类型权重的参数score，使得集合中的元素能够按照score进行有序排列，Redis正式通过分数来为集合中的成员进行从大到小的排序

实现方式： Redis sorted set 的内部使用HashMap和跳跃表来保证数据的存储和有序，HashMap里放的是成员到score的映射
而跳跃表里存放的是所有的成员，排序依据是HashMap里存放的score，使用跳跃表的结构可以获得比较高的查询效率，并且在实现上比较简单

**数据类型应用场景**

| 类型  |   简介    |   特性    |   场景    |
|---|---|---|---|
|   string  |   -    |   可以包含任何数据，比如jpg图片或者序列化对象 |   -   |
|   hash    |   键值对集合，即编程语言中的map类型   |   适合存储对象，并且可以像数据库中的update属性一样只修改某一项的属性值    |   存储，读取，修改用户属性    |
|   list    |   链表（双向链表）    |   增删快，提供了操作某一元素的api |   最新消息排行；消息队列  |
|   set     |   hash表实现，元素不重复  |   添加，删除，查找的复杂度都是O(1)，提供了求交集，并集，差集的操作    |   共同好友；利用唯一性，统计访问网站的所有IP  |
|   sorted set  |   将set中的元素增加一个权重参数score，元素按score有序排列     |   数据插入集合的时候，已经天然排序好了    |   排行榜；带权重的消息队列    |


**重点：列表缓存**
***./lib/index.js***
