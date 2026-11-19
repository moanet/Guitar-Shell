# Changelog

## 0.0.7.2 — 标准音低音弦响度补偿（待复测）

- 按弦号设置标准音试听电平：E2 0.36 / A2 0.34 / D3 0.30 / G3 0.28 / B3 0.25 / E4 0.22，低音 E/A 明显加强，高音 e 保持原响度。
- 低频弦（<140Hz）补入 2/3/4 次谐波，手机小喇叭上更容易听到低音弦的中频泛音；中频弦补 2/3 次谐波。
- 网页端音频图实测 RMS：E2 0.290、A2 0.275、D3 0.219、G3 0.206、B3 0.168、E4 0.148。

## 0.0.7.1 — B1-spike 真机反馈修复（待复测）

- 调音器标准音改为基音 + 2/3 次谐音，试听前等待 `AudioContext` resume；改善 E2/A2 在手机小喇叭上“有信号但听不见”。
- 拆分卡片圆形按钮与底部操作面板的 `.action-btn` 样式；导入面板定宽横排、最大 80vh 可滚动并预留底部安全区。
- 节拍器 `.practice-hud` 改为固定 42px 常驻占位，开关 Swing / 变速 / 倒计时不再让圆形主体缩放或位移；HUD 文案压缩。
- 云同步弹窗改为顶部对齐 + 内部滚动，输入框 focus 后滚入可视区；viewport 补 `interactive-widget=resizes-content`，Android 补 `adjustResize`。
- 读谱搜索输入补 `min-width:0`，排序框补 `min-width:104px; max-width:42vw`，360px 下“最新添加”完整显示。
- Android versionCode 8 / versionName 0.0.7.1；debug APK 重新构建。

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
