# 我的健康 V2.5

修复：
- 修复首页/我的页面 IndexedDB object store 不存在导致的崩溃。
- IndexedDB 升级到版本 3：自动创建 healthEvents/settings，并删除旧的药物/补充剂 store。
- 应用代码彻底移除药物、补充剂相关数据库访问。
- 保留体重、运动、饮食。
- Service Worker 版本更新为 v2.5；Network First + 自动更新机制继续生效。
- 体重、运动、饮食记录默认当前手机本地日期和时间。
