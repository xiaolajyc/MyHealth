我的健康 V4.9
Google Drive 云端登录稳定性修复：
- 后台同步和 App 启动恢复改为真正的 silent token 请求（prompt:none），不主动弹登录/同意窗口。
- App 启动时如果之前已连接，会自动尝试静默恢复 Google Drive 授权。
- access token 过期后，后台同步会先静默重新获取 token。
- 只有用户主动点击“连接 Google Drive”时才使用 consent 授权。
- 静默授权失败不会弹窗，只提示“云端授权已过期 · 点击连接 Google Drive 重新授权”。
- 保留现有 Google Drive client ID、drive.file 权限和同步文件。
- 版本 / Service Worker 更新到 4.9。
