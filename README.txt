我的健康 V3.4
- 修复减肥目标打不开：恢复完整目标设置弹窗及保存逻辑。
- 修复减肥目标昨日饮食计算：读取 diet.totalCalories；兼容旧记录 calories × quantity。
- 饮食输入明确提供 kcal / kJ 下拉选择，kJ 按 4.184 换算成 kcal；存储统一为 kcal。
- 身体参数保存只更新 settings，不修改历史 healthEvents。
- 版本及 Service Worker 更新到 3.4。
