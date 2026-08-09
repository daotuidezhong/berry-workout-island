# 草莓打卡屋

一个把运动打卡、宠物状态和房间布置结合起来的网页 / Windows 桌面小游戏。

## 项目入口

- 项目架构与待修改清单：[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- 设计验收记录：[`docs/design-qa.md`](docs/design-qa.md)
- 网页主界面：[`app/page.tsx`](app/page.tsx)
- Windows 桌面入口：[`desktop/main.tsx`](desktop/main.tsx)

## 常用命令

```bash
npm install
npm run dev
npm run build
npm test
```

## Windows 安装版

```bash
npm run desktop:build
```

安装包输出到 `outputs/Berry-Workout-Island-Setup-0.2.0.exe`。桌面版在本机保存游戏进度、打卡历史、心情和猫咪名字，并支持检查 GitHub Releases 更新。

## 数据位置

- 网页版：游戏状态保存在浏览器，打卡记录保存在 Sites D1。
- Windows 版：游戏状态与打卡记录保存在本机；下载者知情同意后，运动记录与心情会同步备份到 Sites D1。
- 屋主备份页：`/admin`，需要使用屋主 ChatGPT 账号登录。
