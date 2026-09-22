# 我的健康 V2.6

Flat PWA，核心代码已合并到 index.html。

保留：体重、运动、饮食。
删除：药物、补充剂、睡眠、步数、心率、血压、血糖、体温、饮水、心情、症状、HealthKit。

本版本修复：
- CSS、JavaScript、IndexedDB 逻辑合并到 index.html，减少多文件不同步。
- 新增记录时，日期和时间输入框真正使用手机当前本地日期/时间，而不是 placeholder。
- 打开记录弹窗时再次读取当前手机时间，适配 iOS Safari/PWA。
- Service Worker 缓存版本升级到 2.6；shell 不再缓存不存在的 app.js/db.js/style.css。
