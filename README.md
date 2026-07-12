# 叠趣 Stack Joy

一款基于 Canvas 的 3D 等距方块堆叠游戏。

## 试玩

https://yuzhichenai.github.io/diequ/

## 玩法

方块从两侧交替滑入，点击或按空格键放置。  
对齐越准，方块保留越多；完美对齐可触发连击加分。

- 每次放置会切除未对齐部分
- 连续完美放置累积连击（x2, x3…）
- 方块越来越小、速度越来越快
- 重叠不足 15 像素时游戏结束

## 操作

鼠标 / 触屏点击 &nbsp;·&nbsp; 空格键放置

## 技术栈

纯 HTML + CSS + JavaScript（Canvas 2D）

- 等距 3D 投影渲染
- 逐帧动画（requestAnimationFrame）
- 粒子特效系统
- GitHub Pages 部署

## 版本

v1.0.0 — 2026-07-12
