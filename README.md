# 🎸 Guitar Shell · 吉他手的一站式练琴工作站

> **项目愿景**：打破练琴时碎片化的工具割裂感，将所有乐谱管理、节拍、调音、打卡记录整合在一个高度沉浸、本地优先、跨端可用的外壳中。从零开始，逐渐长成一个懂吉他手的专属数字工作台。

**当前状态**：`v0.0.5.12` 本地优先 PWA · 四大模块（节拍器 / 读谱 / 记录 / 调音）已上线 · 已具备「阅读进度双轨制（手动 + 弱自动）+ 本地备份/恢复 + 坚果云 WebDAV 同步（多通道 + 冲突检测 + 密码本机加密）」；2026-11-18 完成批次 A（A1～A6），并按「先离线、后壳」重排后续顺序（见第五节），B3 入口清理 + B2 音频引擎已收口。

---

## 🗺️ 一、真实全景架构与演进图

```
Guitar Shell 项目
├── index.html                   ✅ 外壳与 4 大导航（完成，入口已收敛）
├── manifest.json                ✅ PWA 基础配置（完成）
├── sw.js                        ✅ PWA 离线缓存（当前 APP_VERSION = 0.0.5.12，改代码必升版本，且与 js/services/version.js 同步）
├── start-dev.bat                ✅ 一键启动：Python 静态网页(:8000) + Node WebDAV 代理(:8081)
├── .gitignore                   ✅ 忽略 proxy 依赖、本地脚本、IDE 与临时文件
├── icon-gShell-32/192/512.png   ✅ PWA 图标三件套
├── 项目目录结构.txt              ✅ 目录速览（与本文同步维护）
├── css/
│   └── layout.css               ✅ 全局布局与主题色（完成）
├── js/
│   ├── main.js                  ✅ 路由与组件加载（防崩溃机制 + SW 注册 + 版本徽标）
│   │
│   ├── services/                🚧 底层核心服务层
│   │   ├── db.js                ✅ IndexedDB v3（scores/logs 双表，字段已齐）
│   │   │                           └─ 已含：tags / lastReadPage / lastReadPageRatio
│   │   │                              lastReadScrollY / lastReadAt / fileHash（预留）
│   │   │                           └─ 方法：addScore / getScore / getAllScores / updateScore
│   │   │                              deleteScore / addLog / getAllLogs / getLatestLogByName
│   │   │                              clearAllData / bulkImport / getLocalChangeStamp
│   │   ├── webdav.js            ✅ 坚果云 WebDAV 收发（upload/download/probe/stat）+ 云同步 UI 已接入
│   │   │                           └─ ✅ 多通道回落（本地代理 → 自建域名 → Worker），超时自动换线
│   │   │                           └─ ✅ stat()：PROPFIND 取 getlastmodified / getetag / 大小，供冲突检测
│   │   ├── version.js           ✅ APP_VERSION 与 BACKUP_SCHEMA 单一来源（sw.js 无法 import，两处同步）
│   │   ├── vault.js             ✅ AES-GCM 加密存应用密码：密钥不可导出，独立库 GuitarShellVault
│   │   ├── ai-parser.js         ⏳ 待创建：接入大模型，转化复杂曲谱为文本和弦谱
│   │   └── audio.js             ✅ 全局音频引擎单例：共享 AudioContext + masterGain + lookahead 节拍调度 + 单活跃互斥 + 麦克风分析
│   │                               └─ 现状：音频逻辑分别耦合在节拍器、调音器与迷你节拍器中
│   │                               └─ 未来：统一 Web Audio 调度、麦克风流与发声合成
│   │
│   ├── components/              🧱 核心功能积木 (Web Components)
│   │   ├── metronome.js         🟡 节拍器组件 (基础版完成)
│   │   │                           ├─ ✅ 已有：Web Audio 高精度调度、Canvas 旋钮、TAP 测速、
│   │   │                           │        拍号/细分、首拍重音(accent)、全局 BPM 广播
│   │   │                           └─ ⏳ 待补全：重音模式设置、Swing、变速练习、倒计时、音频跟练
│   │   │
│   │   ├── sheet-reader.js      ✅ 读谱与书架 (沉浸式阅读增强完成)
│   │   │                           ├─ ✅ 已有：书架/标签过滤/搜索/排序、pdf.js Canvas 懒加载
│   │   │                           │        （全平台统一，iframe 已废弃）、手势缩放拖拽、
│   │   │                           │        悬浮迷你节拍器（悬停实体化虚化 + 与主节拍器互斥）、
│   │   │                           │        左右翻页热区（脱离滚动容器、内缩安全边距）、
│   │   │                           │        切歌保位（切换前存进度 + 目标谱自动回位）、
│   │   │                           │        阅读进度双轨制（📍存进度 / 打卡 / 5 分钟兜底）、
│   │   │                           │        进度药丸、阅读态仅留三按钮
│   │   │                           ├─ ⏳ 待扩展：多标签页管理、拼音搜索、单曲抽取（大 PDF 建卡片）
│   │   │                           └─ ⏳ 待扩展：书签、屏幕常亮 (Wake Lock)
│   │   │
│   │   ├── practice-log.js      ✅ 练琴记录 (与读谱联动完成)
│   │   │                           ├─ ✅ 已有：打卡（时长/BPM/页码）、累计统计、log-updated 广播
│   │   │                           └─ ⏳ 待扩展：按曲目深度统计、练习时长图表
│   │   │
│   │   ├── tuner.js             🟡 调音器 (基础版完成)
│   │   │                           ├─ ✅ 已有：麦克风采集、自相关基频检测、指针仪表盘
│   │   │                           └─ ⏳ 待扩展：YIN 算法、A4 校准、参考音试听
│   │   │
│   │   └── settings.js          ⏳ 待创建：全局设置抽屉（深浅色、备份恢复、清空数据）
│   │
│   └── lib/                     ✅ 外部核心依赖
│       ├── pdf.js               ✅ PDF 解析核心库 (v3.11 本地化)
│       ├── pdf.worker.js        ✅ PDF 解析线程库
│       ├── pdf.min.mjs          ✅ 备用压缩版（mjs）
│       ├── pdf.worker.min.mjs   ✅ 备用压缩线程版（mjs）
│       └── spark-md5.js         ⏳ 待引入：文件哈希计算（去重目前用「文件名+大小」）
│
├── proxy/                       ✅ 本地后端调试工具（不会被浏览器加载，不上传 GitHub Pages）
│   ├── proxy.js                 ✅ Node.js WebDAV 代理（:8081，处理 CORS，转发坚果云）
│   ├── package.json             ✅ npm 配置（依赖 undici）
│   ├── package-lock.json        📦 本地锁定
│   └── node_modules/            📦 本地依赖（.gitignore 已忽略）
│
└── android/                     ⏳ 待生成：Capacitor 打包生成的安卓工程目录
```

