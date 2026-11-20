# Changelog

> Guitar Shell 的**完整迭代记录**：逐版本交付、测试结果、关键决策与风险。
> README 只保留精简时间线和当前进度；需要追溯细节时看这里。

## 0.0.8.7 — 数据管理归拢 + Android 原生备份（测试包待真机复测）

- **数据管理全部收进设置抽屉**：本地备份、从文件恢复、清空乐谱与练习记录、云同步入口统一放在右侧全局设置里；读谱页顶部不再保留备份 / 恢复 / 云同步按钮。
- **云同步入口迁移**：设置抽屉「云同步」卡片点击后自动切到读谱页并打开原有坚果云 WebDAV 弹窗；账号、应用密码、路径、同步通道与冲突检测逻辑保持不变。
- **读谱书架精简**：书架态隐藏读谱工具栏，只保留「导入 + 搜索 + 排序 + 标签 + 书架」；导入按钮放在搜索行最左侧，移动端仍打开拍照 / 相册 / 文件选择，桌面端保留文件夹导入图标；打开谱面后工具栏只显示返回、打卡、存进度、书签。
- **顶部齿轮右对齐**：品牌行改为整行布局，齿轮固定在右上角，左右留白与 26px 品牌图标对称（390px 宽下均为 20px）；版本徽标留在标题旁。
- **Android 原生备份**：新增 `SaveBackupPlugin` 与 `MainActivity` 注册；API 29+ 用 MediaStore 写入 `Download/GuitarShell/`，API 22–28 申请 `WRITE_EXTERNAL_STORAGE` 后写入公共 Download；返回真实文件名、路径与 content URI。
- **修复「提示成功但没有文件」**：Android WebView 不处理 `<a download>` + blob，旧实现只有 toast。现在 `js/services/backup.js` 新增 `saveBackupFile()`，壳内走 `Capacitor.nativePromise('SaveBackup', 'save')`，网页端继续浏览器下载；设置抽屉成功后显示实际保存路径。
- **备份文件名**：增加秒级时间戳，改为 `GuitarShell-backup-YYYYMMDD-HHmmss.json`，避免连续备份同名覆盖；备份 schema 仍为 2，恢复格式不变。
- **Service Worker**：缓存清单补入 `settings.js` 与 `backup.js`，PWA 离线不会漏文件；`APP_VERSION` 与缓存名同步 `0.0.8.7`。
- **浏览器验收**：390×844 下版本徽标 `v0.0.8.7`；品牌图标左距 20px、齿轮右距 20px、齿轮 27px；书架工具栏 `display:none`，搜索行依次为导入 74px、搜索 164px、排序 104px，标签栏与书架正常；设置抽屉宽 344px，云同步卡片可见；点击云同步后自动切到读谱页且 `cloudModalMask` 为 `modal-mask show`；打开谱面后工具栏恢复，仅返回 / 打卡 / 存进度 / 书签；Android UA 下导入按钮打开 `action-sheet-mask show`，文件夹按钮隐藏；网页端 `saveBackupFile()` 正确回退为 `native:false` / 浏览器下载目录；JS 错误列表为空。
- **未做真机点击验证**：当前无连接设备，`SaveBackup` 的 MediaStore 实际写盘、文件管理器可见性与 `Download/GuitarShell` 路径需真机确认；网页端下载回退路径已验证。
- **Android 构建**：`npm run cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 17` / `versionName 0.0.8.7`，`WRITE_EXTERNAL_STORAGE maxSdkVersion=28`，启动图标仍为 `res/mipmap-*/ic_launcher_gshell.png`；`classes4.dex` 已包含 `SaveBackupPlugin`。
- debug APK `5,125,523` 字节；SHA-256 `414A360C03210AB4C9345E88DD5D321FF52075A4E2AA8A5244205B3A35577F43`；debug 签名 v1 / v2 校验通过。
- 版本：网页 / SW `APP_VERSION = 0.0.8.7`；`package.json` / `package-lock.json` `0.0.8.7`；Android `versionCode 17` / `versionName 0.0.8.7`。

## 0.0.8.6 — 全局设置抽屉 + 读谱热区缩小（已真机验收）

