# 叠趣 Stack Joy — 项目纪要

## 项目概述

基于 Canvas 2D 的 3D 等距方块堆叠游戏。纯前端，无外部依赖。

- **技术栈**: HTML + CSS + JavaScript (Vanilla)
- **渲染方式**: Canvas 2D 等距投影
- **部署**: GitHub Pages (https://yuzhichenai.github.io/diequ/)

---

## 架构设计

### 文件结构

```
叠趣/
├── index.html     # 主页面，含三个屏幕（开始/游戏/HUD/结束）
├── style.css      # 全局样式、动画、响应式适配
├── game.js        # 所有游戏逻辑（IIFE 自执行）
├── .nojekyll      # 禁止 GitHub Pages 的 Jekyll 处理
└── README.md      # 使用说明
```

### 游戏核心类 (game.js)

| 类/模块 | 职责 |
|---------|------|
| `Game` | 状态管理、游戏循环、放置逻辑、计分 |
| `Block` | 方块数据 + 等距 3D 面绘制 |
| `Particle` | 特效粒子（物理、生命周期） |
| `AmbientParticle` | 背景漂浮光点 |
| `drawFace()` | 绘制等距投影面 |
| `project()` | 3D→2D 等距坐标映射 |

### 游戏状态流

```
menu → (点击开始) → playing → (方块放置) → playing
                   → (重叠 < 15px) → over → (重新开始) → menu → playing
```

---

## 关键决策与教训

### 1. 等距渲染
- 使用 `project(x, y, z)` 将 3D 坐标映射到 2D 屏幕
- 方块绘制顺序: 右侧面 → 左侧面 → 顶面（覆盖边线）
- 角度固定为 cos30° = 0.866, sin30° = 0.5

### 2. 相机跟随（v0.0.2 修复）
- **问题**: 塔超过屏幕高度后顶部不可见
- **解决**: 根据当前方块顶部世界坐标动态计算 cameraY
- `targetCameraY = max(0, targetScreenY + topY - GAME_HEIGHT * 0.72) * 2`
- 缓动系数 0.25 保证平滑跟随

### 3. 滑动幅度（v0.0.2 修复）
- **初始问题**: 使用 `Math.max(40, prev.width / 2 - 10)`，后期方块越小振幅越大，导致完全滑出支撑面
- **解决**: `amplitude = prev.width / 2`，方块始终至少 50% 重叠
- **防止无限**: 配合最小重叠判定 `MIN_BLOCK_SIZE = 15`

### 4. 按钮焦点问题（v0.0.2 第二次修复）
- **问题**: 开始/重新开始按钮点击后保持焦点，空格键同时触发按钮 click 和文档 keydown，导致游戏被重复重置
- **解决**: 按钮加 `tabindex="-1"` + 点击时 `blur()`

### 5. 键盘输入去抖
- 忽略 `e.repeat` 防止操作系统键盘重复
- 120ms 冷却防止多次事件连续触发

### 6. 屏幕清屏（v0.0.2 修复）
- **问题**: 小屏设备 `clearRect(GAME_WIDTH, GAME_HEIGHT)` 在缩放后无法清除全部 canvas 区域
- **解决**: 每帧清除时先 `setTransform(1,0,0,1,0,0)` 再按 `canvas.width/height` 像素级清除

### 7. HUD 遮挡点击（审查发现）
- **问题**: `#hud` 激活时 `pointer-events: auto` 且占满全屏，阻挡 canvas 点击
- **解决**: `#hud.active { pointer-events: none; }`

---

## GitHub 发布流程

```powershell
git init
git add -A
git commit -m "v1.0.0"
git remote add origin https://github.com/yuzhichenai/diequ.git
git push -u origin main
git tag v1.0.0
git push origin v1.0.0
```

### GitHub Pages 部署

```powershell
# 通过 API 启用 Pages
Invoke-WebRequest -Uri "https://api.github.com/repos/yuzhichenai/diequ/pages" -Method Post -Headers @{Authorization="token YOUR_TOKEN"; Accept="application/vnd.github.v3+json"} -Body '{"source":{"branch":"main","path":"/"}}' -ContentType "application/json"

# 更新仓库描述
Invoke-WebRequest -Uri "https://api.github.com/repos/yuzhichenai/diequ" -Method Patch -Headers @{Authorization="token YOUR_TOKEN"} -Body '{"description":"叠趣 - 3D方块堆叠游戏"}'

# 创建 Release
Invoke-WebRequest -Uri "https://api.github.com/repos/yuzhichenai/diequ/releases" -Method Post -Headers @{Authorization="token YOUR_TOKEN"} -Body '{"tag_name":"v1.0.0","name":"v1.0.0","body":"Release notes"}'
```

---

## Windows / 网络注意事项

- PowerShell 中 `curl` 是 `Invoke-WebRequest` 别名，需用 `curl.exe` 调用原生 curl
- `&&` 在 PowerShell 中不可用，用 `; if ($?) { ... }` 替代
- 网络访问受限时：hosts 文件可能被修改，需管理员权限编辑 `C:\Windows\System32\drivers\etc\hosts`
- 可通过 `Resolve-DnsName -DnsOnly` 绕过 hosts 文件进行 DNS 查询
- 提权失败时：写 bat/ps1 脚本到桌面，让用户右键"以管理员身份运行"

---

## v1.0.0 版本参数

| 参数 | 值 |
|------|-----|
| GAME_WIDTH | 400 |
| GAME_HEIGHT | 600 |
| BLOCK_HEIGHT | 25 |
| BASE_SIZE | 220 |
| PERFECT_THRESHOLD | 3 |
| MIN_BLOCK_SIZE | 15 |
| 相机目标屏幕位置 | 30% 从顶部 |
| 相机缓动系数 | 0.25 |
| 放置冷却 | 120ms |
| 速度增长 | 1.5 + level * 0.25 |