---

## 📊 二、各模块真实进度与功能盘点

### 1. 🏗️ 基础外壳与架构 (90%)
* **已完成**：组件化彻底隔离；导航栏秒切；PWA 离线缓存已跑通；拥有专属的深色圆角 App 图标；本地开发一键启动脚本。
* **未完成**：缺少全局设置页（深浅色切换、备份恢复、清空数据收拢进抽屉）。

### 2. 🥁 节拍器 `metronome.js` (75%)
* **已完成**：高精度 Web Audio lookahead 调度、Canvas 拖拽旋钮、TAP 测速、拍号/细分/音色设置、首拍重音、全局 BPM 广播同步。
* **未完成**：拍点重音模式自定义、Swing 摇摆、变速练习（渐快/渐慢）、倒计时、音频跟练。

### 3. 📖 读谱器 `sheet-reader.js` (85%)
* **已完成**：
  * 本地智能书架 + 标签过滤 + 关键字搜索 + 排序 + 重命名/删除；
  * **全平台统一 Canvas 渲染**（PC 端 iframe 已废弃——进度捕获与事件穿透的前提）；
  * 手势缩放/拖拽、Ctrl+滚轮缩放、两指捏合；
  * **阅读进度双轨制**：按「页码 + 页内比例」记录，缩放换屏不偏移；
    - 手动：工具栏「📍 存进度」一键存档；打卡弹窗内勾选即随打卡一起写库（两者合一）；
    - 弱自动：返回书架强制保存一次 + 阅读中每 5 分钟静默保存（切走 tab 不写，防止写 0）；
    - 恢复：蓝色药丸一键跳回上次位置（带时间戳）；
  * **左右翻页**：热区脱离 `#viewer` 固定在视口两侧，左右内缩 20px / 26px 避开手机返回手势与竖向滚动条，底部留 120px 避开缩放按钮与迷你节拍器；
  * **切歌保位**：翻页切换前先存当前页，切过去用 `{ autoRestore: true }` 直接回到目标谱上次位置，A↔B 来回不再退回第一页；
  * **阅读态工具栏**：进入阅读只保留「← 返回书架 / 📝 打卡 / 📍 存进度」（修掉了 `.pc-actions` 的 `!important` 覆盖问题）；
  * 悬浮迷你节拍器：播放/停止可用、与主节拍器互斥（同一时刻只响一路）、虚化为「悬停实体化」状态机；
  * 历史 BPM 记忆、一键打卡。
