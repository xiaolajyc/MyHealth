# 我的健康 V2.15

修复运动按钮无响应：
- 原因：运动热量自动计算代码在 recordForm 创建之前就访问 recordForm，导致 openRecord() 抛出异常。
- 已将运动热量计算监听器移动到 recordForm 创建之后。
- 点击运动现在可以正常打开记录窗口。
- 运动类型和时长会自动计算预计消耗 kcal。
- 消耗 kcal 可以手动修改。
- 保存后运动记录包含 kcal。
- 首页继续统计本月运动消耗总 kcal。

版本：2.15
Service Worker：v2.15