- **读谱翻页热区缩小**：`navPrev` / `navNext` 从原来的整屏高度（`top:56px; bottom:120px`）改为谱面中线附近 `170px` 高、`7%` 宽的短条，JS 按 viewer 高度居中定位；保留左右翻页点击，不再用大片灰色区域盖住谱面。左右热区继续 `outline:none` + 点按高亮透明。
- **全局设置抽屉**：顶部标题栏版本徽标右侧新增齿轮入口，打开右侧抽屉。抽屉含：
    - **数据管理**：本机乐谱 / 练习记录条数、当前存储占用；本地备份 JSON、从备份文件恢复、清空乐谱与练习记录（二次确认）。恢复 / 清空后广播 `gs-data-changed` 与 `log-updated`，读谱书架和练习记录页即时刷新。
    - **外观**：展示当前唯一的「复古木质 · 深夜琴房」主题与九色 token，为后续多主题切换预留位置。
    - **关于**：自有图标、产品定位、当前版本 `v0.0.8.6`，明确无账号、默认不上传云端。
- **备份服务抽离**：新增 `js/services/backup.js`，统一打包 / 下载 / 解析 / 恢复；保留既有备份格式（`APP_VERSION`、`BACKUP_SCHEMA=2`、scores base64 + logs），与读谱页旧备份完全兼容。
- **继承 0.0.8.5**：启动图标 G 已真机确认「非常完美」；木鱼音色、全局按钮 / 读谱箭头无蓝色选中框继续保留。
- **浏览器验收**：390×844 下版本徽标 `v0.0.8.6`；齿轮 27px、无 outline / 点按高亮；设置抽屉宽约 344px，读到 1 份乐谱 / 4 条练习，`v0.0.8.6`，页面无横向溢出；备份载荷 scores=1 / logs=4 且恢复往返成功，非法 JSON 正确报「备份文件不是有效 JSON」；读谱箭头热区实测 `170×27px`、垂直居中，`outline-style=none`、`-webkit-tap-highlight-color=rgba(0,0,0,0)`。
- **验收与发布**：用户已确认 0.0.8.6 实机验收通过；代码与文档随 `0.0.8.7` 一起提交推送 GitHub，未单独创建 tag / Release。
- 版本：网页 / SW `APP_VERSION = 0.0.8.6`；`package.json` / `package-lock.json` `0.0.8.6`；Android `versionCode 16` / `versionName 0.0.8.6`。
- **Android 构建**：`npm run cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 16` / `versionName 0.0.8.6`，启动图标仍为 `res/mipmap-*/ic_launcher_gshell.png`。
- debug APK `5,091,753` 字节；SHA-256 `A5B276B56256B6BF264E9C1E1F5DF34E5C9F20596325F234559C11114F1A1BE9`；debug 签名 v1 / v2 校验通过；真机已验收。

## 0.0.8.5 — 启动图标 / 按钮选中框 / 木鱼音色修正（图标已真机验收）

- **修复 0.0.8.4 未通过项：Android 启动图标**：放弃自适应前景铺满方案（真机上 G 撑满、背景被 MIUI 染棕）；改为独立 legacy 资源 `@mipmap/ic_launcher_gshell` / `ic_launcher_gshell_round`，按截图右侧 `GShell` 比例把源图缩至约 95% 居中，G 约占图标 74%，四周保留近黑 `#0E1014` 留白，圆角半径约 22%；同时覆盖 mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi，避开系统自适应背景着色。
- **清除按钮蓝色矩形选中框**：全局 `css/layout.css` 去掉按钮 focus-visible 琥珀 outline，改为 `button:focus, button:focus-visible { outline: none !important }` + `-webkit-tap-highlight-color: transparent`，并对 `html / body / *` 统一关闭点按高亮；`metronome.js` / `practice-log.js` / `tuner.js` / `sheet-reader.js` 四个 Shadow DOM 组件各自在样式顶部统一清除按钮、label、input、select 的 outline 与点按高亮。覆盖顶部四页切换、记录页“保存这次练习 / 练习趋势 / 近 7 天 / 近 12 月”、标题右侧版本徽标、读谱左右翻页热区 `div.nav-zone`（`navPrev` / `navNext`）及其他按钮。
- **节拍器音色**：`TIMBRES` 用“木鱼”替换“三角”；`audio.js` 新增 `woodblock` 独立合成（木腔双正弦共振 + 短带通噪声瞬态 + 75ms 指数衰减），不是仅改标签；`setTimbre` 接受 `woodblock`，旧存档 `triangle` 自动迁移；节拍器与读谱迷你节拍器共用，音色同步生效。
- **已在 0.0.8.4 真机验收通过并保留**：读谱单页提示“上次读到的位置”+ 2 秒停留；记录页默认“记录本次练习”+“练习记录列表”、“练习趋势”折叠、累计统计移入趋势底部；顶部标题栏 26px 自有品牌图标。
- **已推送**：`0.0.8.5` 代码、图标资源、README 与 CHANGELOG 已提交并推送 GitHub；测试 APK 继续本地交付，不创建 Release。
- 版本：网页 / SW `APP_VERSION = 0.0.8.5`；`package.json` / `package-lock.json` `0.0.8.5`；Android `versionCode 15` / `versionName 0.0.8.5`。
- **浏览器验收**：390×844 下版本徽标 `v0.0.8.5`；顶部四页切换、版本徽标、记录页保存 / 趋势 / 近 7 天 / 近 12 月、节拍器设置面板全部按钮、读谱书架 / 谱面工具栏按钮计算样式 `outline-style = none`、`-webkit-tap-highlight-color = rgba(0,0,0,0)`；读谱左右热区 `navPrev` / `navNext` 同时确认无 outline、点按高亮透明，全页蓝色高亮计数为 0；音色列表为“正弦 / 方波 / 木鱼”，`audioEngine.click({type:'woodblock'})` 无异常。
- **Android 构建**：`npm run cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 15` / `versionName 0.0.8.5`，启动图标为 `res/mipmap-*/ic_launcher_gshell.png`（不再走 `mipmap-anydpi-v26` 自适应 XML）。
- debug APK `5,110,820` 字节；SHA-256 `4CE1F9B59ADC73C9049974A9E5E7C4994F40062E20B0D1A051FF53D7311BDAAE`；debug 签名 v1 / v2 校验通过；启动图标已真机确认通过。读谱左右箭头热区偏大，转 `0.0.8.6` 缩小。