* **未完成**：
  * **管理**：多标签页系统、拼音首字母搜索、文件哈希去重（现用名称+大小）。
  * **阅读**：书签、屏幕常亮防息屏 (Wake Lock)、单曲抽取建卡。

### 4. 📝 练琴记录 `practice-log.js` (85%)
* **已完成**：独立打卡面板、时长与 BPM 记录、**页码记录显示**、累计统计、全局实时刷新广播（读谱器打卡 → 记录页自动更新）。
* **未完成**：按曲目深度统计、练习时长图表。

### 5. 🎸 调音器 `tuner.js` (70%)
* **已完成**：麦克风权限获取、自相关算法(频率检测)、指针仪表盘、自动/手动识别琴弦。
* **未完成**：移植 Android 端的高精度 YIN 算法、A4 频率校准、点击发声参考、音分走势曲线。

### 6. ☁️ 数据与服务层 `services/` (60%)
* **已完成**：`db.js` IndexedDB **v3**，乐谱与打卡双表，字段（标签/阅读进度组/文件指纹）全部就位；`getScore(id)` 精准读最新记录；**全量备份导出**（乐谱 Base64 + 打卡 + 进度字段）。`webdav.js` 上传/下载已实现，且**云同步 UI 全链路接通**（上传备份 / 覆盖本地 / 二次确认）；本地 WebDAV 代理已跑通（CORS 转发）。`audio.js` 全局音频引擎已抽离：单例上下文 + lookahead 节拍调度 + 引擎内互斥 + 共享麦克风分析。
* **未完成**：节拍器的高级表现（Swing / 倒计时 / 重音 UI）仍待 C4 在引擎之上展开。

---

## 🚀 三、运行与部署

### 本地开发（Windows）
```bat
start-dev.bat
```
一条命令同时启动：
* **PWA 网页**：`http://192.168.0.200:8000`（Python 静态服务，手机在同一 Wi-Fi 直接访问）
* **WebDAV 代理**：`http://192.168.0.200:8081`（Node 处理 CORS，转发坚果云）

> 单独调试代理：`cd proxy && npm install && node proxy.js`

### 部署（GitHub Pages）
1. 仓库设为 **Public**，文件直接放根目录（`index.html` 即入口）。
2. Settings → Pages → Source 选 `main` / `(root)` → Save。
3. **每次发布改动务必同步升级 `sw.js` 的 `APP_VERSION`**，否则用户端拿旧缓存。
4. 访问需要 HTTPS 才能使用麦克风（调音器）与 localStorage/IndexedDB 稳定持久化——Pages 天然满足。
5. `proxy/`、`start-dev.bat`、`node_modules` 已被 `.gitignore` 过滤，不会污染线上仓库。

---

## 🧬 四、迭代记录：阅读进度双轨制 + 数据闭环

