# OH 像素生活日记小屋

一个把每日生活日记、猫咪陪伴、院子种植、厨房烹饪和房间布置结合起来的网页 / Windows 桌面小游戏。

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

安装包输出到 `outputs/Berry-Workout-Island-Setup-0.5.2.exe`。桌面版在本机保存游戏进度、日记历史、自评分和猫咪名字，并支持检查 GitHub Releases 更新。

## 数据位置

- 网页版：游戏状态保存在浏览器，打卡记录保存在 Sites D1。
- Windows 版：游戏状态、打卡记录与自评分同时写入网页存储和独立本地数据文件，不会上传给屋主。
- Windows 版更新完成后，首次启动会自动弹出当前版本的更新说明。
