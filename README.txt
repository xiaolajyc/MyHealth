# 我的健康 V2.4

本次重点修复：
- 修复“首页”和“我的”页面崩溃问题，并增加页面错误兜底。
- Service Worker 改为 Network First，优先获取最新 HTML/CSS/JS。
- 每次版本使用新的缓存名，并自动删除旧缓存。
- 注册 Service Worker 时使用 updateViaCache:none。
- 检测到新版本后自动 SKIP_WAITING + reload，PWA 不再长期卡旧版本。
- 保留：体重、运动、饮食。
- 删除：药物、补充剂、睡眠、步数、心率、血压、血糖、体温、饮水、心情、症状、HealthKit。