**动机**：旧版"返回书架时自动保存 scrollTop"存在三重问题——
1. PC 端 PDF 用 iframe，滚动发生在 iframe 文档内部，父级 `scrollTop` 恒为 0；
2. 药丸读取的是书架渲染时的内存旧快照，每次重开显示的都是"上上次"的进度；
3. 保存的是像素值，缩放或换设备后同样的像素会落到错误的页。

**方案**（涉及 `db.js` / `sheet-reader.js` / `practice-log.js` / `sw.js`）：
* **统一渲染层**：废弃 iframe，PDF 全平台走 pdf.js Canvas 懒加载，事件与滚动重新归组件所有；
* **存档数据**：`lastReadPage`（页码）+ `lastReadPageRatio`（页内比例）+ `lastReadScrollY`（兼容兜底）+ `lastReadAt`（时间戳）；object store 无固定模式，**无需升 `DB_VERSION`**，旧记录字段缺省自动归 0；
* **双轨写入**：
  - 手动档：工具栏「📍 存进度」按钮一键写库；打卡弹窗勾选后与打卡一起写（两者共用 `saveReadingProgress`）；
  - 弱自动档：返回书架强制保存一次 + 阅读中每 5 分钟静默保存；`viewer` 不可见时跳过，避免写回 0；
* **读取时机**：打开谱时 `dbService.getScore(id)` 现取最新记录（不再依赖书架旧快照）；
* **恢复交互**：蓝色药丸「上次读到第 N 页 · M月D日 时:分」，点击按页码+比例精确跳转，✕ 或首次滚动自动收起；药丸移出滚动容器避免顶偏谱面；
* **联动**：打卡日志带 `page/pageRatio/totalPages`，「记录」页卡片显示 📖 页码；
* **数据闭环**：导出 / 本地恢复 / 云上传 / 云覆盖本地共用 `buildBackupPayload` 与 `restoreFromPayload`；恢复前先全量校验并转 Blob，全部成功才清库写入；
* **云同步**：坚果云 WebDAV，账号与路径存 localStorage，密码仅用于当次请求；
* **翻页热区**：`nav-zone` 移出 `#viewer` 并绝对定位于 `:host`，滚动谱面时始终贴在视口左右两侧；左右各内缩（20px / 26px）避开手机边缘返回手势与竖向滚动条，底部留 120px 避开缩放按钮与迷你节拍器；
* **切歌保位**：左右翻页切换前先 `saveReadingProgress()` 存下当前页，切过去用 `{ autoRestore: true }` 直接跳到目标谱上次位置（不再只弹提示条），来回切换不会退回第一页；
* **阅读态工具栏**：`openScore` 隐藏导入/备份/恢复/云同步（曾因 `.pc-actions { display:flex !important }` 而失效），阅读时只保留「← 返回书架 / 📝 打卡 / 📍 存进度」。

---

## 📋 五、下一步任务看板（按"切香肠"策略推进）

> **核查基线（2026-11-18）**：`v0.0.5.6` 起盘，现已推进到 `v0.0.5.12`，本地 = 线上 Pages = 仓库。四大模块均已可用，瓶颈不再是「功能不够」，而是「生产环境失效 + 数据安全 + 技术债」。
> **推进原则不变**：切香肠、跑通闭环、拒绝烂尾。每批收尾固定动作：升 `APP_VERSION` → 语义化 commit（`feat:` / `fix:` / `chore:`）→ 打 tag `v0.0.x` → 跑一遍冒烟清单。

### 🧪 冒烟清单（每批收尾必跑）
- [ ] 导入 PDF / 图片 → 书架出卡
- [ ] 打开谱 → 缩放拖拽 → 📍 存进度 → 返回书架 → 重开仍在同一页
- [ ] 左右热区切歌 → 目标谱回到上次位置（A↔B 来回不退回第一页）
- [ ] 打卡 → 记录页自动刷新并显示页码
- [ ] 本地备份 → 清库 → 恢复，乐谱 / 打卡 / 进度完整
- [ ] 云上传 → 另一台设备云下载，书架与进度一致
- [ ] 节拍器与迷你节拍器不同时发声；调音器能识别六弦
- [ ] 打包后锁屏 / 切后台，节拍与调音不中断