## 0.0.8.4 — UI 细节修正第一版（图标未通过，已被 0.0.8.5 取代）

- **读谱恢复提示**：单页谱由“上次读到上次的位置”改为“上次读到的位置”；提示条显示后停留 2 秒自动收起，与底部“已恢复上次练习速度”提示一致；多页谱仍显示具体页码。
- **自有品牌图标**：顶部标题栏移除吉他 emoji，改用 `icon-gShell-192.png` 作为 26px 品牌图标；Android 使用 `icon-gShell-512.png` 重新生成 mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi 的 `ic_launcher.png`、`ic_launcher_round.png` 与自适应前景 PNG；自适应背景色统一 `#0E1014`，移除默认白色 / 青色背景。
- **记录页排版**：默认只展示“记录本次练习”表单 + “练习记录列表”；原“累计打卡 / 累计分钟”大统计栏删除并收进趋势面板底部；“练习趋势”改为一行折叠栏，显示近 7 天 / 近 12 月摘要，点击展开图表、TOP 排行和累计统计；累计值字号 13px，与趋势标题一致。
- **浏览器验收**：390×844 下记录页默认 `trend-box collapsed`，统计元素高度 0；展开后图表 / TOP / 累计正常，`scrollWidth = 390`；读谱测试数据提示文案为“上次读到的位置 · 11月20日 13:40”，2 秒后 `display:none`；顶部图标 26×26，页面无 JS 异常。
- **未发布**：本轮只生成测试 APK，未提交、未推送 GitHub，等待真机确认。
- 版本：网页 / SW `APP_VERSION = 0.0.8.4`；`package.json` / `package-lock.json` `0.0.8.4`；Android `versionCode 14` / `versionName 0.0.8.4`。
- Android 构建：`npm run cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 14` / `versionName 0.0.8.4`。
- debug APK `5,029,116` 字节；SHA-256 `C88C51EBC356CE3E242C094E443FB467A408D161C87A34AED020BDB927BCB274`；真机复测待确认。

## 0.0.8.3 — UI 复古木质重构（真机验收通过并推送）

