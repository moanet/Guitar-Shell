# Changelog

> Guitar Shell 的**完整迭代记录**：逐版本交付、测试结果、关键决策与风险。
> README 只保留精简时间线和当前进度；需要追溯细节时看这里。

## 0.0.7.3 — B1-spike 体验修复（待真机复测）

- **mini 节拍器步进**：`mmMinus` / `mmPlus` 此前只有按钮、没有事件绑定；现按 `±1 BPM` 步进，调用 `updateMmBpm()`，播放中同步 `mmHandle.setBpm()`，并广播 `bpm-changed` 给主节拍器。
- **提示音干扰**：调准“叮”触发后设 420ms 检测保护窗（覆盖 0.32s 音效尾音 + 扬声器/采集延迟）；窗口内 `updatePitch()` 直接跳帧，不采样、不清历史，指针和音分读数保持上一帧。
- **读谱全屏**：缩放列新增 `⤢ / ⤡` 全屏按钮，顺序为 `＋ / − / 全屏`；全屏用 `:host(.reader-fullscreen)` 固定层覆盖整个视口并隐藏工具栏，壳内跳过原生 Fullscreen API，避免 WebView reject / 闪退。
- **控件渐隐**：`＋ / − / 全屏` 与 mini 节拍器共用“谱面交互即 0.15 透明度、指针进入控件即实体化”的状态机；刚打开谱面保持实体化。
- 版本：网页 `APP_VERSION = 0.0.7.3`；Android `versionCode 10` / `versionName 0.0.7.3`；debug APK 5,009,621 字节，SHA-256 `1D863853C4FE5E7C712C1D1C5B3FDDD1AB9F64BADC00B049D5BCBC8B536A55F9`。
- 本地验证：mini 步进 `120 → 121 → 119`，播放中 handle 同步 `119 → 120 → 119`；合成麦克风采样确认提示音窗口内 `lastAnalysisAt` 冻结约 420ms 后恢复；594×891 全屏下工具栏 `display:none`、host 覆盖 `594×891`。
- B1-spike `0.0.7.2` 已在真机验收，后台 / 锁屏节拍器可持续发声；C1b 仍保留常亮 Wake Lock、长时 Doze 与音频焦点兜底。

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