### 🔴 批次 A：云同步真正可用 + 数据不丢（已完成，2026-11-18）
- [x] **A1 端点环境自适应（已完成）**：`webdav.js` 由写死本地代理改为多通道候选 —— **本地代理（仅 http 调试页）→ 自建域名 `dav.noamet.ccwu.cc` → workers.dev**，用户手填的「同步通道」永远排最前；单通道超时（本地 10s / 上传 90s）或 5xx 自动换通道，全部失败才报错并列出尝试过的通道；云同步弹窗新增「同步通道」输入 + 「测试连接」按钮。
- [x] **A1 验收（2026-11-18 全链路通过）**：手机 4G 打开 Pages，`测试连接 / 上传备份`成功（走自建域名通道）；电脑端点「覆盖本地」成功还原。
- [x] **A2 冲突检测（上传分支已验）**：同步成功后把「时点 + 云端 etag」按备份路径存进 `gs_cloud_sync:<path>`；上传前 `stat()` 比对 —— 云端 etag 变了就提示「云端自上次同步后被改过」，从未同步过且云端已有文件也提示；下载前比 `getLocalChangeStamp()`（游标扫 `createdAt` / `lastReadAt`，不把整库 Blob 读进内存），本地在上次同步后动过就提示；etag 缺失时退化到 `getlastmodified` 比时间。**验收**：2026-11-18 A 机上传 → B 机再上传已弹出「云端被改过」；下载侧的「本地有改动」提示待补测。
- [x] **A3 空备份保护（已完成）**：`restoreFromPayload` 遇到「0 份乐谱 + 0 条记录」的载荷时单独强提示，列出将被清空的本地乐谱 / 打卡数量，取消即不写库 —— 防止失联时拿到空载荷把本地抹掉。
- [x] **A4 载荷规范化（已完成）**：`version` 从写死的 `'0.0.3'` 改为 `js/services/version.js` 导出的 `APP_VERSION`，并新增 `schema: BACKUP_SCHEMA`；恢复前校验 `scores` / `logs` 结构、每条乐谱的 `name` 与 `data:` 前缀；书架卡片、标签、记录页名称统一走 `escapeHtml()`。
- [x] **A5 应用密码本机保存（已完成）**：`js/services/vault.js` 用 AES-GCM 256 加密，密钥以**不可导出** `CryptoKey` 存进独立库 `GuitarShellVault`（不碰 `GuitarShellDB`）；云同步弹窗新增「记住应用密码（仅本机）」与「清除已保存」；明文不进 localStorage、不进备份文件、不进日志。**边界**：同源脚本仍可调用解密，挡的是随手翻 localStorage / 复制浏览器数据 / 把备份发给别人。局域网 `http://` 页没有 `crypto.subtle`，该行自动隐藏。
- [x] **A6 版本可见（已完成）**：品牌旁 `v0.0.5.12` 徽标；点按拉线上 `sw.js` 对比运行版本 —— 一致提示「已是最新」，不一致变紫色并可一键重载，同时报出本机离线缓存版本；页面加载 1.5s 后静默查一次。

---

### 🧭 执行顺序（2026-11-18 重排）

排序标准不是 B/C 编号，而是**「这项能力是否必须依赖壳或网络」**：能纯前端、离线跑完的先做；壳（Capacitor）与真机能力留到最后；AI 识谱悬置。

| # | 任务 | 状态 | 依赖 |
|---|---|---|---|
| 1 | **B3 入口清理** | ✅ 已完成 | 无，先清噪声 |
| 2 | **B2 抽 `audio.js` 单例** | ✅ 已完成（本批与 B3 同批提交） | 是 7、8 的地基 |
| 3 | **B4 PDF 内存治理** | ✅ 已完成 | 独立，可与 B2 并行验 |
| 4 | **C2 拼音首字母搜索** | 待做 | 纯前端字典 |
| 5 | **C3 练习统计** | 待做 | IndexedDB 聚合 |
| 6 | **C1a 页级书签** | 待做 | 本地存储，不碰平台 API |
| 7 | **C4 节拍器满血** | 待做 | 依赖 2 |
| 8 | **C5 调音器专业版** | 待做 | 依赖 2 |
| 9 | **B1 Capacitor 打壳** | 最后 | 等 1～8 全绿 |
| 10 | **C1b Wake Lock / 锁屏续响** | 最后 | 必须壳，跟 9 一起 |