- **视觉方向**：从赛博极客青绿风整体切到「复古木质 / 深夜琴房 / 咖啡馆」；取消青蓝、亮绿与霓虹发光，统一暖木、低饱和、大圆角。
- **9 色 token**：`--bg0 #121110`、`--bg1 #1E1B18`、`--line #2C2622`、`--primary #B87B4C`、`--secondary #F3E8D6`、`--accent #D99E6A`、`--txt #EAE3D9`、`--muted #8A8075`、`--success #6B8E23`、`--danger #B54A42`；`css/layout.css` 保留 `--cyan / --amber / --green / --red` 旧变量别名，避免组件样式断裂。
- **全局外壳**：深黑棕底 + 极淡木棕 / 橄榄径向光晕；header 深木棕渐变、暖色阴影；tabs 胶囊圆角、active 半透明木棕；toast、版本徽标、placeholder、滚动条、focus-visible 同步暖化；`theme-color` / manifest 背景改 `#121110`。
- **节拍器**：播放按钮木棕渐变、运行中铁锈红；拍点方块木棕 / 琥珀 / 奶白；旋钮轨道深木色，进度奶白 → 琥珀 → 木棕，手柄奶白光晕；设置面板、细分 / 拍号 / 音色、range、数字输入全部暖化。
- **调音器**：仪表深木面板；命中音名 / 指针 / 中心刻度橄榄绿；音分曲线琥珀；弦按钮、A4 校准、标准音、反馈按钮木棕 / 橄榄；开始按钮木棕渐变、停止铁锈红渐变。
- **读谱**：工具栏 / 筛选 / 卡片 / 弹窗全部木质化；主按钮与云同步木棕渐变；标签高亮半透明木棕 + 奶白文字；卡片 hover 木棕边框 + 暖阴影；迷你节拍器播放木棕渐变、圆环奶白 → 木棕、停止铁锈红。
- **练琴记录**：统计数字琥珀；打卡按钮木棕渐变；柱状图木棕、今日奶白；TOP 进度条深木 → 琥珀；输入框、分段切换、卡片、删除按钮统一木质调。
- **浏览器验收**：390×844 视口依次检查节拍器 / 读谱 / 记录 / 调音四页；版本徽标 `v0.0.8.3`，`body` 计算色 `rgb(18,17,16)`，四页 `scrollWidth = 390` 无横向溢出；打卡按钮、调音开始按钮均为木棕渐变。
- **真机验收**：用户确认 UI 复古木质重构通过；代码与 README 推送 GitHub。
- 版本：网页 / SW `APP_VERSION = 0.0.8.3`；`package.json` / `package-lock.json` `0.0.8.3`；Android `versionCode 13` / `versionName 0.0.8.3`。
- Android 构建：`npm run cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 13` / `versionName 0.0.8.3`。
- debug APK `4,983,212` 字节；SHA-256 `0D8A8B8D0BC6A1C3307E5E90840351486750AA3AEFF590D29E6A73F5AE6175C1`；真机视觉效果待复测。

## 0.0.8.1 — C1b 原生插件通道修正（真机验收通过）

- **问题**：`0.0.8.0` 的 `wakelock.js` 只读取 `window.Capacitor.Plugins.KeepAwake`。零构建壳只注入 `native-bridge.js`，没有 `Plugins` 命名空间，原生路径会静默落空并回退 Web，原生 `FLAG_KEEP_SCREEN_ON` 实际不会生效。
- **修正**：`getNativePlugin()` 改为优先使用 `Capacitor.Plugins.KeepAwake`（若未来引入 `@capacitor/core`），否则使用 `Capacitor.nativePromise('KeepAwake', 'enable' / 'disable' / 'isEnabled', {})` 直连原生桥。
- **模拟壳验证**：临时把 `window.Capacitor` 设为 `isNativePlatform: () => true` 并提供 `nativePromise`，`acquire` 后 `mode=native / active=true`，调用记录为 `KeepAwake:enable`；`release` 后 `active=false`，调用记录追加 `KeepAwake:disable`。
- 版本：网页 / SW `APP_VERSION = 0.0.8.1`；`package.json` / `package-lock.json` `0.0.8.1`；Android `versionCode 12` / `versionName 0.0.8.1`。
- Android 构建：`cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 12` / `versionName 0.0.8.1`。
- debug APK `4,982,163` 字节；SHA-256 `DD20784171785CEA6710FBA913CB70C92E90488D0A7053AEFDA7608E83A098A0`；真机常亮效果待复测。

## 0.0.8.0 — C1b 屏幕常亮首包（已被 0.0.8.1 取代）

