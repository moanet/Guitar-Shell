# Changelog

## 0.0.7.0 — B0 打壳前体检

- `manifest.json` 的 `start_url` / `scope` 改为相对路径，本地、GitHub Pages 子目录与 APK 共用一份配置。
- `sw.js` 删除未使用的 `base` 死代码；缓存清单补 `js/services/toast.js`，与实际静态 import 对齐。
- APK / Capacitor 壳内跳过 Service Worker 注册，网页端继续保留离线缓存。
- 新增全局 toast 服务 `js/services/toast.js`；调音器麦克风失败不再弹 `alert()`，改为应用内提示并复位按钮。
- 布局补安全区：顶部状态栏、刘海与底部 Home Indicator 使用 `env(safe-area-inset-*)`。

## 0.0.6.5 — C5 UI 收尾

- 调音器「开启麦克风 / 停止调音」去掉点击高亮与焦点矩形。

## 0.0.6.4 — C5b 调音器界面

- A4 步进校准、标准音试听、10 秒音分曲线；自定义调准音效占位。

## 0.0.6.1～0.0.6.3 — C5a 调音器底层

- YIN 基频、A4 校准、低音尾音折叠；离页自动关麦；调准“叮”与震动反馈。

## 0.0.6.0 — C1a + C4

- 页级书签；节拍器逐拍重音、Swing、变速练习、倒计时、迷你节拍器同步。