### 🟠 阶段 1～4：纯前端、离线可完成

- [x] **B3 入口清理（已完成，v0.0.5.12）**：`index.html` 的 `main.js` 只引一次、`<meta>` 全部回到 `<head>`、图标 / manifest / 样式各留一份；`main.js` 里重复的 `loadComponents()` 已删。
- [x] **B2 抽全局音频引擎（已完成，v0.0.5.12 同批）**：新增 `js/services/audio.js` 单例 —— 全应用共用一个 `AudioContext` + `masterGain`，节拍调度只保留一份 lookahead 实现（`startMetronome({bpm, slots, accents, timbre, onBeat, onStop})` 返回 `{stop, setBpm}`），互斥由引擎仲裁（新调度抢占旧的，被抢占方 `onStop('preempted')` 复位按钮）；每路节拍挂独立总线，停止时总线静音，掐掉已排进队列的 100ms 尾音；`setBpm` 会把未排音的下一个拍点提前，变速立刻生效。调音器改用 `openAnalyser(stream)` 复用同一上下文，`stopTuner()` 只断流 + `disconnect()`，不再 `close()`（这是「关一次调音器后续音频异常」的根因）。**验收**：Node 假上下文 10 条调度用例全绿；无头 Edge 真实 Web Audio 6 条互斥/单例用例全绿；真机待验「主节拍器 ↔ 迷你节拍器交替 5 次不叠加」。补丁（0.0.5.12）：读谱 mini 从 `guitar_metronome_settings` 读取主节拍器的音色与拍号，按每小节首拍给 `accent`（不再一律平拍），并在运行中通过 `metronome-settings` 事件实时换音色 / 重音；主节拍器监听 `app-tab-changed`，切走「节拍器」页立即停止。
- [x] **B4 PDF 内存治理（已完成，v0.0.5.12）**：渲染改成「虚拟化 + 分辨率自适应」——所有页只建 `aspect-ratio` 占位（滚动条长度稳定），滚到才渲染；同屏只保留「当前可见页 ±3 页」的位图，滚出窗口立即 `canvas.width=0` + `page.cleanup()` + 释放页对象；位图密度 = 实际显示宽度 × min(DPR, 2)，不再无脑 2 倍，缩放后 250ms 防抖按新宽度重渲可见页；渲染任务串行排队且可 `cancel()`，关谱 / 换谱调用 `pdf.destroy()` 彻底释放。**实测**（40 页 A4，Edge 无头 + CDP）：首页只活 4 页、11.8MB；滚到第 30 页窗口为 27～33 共 7 页、首页已释放；回首页第 30 页释放；缩放后重渲为 926×1310 且仍只保 4 页；关闭后 pdfDoc 与全部 canvas 归零。
- [ ] **C2 找谱加速**：拼音首字母搜索 + 多标签组合过滤（本地字典，无需联网）。
- [ ] **C3 练习统计**：按曲目聚合、周 / 月时长曲线（手写 SVG，不引库）。
- [ ] **C1a 页级书签**：在指定页插书签并跳回（存 IndexedDB，壳内同样可用）。
- [ ] **C4 节拍器满血**：重音模式 UI（`accents` 数组已在，只需暴露）、Swing、变速练习、倒计时。
- [ ] **C5 调音器专业版**：YIN、A4 校准、参考音试听、音分曲线。

### 🔵 最后阶段：必须壳 / 真机