- **新增常亮服务**：`js/services/wakelock.js` 统一管理屏幕常亮，按 reason 引用计数，允许节拍器 / 读谱 / 调音同时持有；`acquire` / `release` 幂等，`wakeLockState()` 供调试。
- **双路径**：壳内优先调用 Capacitor 原生插件 `KeepAwake`（Android `FLAG_KEEP_SCREEN_ON`）；原生不可用时回退 `navigator.wakeLock.request('screen')`。原生插件调用失败会标记并自动回退，不阻塞页面。
- **接入点**：节拍器 `start()` 申请 / `stop()` 与 `onStop` 释放；读谱 `openScore()` 申请 / `返回书架`、切走读谱页、组件卸载释放；调音 `isListening = true` 后申请 / `stopTuner()` 释放。
- **可见性恢复**：`visibilitychange` 时页不可见则释放，回到前台仍有 reason 则自动补申请；`pagehide` 清空 reason，避免冷启动残留。
- **原生层**：新增 `KeepAwakePlugin.java`（`enable` / `disable` / `isEnabled`），`MainActivity.onCreate()` 在 `super.onCreate()` 前注册；Manifest 补 `WAKE_LOCK`，用于 WebView 内 Web Wake Lock 回退路径。
- **未引入前台服务**：后台 / 锁屏节拍器已由 `0.0.7.2` 真机验证续响；本轮不再叠加 Android 14 前台服务类型 / 通知权限复杂度。`FLAG_KEEP_SCREEN_ON` 只作用于窗口，切后台不会继续耗电。
- 版本：网页 `APP_VERSION = 0.0.8.0`；`sw.js APP_VERSION = 0.0.8.0` 并补缓存 `js/services/wakelock.js`；`package.json` / `package-lock.json` `0.0.8.0`；Android `versionCode 11` / `versionName 0.0.8.0`。
- 浏览器验证：节拍器启动 `active=true / mode=web / reasons=['metronome']`，停止后 `active=false`；打开谱面 `reasons=['reader']`，返回书架清空；用合成音频流启动调音 `reasons=['tuner']`，停止 / 切页后清空；同时申请两个 reason 后只释放一个，常亮仍保持。
- Android 构建：`npm run cap:sync` → `gradlew assembleDebug` BUILD SUCCESSFUL；`aapt` 确认 `versionCode 11` / `versionName 0.0.8.0` 与 `WAKE_LOCK`；`dexdump` 在 `classes4.dex` 找到 `KeepAwakePlugin`。
- debug APK `4,981,896` 字节；SHA-256 `DAB9E4467D72F222B18FD71A01D241BED75C30F28DD14380CE5AB64A6167CD14`；真机常亮效果待复测。
- 已知问题：零构建壳没有 `Capacitor.Plugins` 命名空间，原生路径未真正生效；由 `0.0.8.1` 修正。

## 0.0.7.3 — B1-spike 体验修复（真机验收通过）

- **mini 节拍器步进**：`mmMinus` / `mmPlus` 此前只有按钮、没有事件绑定；现按 `±1 BPM` 步进，调用 `updateMmBpm()`，播放中同步 `mmHandle.setBpm()`，并广播 `bpm-changed` 给主节拍器。
- **提示音干扰**：调准“叮”触发后设 420ms 检测保护窗（覆盖 0.32s 音效尾音 + 扬声器/采集延迟）；窗口内 `updatePitch()` 直接跳帧，不采样、不清历史，指针和音分读数保持上一帧。
- **读谱全屏**：缩放列新增 `⤢ / ⤡` 全屏按钮，顺序为 `＋ / − / 全屏`；全屏用 `:host(.reader-fullscreen)` 固定层覆盖整个视口并隐藏工具栏，壳内跳过原生 Fullscreen API，避免 WebView reject / 闪退。
- **控件渐隐**：`＋ / − / 全屏` 与 mini 节拍器共用“谱面交互即 0.15 透明度、指针进入控件即实体化”的状态机；刚打开谱面保持实体化。
- 版本：网页 `APP_VERSION = 0.0.7.3`；Android `versionCode 10` / `versionName 0.0.7.3`；debug APK 5,009,621 字节，SHA-256 `1D863853C4FE5E7C712C1D1C5B3FDDD1AB9F64BADC00B049D5BCBC8B536A55F9`。
- 本地验证：mini 步进 `120 → 121 → 119`，播放中 handle 同步 `119 → 120 → 119`；合成麦克风采样确认提示音窗口内 `lastAnalysisAt` 冻结约 420ms 后恢复；594×891 全屏下工具栏 `display:none`、host 覆盖 `594×891`。
- B1-spike `0.0.7.2` 已在真机验收，后台 / 锁屏节拍器可持续发声；C1b 继续补常亮、长时 Doze 与音频焦点兜底。
- `0.0.7.3` 三项修复已真机复测通过。

## 0.0.7.2 — 标准音低音弦响度补偿（真机验收通过）

- 调音器标准音试听按弦号设置电平：E2 `0.36` / A2 `0.34` / D3 `0.30` / G3 `0.28` / B3 `0.25` / E4 `0.22`，低音 E/A 明显加强，高音 e 保持原响度。
- 低频弦（<140Hz）补入 2/3/4 次谐波；中频弦（140–220Hz）补入 2/3 次谐波，让手机小喇叭更容易推出可听的中频泛音。
- 网页端音频图实测 RMS：E2 `0.290`、A2 `0.275`、D3 `0.219`、G3 `0.206`、B3 `0.168`、E4 `0.148`，低音相对高音 e 提升约 5–6dB。
- Android `versionCode 9` / `versionName 0.0.7.2`；debug APK `4,976,609` 字节；SHA-256 `E38AC5D2D26E11A4D7CB8626D7E35153D5F6F4BDCA491CBF78AA5640E22ABCCC`。
- 提交 `81ceb95`，tag `v0.0.7.2`；GitHub Release 以 **Pre-release / 测试性质** 发布，资产 `GuitarShell-B1-spike-0.0.7.2-debug.apk`。

