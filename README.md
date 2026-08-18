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

安装包输出到 `outputs/Berry-Workout-Island-Setup-0.5.4.exe`。桌面版在本机保存游戏进度、日记历史、自评分和猫咪名字，并支持检查 GitHub Releases 更新。

## 数据位置

- 网页版：游戏状态保存在浏览器，打卡记录保存在 Sites D1。
- Windows 版：游戏状态、打卡记录与自评分同时写入网页存储和独立本地数据文件，不会上传给屋主。
- Windows 版更新完成后，首次启动会自动弹出当前版本的更新说明。

## 商店与调酒

- 在商店的“调酒配料”分类用草莓购买基酒、利口酒、果汁、汽水、糖浆和装饰物；冰块免费且不限量。
- 点击房间里的吧台进入调酒小游戏。选择现有库存、调整用量和制作方式后即可出杯，成功会解锁配方图鉴。
- 配料库存、草莓余额、已解锁配方和最佳品质与原有游戏状态一起保存；中途退出不会消耗材料。
- 配料、价格和配方统一配置在 `app/game/cocktails.ts`，新增内容时优先修改该文件并补充回归检查。