- [ ] **B1 Capacitor 打包**：生成 `android/`，声明 `RECORD_AUDIO` / `FOREGROUND_SERVICE` / `WAKE_LOCK`。**验收**：锁屏 10 分钟节拍不断、调音器可用。**放最后的原因**：打壳会换掉宿主（WebView 的 IndexedDB 配额、文件选择、跨域、SW 行为都不同），先打壳会让前面每一项都得在真机上重验一遍。约束：阶段 1～4 期间只用标准 Web 能力，不引入 Android 特有 API。
- [ ] **C1b 阅读常亮 / 锁屏续响**：Web 端 Screen Wake Lock 只能防熄屏，iOS 连这都受限；「锁屏后节拍器继续响」需要前台服务与音频会话，归到壳层完成。

### ⚪ 悬置：C6 AI 识谱

需要模型 API key，而 key 不能放前端仓库 —— 必须再配一个后端代理，等于引入第二条网络依赖，与「网络只保留云同步」的原则冲突。等 B1 之后作为独立服务单独评估，不进主线。

### 🧹 技术债备忘（可随批次顺路清）
- [ ] `spark-md5.js` 未引入 → `fileHash` 恒为空串，去重仍靠「名称+大小」，改名即重复。
- [ ] `manifest.json` 的 `start_url` / `scope` 固定 `/GuitarShell/`，本地 :8000 装 PWA 会指错路径。
- [ ] 无 CHANGELOG / tag，提交信息为 `fix bugs` / `dix bugs`，回滚定位成本高。
- [ ] `sw.js` 的 `base` 变量计算后未使用（死代码）；`ASSETS_TO_CACHE` 需与实际 import 对齐。

### ✅ 已完成（归档）
- [x] **`importBackup` 未实现** → 已补 `restoreFromPayload`（校验 + dataURL 转 Blob + 先清后写）+ `importBackup`。
- [x] **云同步四个按钮** → 已接 `webdavService`，与本地备份共用打包 / 恢复逻辑；账号与路径存 localStorage，密码不落盘。
- [x] **阶段一 数据闭环** → 统一备份（乐谱 + 打卡 + 进度，`v0.0.3` 格式）、预留字段全部启用、导入导出云同步共用同一份载荷。
- [x] **标签与分类** → 一书多标 + 标签过滤栏。
- [x] **沉浸式阅读** → 进度双轨制、热区固定在视口两侧并内缩、切歌保位、阅读态工具栏精简。
- [x] **迷你节拍器体验** → 启停可用、悬停实体化、与主节拍器互斥。
- [x] **云同步通道自愈** → 多通道候选 + 超时换线 + 「测试连接」，见 A1。
- [x] **空备份保护** → 见 A3。
- [x] **SW 缓存补齐** → `js/services/webdav.js` 曾漏在 `ASSETS_TO_CACHE` 外，离线时读谱器会因静态 import 失败而整个加载不出来（v0.0.5.7 已补）。
- [x] **本地代理下跑通云端**（仅开发机 + 本地代理成立；生产可用性见 A1）。

---

## 💡 六、给开发者的避坑指南（写给未来的自己）