## 0.0.7.1 — B1-spike 真机反馈修复（已并入 0.0.7.2 推送）

真机测试集中反馈 5 个问题，均先改网页端再回灌 APK：

- **调音器标准音不响**：参考音改为基音 + 2/3 次谐音；试听前 `await audioEngine.resume()`，并用 `refEpoch` 防止连续点击 / 切页时旧异步恢复偷偷发声。网页端确认 `AudioContext` 为 `running`、Analyser 有信号；实际扬声器可听性留真机复测。
- **导入文件面板挤压**：`sheet-reader.js` 中卡片 22px 圆形按钮与底部操作面板的 `.action-btn` 样式冲突；拆为 `.card-actions .action-btn` / `.action-sheet .action-btn`。面板改为整行横排、`max-height:80vh` 可滚动、底部安全区。360px 下按钮 `320×55`。
- **节拍器圆形主体缩放**：`.practice-hud` 改为固定 `42px` 常驻占位，`.show` 只控制 `opacity/visibility`；HUD 文案压缩为 `Swing 50% · 变速 120→160 · 每2小节 · ⏳15分`。360px 下开关 HUD 前后 `knobCanvas` 均为 `656×656`（CSS 328px），`knobWrap` 高度不变。
- **云同步键盘遮挡**：弹窗顶部对齐 + 内部滚动、`max-height:100%`；`cloudUser/cloudPass/cloudPath/cloudBase` focus 后 `scrollIntoView`；viewport 补 `interactive-widget=resizes-content`，Android `MainActivity` 补 `adjustResize`。360×420 短视口下账号/密码仍在可视区。
- **读谱排序栏文字显示不全**：`.search-inp` 补 `min-width:0`；`.sort-sel` 补 `flex:0 0 auto; min-width:104px; max-width:42vw`。360px 下排序框右边界 `344px`，`最新添加` 完整显示。

## 0.0.7.0 — B0 打壳前体检 + B1-spike 预演包

### B0 打壳前体检（已验收，提交 `0800edc`，tag `v0.0.7.0`）

- **manifest 去写死**：`start_url` / `scope` 由 `/GuitarShell/` 改为 `./`；本地根目录、Pages 子目录与未来 APK 本地资源共用一份 manifest。模拟解析：Pages → `/GuitarShell/`，本地 → `/`。
- **SW 清单对齐**：删除未使用的 `base` 死代码；`ASSETS_TO_CACHE` 补入 `js/services/toast.js`。22 个有效缓存项全部存在；离线断网重载后四大模块仍可打开。
- **壳内 SW 策略**：检测到 `window.Capacitor.isNativePlatform()` 为真时跳过 Service Worker 注册，网页端继续注册，避免 APK 内“资源已本地打包又叠一层 SW 缓存”的双缓存风险。模拟壳测试注册调用 0 次、无 registration、应用正常加载。
- **统一轻提示**：新增 `js/services/toast.js`；调音器麦克风失败不再弹 `alert()`，改为停止已建立音轨、复位按钮为「🎤 开启麦克风」、状态文字转红并提示原因。7 条浏览器用例 PASS。
- **安全区**：header 增加 `env(safe-area-inset-top/right/left)`，`.view-section` 预留 `safe-area-inset-bottom`；360px 无横向溢出。
- **360px 结构审计**：四个 Tab 切换均无横向溢出；360×800 下 header 自动换行成 92px 两行；四个页面内容均可完整进入滚动区。窄屏视觉压缩留给 UI 终版，不在 B0 冻像素。
- **壳层风险决策**：manifest 相对路径 / SW 漏缓存 / 壳内双缓存 / WebView alert 割裂 / 安全区 / 键盘顶起 / IndexedDB 配额 / 锁屏音频；B0 只做网页端能验证的部分，真机项交给 B1-spike。

**壳层风险与决策清单**

| 风险 | B0 决策 | 验证状态 |
| --- | --- | --- |
| Pages 子目录 / 本地根目录 / APK 三套路径 | manifest 用相对 `./`，SW 缓存全部相对 SW 根 | ✅ 路径解析 + 本地离线重载通过 |
| SW 漏缓存导致离线白屏 | 缓存清单与实际 import 对齐，补 `toast.js` | ✅ 22 项缓存全部存在；断网重载四大模块可开 |
| APK 内资源已本地打包，再叠 SW 会双缓存 | 壳内跳过 SW 注册，网页端保留 | ✅ 模拟壳测试通过；真机 B1-spike 复核 |
| WebView 原生 `alert()` 割裂 | 麦克风失败改应用内 toast + 状态文字 | ✅ 7 条浏览器用例 PASS |
| 刘海 / 状态栏 / Home Indicator 遮挡 | header 与 view-section 预留 `env(safe-area-inset-*)` | ⏳ 360px 结构通过；真机 B1-spike |
| Android 返回键 / 键盘顶起 / 横竖屏 | 不在网页端假装通过，交给 B1-spike | ⏳ B1-spike |
| IndexedDB 配额 / 文件选择器 / 震动权限 | 记录为宿主风险，B1-spike 逐项实测 | ⏳ B1-spike |
| 锁屏 / 切后台音频焦点 | Web 端先保留现状，C1b 再做前台服务 | ⏳ C1b |

### B1-spike Capacitor 预演包（不发布）

- Capacitor 6.2.3 + Android API 34 + build-tools 34.0.0，包名 `cc.ccwu.guitarshell.spike`，应用名 `Guitar Shell`；权限 `INTERNET` / `RECORD_AUDIO` / `MODIFY_AUDIO_SETTINGS` / `VIBRATE`。
- Web 资源、`toast.js`、`sw.js` 打进 `assets/public`，壳内跳过 SW；debug APK 由 Gradle 8.7 构建。
- 本机 SDK `I:\Tools\android-sdk`；换机需改 `android/local.properties` 或设置 `ANDROID_HOME`。
- 真机待验收：麦克风权限与采样、PDF/图片导入、IndexedDB 配额、锁屏/切后台音频、震动、返回键、状态栏/安全区、键盘顶起。

## 0.0.6.5 — C5 UI 收尾（已验收推送，提交 `492f9c2`）

- 调音器「开启麦克风 / 停止调音」去掉点击高亮与焦点矩形，保留原蓝 / 红胶囊与光晕。

## 0.0.6.4 — C5b 调音器界面（已验收）

- A4 以 `− / 440 Hz / +` 步进 1Hz，430 / 450 边界自动禁用；改动即写入 `guitar_tuner_a4` 并重算六弦目标。
- 标准音按钮在选弦后可用，点击播 1.2 秒参考音；播放期间暂停检测，避免麦克风把扬声器参考音当成琴声。
- 音分曲线记录最近 10 秒偏差（±50¢），100ms 刷新，进入 ±5¢ 转绿。
- 自定义调准音效占位：`audio.js` 的 `CUSTOM_CHIME_URL` 留空，做好音效后放 `assets/` 并同步 `sw.js` 缓存。
- 17 条 C5b 用例 + 9 条六弦精度 / 节拍器共存用例 PASS；六弦逐弦偏差 ≤ 0.02 音分。

## 0.0.6.1～0.0.6.3 — C5a 调音器底层（并入 0.0.6.4）

- **0.0.6.1 YIN**：新建 `pitch.js`，自相关整体换 YIN（差分 → CMNDF → 首个谷 + 抛物线插值）；A4 支持 430–450 校准并写本机 `guitar_tuner_a4`，六弦目标频率由 MIDI 推算、不再写死；`nearestNote` 输出音名 / 八度 / 音分；RMS 门限、置信度 ≥ 0.6、5 帧中值滤波、30fps 节流。
- **0.0.6.1 低音 E2 尾音修复**：基频衰减、二次谐音占主导时，164.8Hz 会被 `foldToGuitarFundamental()` 折回 82.4Hz，自动模式不再跳成 D3、手动 E2 不再误报偏高；停声 500ms 后清空旧读数。31 条 Node 用例 + 20 条浏览器全链路 / 低音衰减复现 PASS。
- **0.0.6.2 离页关麦**：监听 `app-tab-changed`，切离调音页立即关麦、断开分析器、复位按钮与读数；`stopEpoch` 防止「刚点开启就切页」时异步权限回来又偷偷启动。
- **0.0.6.2 / 0.0.6.3 调准反馈**：进入 ±5 音分时播 2093Hz + 4186Hz、0.32 秒衰减的“叮”（与节拍器 60ms 的“哒”区分），并 `navigator.vibrate(50)`；只在刚进入音准区触发，1.2 秒内不重复。提示音 / 震动各有开关，存 `guitar_tuner_feedback_sound` / `guitar_tuner_feedback_vibrate`；不支持震动时按钮置灰。15 条浏览器用例 + 4 条音色用例 PASS。