1. **缓存魔咒**：只要改了代码，一定要把 `sw.js` 的 `APP_VERSION` 升一位（如 0.0.5.5 → 0.0.5.6），否则 cache-first 会永远喂旧文件，"改了却看不到"。
2. **路径刺客**：`pdf.js` 必须用 `./js/lib/...` 相对路径本地化加载，手机端某些浏览器极其严格。
3. **音频叠加**：Web Audio 定时器（lookahead setInterval）退出时务必 clearInterval，避免多次开关后声音重叠；两套节拍器之间用 `mini-metronome-start` 事件互斥。
4. **切勿推倒重来**：零构建、原生 Web、拖拽部署的轻量架构就是独立开发者最敏捷的武器。切香肠式开发，享受每一次微小的迭代。
5. **进度是双轨制**：手动（「📍 存进度」按钮 / 打卡勾选）+ 弱自动（返回书架必存、每 5 分钟静默存）。**不要**改成"滚动即写库"——那正是旧版进度永远滞后一个会话的根源。
6. **恢复要原子**：`restoreFromPayload` 先把所有 dataURL 转成 Blob 并校验，全部成功后才 `clearAllData()` 再 `bulkImport`；顺序反过来会在中途失败时把用户数据清空。
7. **iframe 已死，勿再回魂**：PC 端 PDF 曾经用浏览器自带阅读器（iframe），它劫持滚动与事件、跨文档读不到 `scrollTop`，才导致进度失效。现在全平台 Canvas 统一渲染，任何"为了显示清晰"想换回 iframe 的改动都会连带摧毁进度、翻页热区与节拍器虚化。
8. **加字段 ≠ 升库版本**：IndexedDB 的 object store 没有固定表结构，给记录加新字段只需在读写处归一化缺省值（`|| 0`），不需要动 `DB_VERSION`，避免触发全量升级迁移。
9. **DOM 元素找引用，别靠闭包**：迷你节拍器"停止按钮失效"的根因是停止函数依赖局部 `const mmPlay`；在需要跨函数修改的 UI 元素上，用 `this.shadowRoot.getElementById(...)` 实时获取最稳。
10. **浮层要脱离滚动容器，还要内缩**：翻页热区原先放在 `#viewer` 内，会随谱面一起滚走；凡是"贴着视口"的控件（热区、进度药丸、迷你节拍器）都必须挂在 `:host` 直属层并用 `position:absolute` 定位，同时离左右边缘留出 20px+ 的安全距离——否则会压住竖向滚动条、并吞掉手机边缘返回手势。
11. **样式里的 `!important` 会打败内联样式**：`.pc-actions` 曾用 `display:flex !important`，导致 `element.style.display='none'` 完全失效（阅读态按钮藏不掉、移动端两组按钮同时出现）。需要 JS 控制显隐的元素，样式表里不要加 `!important`。
12. **切歌前先存位**：任何"离开当前谱"的入口（返回书架、左右翻页）都必须先 `saveReadingProgress()`；只在 `btnBack` 里保存，翻页换谱就会丢位置。
13. **云同步通道必须能换**：`*.workers.dev` 在部分网络是整段连接超时（`UND_ERR_CONNECT_TIMEOUT`），端点绝不写死。`webdav.js` 现在按「本地代理（仅 http 调试页）→ 自建域名 `dav.noamet.ccwu.cc` → Worker」回落，用户手填的「同步通道」永远最高优先；排查时先点「测试连接」看哪条路活着。另外，被静态 `import` 的服务文件必须进 `sw.js` 的 `ASSETS_TO_CACHE`——`webdav.js` 曾漏掉，离线打开读谱器会整个加载失败。
14. **版本号有两处**：`sw.js` 是 classic script，不能 `import`，所以 `APP_VERSION` 同时写在 `sw.js` 与 `js/services/version.js`。改版本时两处一起改，并确认新文件已进 `ASSETS_TO_CACHE`（`version.js` 漏掉会让读谱器整个 import 失败）。
15. **同步点的 key 要带路径**：`gs_cloud_sync:<path>` 而不是全局一个时间戳——换账号、换备份路径时，旧的同步点会把「同一份文件」误判成别人改过。
16. **密码只进 vault，不进任何其它地方**：应用密码用 `vault.js` 加密后存在独立库 `GuitarShellVault`，密钥 `extractable=false`。别图省事写进 localStorage、别拼进备份 JSON、别 `console.log`。局域网 `http://192.168.x.x` 不是安全上下文，`crypto.subtle` 为 undefined，此时保存功能自动隐藏——要持久化就开 `localhost` 或 HTTPS。
17. **音频只走 `audio.js`，别再 `new AudioContext()`**：全应用共用一个上下文，组件里任何地方 `close()` 都会让后续节拍器 / 调音器一起变哑（旧调音器 `stopTuner` 就栽在这）。新功能要发声，用 `audioEngine.click()` 或 `startMetronome()`；麦克风用 `openAnalyser(stream)`，停的时候只 `dispose()` + 停轨。
18. **节拍互斥在引擎里，不靠事件**：`startMetronome()` 会自动停掉上一路并给它 `onStop('preempted')`；组件收到这个理由时才复位自己的按钮，用户自己点停会先把本地 `isPlaying` 置 false，`onStop` 里再判断一次，避免递归停。