## 0.0.6.0 — C1a 页级书签 + C4 节拍器满血（已验收推送）

- 页级书签：阅读态「🔖 书签 N」；按页升序显示页码 + 时间，点行跳页并关面板，可单删；同页刷新时间，上限 30 条；存 `bookmarks: [{page, at}]`，随备份 / 云同步。
- 节拍器设置四组：逐拍重音（四态循环 + 圆点着色，静音占拍位）、Swing（0.5 → 0.75）、变速练习（起始 → 目标，每 N 小节递增，**到目标后保持 N 小节再停**）、倒计时（1～180 分钟）。
- HUD 一行摘要（含目标保持进度）；迷你节拍器同步重音 / Swing。
- 33 条 UI + 14 条引擎 + 6 条迷你同步用例 PASS；0.0.6.0 追加 11 条「保持 N 小节」用例 PASS。
- README 全面重构：架构 / 盘点 / 迭代 / 看板归档。

## 0.0.5.15 — C1a + C4（并入 0.0.6.0）

- 页级书签；节拍器逐拍重音 / Swing / 变速 / 倒计时 / 迷你同步。

## 0.0.5.14 — C3 练习趋势（已推送，提交 `4dccd2e`）

- 近 7 天 / 近 12 月手写 SVG 柱状图、今天 / 本月高亮、汇总、TOP5；窄屏可收起，状态存 localStorage。17 条用例 PASS。

## 0.0.5.13 — C2 找谱（已推送，提交 `bcdf253`）

- `pinyin.js` 覆盖 U+3400～U+9FFF 共 27648 字，纯本地；搜索支持中文 / 英文 / 拼音首字母子序列；标签改多选 AND。13 条用例 PASS。

## 0.0.5.12 — B4 PDF 内存（已推送，提交 `acc2e89`）

- 所有页先建 `aspect-ratio` 占位；只保留可见页 ±3 的位图，滚出即 `canvas.width=0` + `page.cleanup()`；位图密度按实际宽度 × min(DPR,2)；渲染串行可取消，关谱 `pdf.destroy()`。
- 实测 40 页首页只活 4 页 11.8MB，滚到第 30 页只保 7 页。

## 0.0.5.11 — B2 音频引擎（已推送）

- 抽出 `audio.js` 单例：共享 `AudioContext` + `masterGain`；节拍只保留一份 lookahead；每路独立总线，停止即静音，掐掉已排队的 100ms 尾音；`setBpm` 把下一拍往回收；调音器改用 `openAnalyser()`，不再 `close()`。

## 0.0.5.10 — B3 入口清理（已推送，提交 `8adc92f`）

- 去掉重复的 `loadComponents()`、`<meta>` 全部回 `<head>`、静态资源只留一份；图标 / manifest / 样式去重。

## 0.0.5.7～0.0.5.9 — A 数据闭环（已推送）

- **云同步多通道**：本地代理（仅 http 调试页）→ 自建域名 `dav.noamet.ccwu.cc` → workers.dev；用户手填通道最高优先，超时 / 5xx 自动换线，全失败才报错。
- **冲突检测**：同步成功后按备份路径存「时点 + etag」；上传前 `stat()` 比对，云端变过就提示；下载前用 `getLocalChangeStamp()` 判断本地是否动过。
- **空备份保护**：0 谱 0 记录时强提示将被清空的数量，取消即不写库。
- **载荷规范化**：`version` 取 `APP_VERSION`、新增 `schema`、恢复前校验结构；补「备份版本 + 文件名转义」。
- **应用密码**：`vault.js` AES-GCM 加密，密钥不可导出、独立库存储；明文不进 localStorage / 备份 / 日志。
- 验收：手机 4G + 电脑「覆盖本地」全链路通过；A 机上传 → B 机再上传弹出「云端被改过」。

## 0.0.5.6 — 基线

- 四大模块可用：节拍器 / 读谱 / 记录 / 调音；阅读进度双轨制成形。

## 历史专题：阅读进度双轨制

- 旧版「返回书架存 scrollTop」有三重问题：iframe 内滚动父级读不到、药丸读书架旧快照、像素值换缩放 / 设备即失效。
- 现方案：统一 Canvas 渲染；存「页码 + 页内比例 + scrollY + 时间戳」；手动档（📍 / 打卡勾选）+ 弱自动档（返回书架必存、每 5 分钟静默存，切走 tab 不写）；打开谱现取最新记录；药丸按页码 + 比例精确跳转；打卡日志带页码；备份 / 恢复 / 云同步共用同一份载荷。
