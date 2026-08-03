# Design QA

- 原始室内素材：`public/game/room-v2.png`
- 小雨场景素材：`public/game/room-rain.png`
- 浏览器复查截图：`work/rainy-scene-preview/implementation-night-bright-1801x1272.jpg`
- 复查视口：1801 × 1272 CSS px
- 复查状态：佛山 / 小雨 / 19:00 / night

## 复查结论

- 室内家具、墙面、窗帘、门和木地板保持原来的暖色，不再进行灰蓝、色相或饱和度重染。
- 小雨只通过独立场景素材改变窗外景色、玻璃雨丝和直射光区域，不再叠加一层覆盖窗框的天气贴图。
- 夜间整屋滤镜由 `brightness(.47) saturate(.7) hue-rotate(12deg)` 改为轻微的 `brightness(.97)`。
- 已移除夜间深蓝全屏遮罩；只保留边缘 12% 强度的中性暗角。
- 浏览器实测背景为 `/game/room-rain.png`，计算滤镜为 `brightness(0.97)`。
- 生产构建通过，7 项测试全部通过，包含防止天气和时段重新给室内偏色的回归检查。

final result: passed

## 傍晚落日场景

- 参考图仅用于橙红天空、遮日云层和明暗层次；室内结构与像素风以 `room-v2.png` 为准。
- 新素材：`public/game/room-evening.png`，尺寸 1672 × 941，与原场景一致。
- 浏览器验收图：`work/rainy-scene-preview/evening-scene-browser-preview.jpg`。
- 傍晚晴天或多云使用落日素材；傍晚雨天和雷暴继续使用对应天气素材。
- 主窗六块玻璃与门上四块玻璃呈现同一方向的落日；室内没有全局橙色重染。
- 原有白色直射光和硬边窗格投影已移除，只保留柔和的局部暖光。

## 早晨晨景

- 新素材：`public/game/room-morning.png`，尺寸 1672 × 941，与原场景一致。
- 早晨晴天或多云使用晨景；早晨雨天和雷暴继续使用对应天气素材。
- 主窗和门玻璃统一呈现浅蓝、淡粉与杏金的晨空、薄云和带晨雾的树影。
- 室内保持原始暖色与亮度；原有硬边窗格投影替换为柔和的局部晨光。

## 多云与雷暴大雨

- 多云新版：`public/game/room-cloudy-v2.png`，尺寸 1672 × 941；云层有厚薄层次，无雨丝、闪电和太阳直射。
- 雷暴大雨新版：`public/game/room-thunderstorm-v2.png`，尺寸 1672 × 941；包含厚重雷云、高密度斜向雨幕、低能见度树影和远处闪电。
- 雨幕和闪电只出现在主窗与门玻璃后，不覆盖木质窗框、墙面、家具或地板。
- 两个版本均保持室内原始暖色和可用亮度，并移除白天的硬边窗格投影。

## 宠物状态与商店反馈

- 已移除右上角天气信息条；天气仍在后台驱动场景素材切换。
- 页面运行期间每 5 分钟，活力和困倦值各减少 1，最低为 0，并沿用现有本地持久化。
- 困倦值低于 10 时，点击地面、键盘方向键和点击家具均停止移动并播放摇头提示。
- 六种食品卡片直接显示对应活力恢复值：14、20、26、30、24、17。
- 三种猫窝按价格显示不同困倦值恢复量：45 草莓恢复 30、95 草莓恢复 55、120 草莓恢复 80。
- 浏览器复查图：`work/comment-fixes-store-qa.jpg`。

## 三小时猫窝睡眠

- 三只猫新增与原角色配色一致的侧躺睡姿：`public/game/cat-orange-sleep.png`、`public/game/cat-cow-sleep.png`、`public/game/cat-white-sleep.png`。
- 点击猫窝后，猫先移动到窝上，再开始 3:00:00 倒计时；困倦值不会立即增加。
- 睡眠中使用轻微呼吸起伏动画，禁止地面点击和键盘方向移动，并暂停活力、困倦值的自然衰减。
- 睡眠结束时间和猫窝恢复量保存在游戏状态中；刷新页面后继续倒计时，满三小时后只结算一次对应恢复量。
- 困倦值低于 10 时仍可点击猫窝入睡，其他移动继续播放摇头拒绝动画。
- 浏览器隔离状态实测：开始睡眠显示 `2:59:59`，方向键提示“正在睡觉”，刷新后倒计时和原困倦值均保持；实装截图见 `work/sleep-sprites/sleep-browser-qa.png`，三只睡姿与猫窝叠放预览见 `work/sleep-sprites/sleep-preview.png`。
- 生产构建、10 项自动测试和 `git diff --check` 均通过。

## 睡眠打断与起床动画

- 睡眠开始 0.9 秒后，鼠标再次在房间内移动会显示“是否要打断睡眠？”确认弹窗；弹窗提供“继续睡觉”和“打断睡眠”两个明确选项。
- 选择继续睡觉时保留原结束时间和待恢复值，关闭弹窗后设置 1.2 秒防误触间隔。
- 选择打断睡眠时立即清空 `sleepEndsAt` 与 `sleepRest`，困倦值不增加；起床动画播放期间继续禁止移动。
- 三只猫新增过渡帧：`public/game/cat-orange-wake.png`、`public/game/cat-cow-wake.png`、`public/game/cat-white-wake.png`。
- 动画顺序为“原睡姿 → 撑起并开始哈欠 → 原有完整哈欠序列 → 待机”；所有帧使用同一个固定尺寸猫咪容器和 `scale(1)`，尺寸与基线校准直接烘焙进透明素材。
- 隔离浏览器状态验证：确认弹窗出现；继续睡觉后倒计时保留；再次确认打断后困倦值保持 24、倒计时消失；实际资源序列依次播放 `wake → yawn-1 → yawn-2 → yawn-3 → yawn-4 → yawn-4 → yawn-3 → yawn-2 → yawn-1 → idle`。
- 验收素材：`work/wake-sprites/interrupt-dialog-qa.png`、`work/wake-sprites/wake-sequence-preview.png`、`work/wake-sprites/wake-animation-preview.gif`。
- 生产构建、11 项自动测试和 `git diff --check` 均通过。

## 游戏猫爪光标

- 使用 32×32 PNG 猫爪光标：`public/game/cursor-cat-paw.png`，包含四颗粉色脚趾豆、圆润肉垫、深棕描边和奶油色外沿，热点位于 `(15, 15)`。
- 光标资源只在 `.game-stage` 声明一次，全部子元素通过 `cursor: inherit` 继承，避免 SVG 在快速移动和跨元素时反复重绘造成闪烁。
- 旧的 `cursor-cat-paw.svg` 已移除；原有 `crosshair`、`pointer`、`grab` 与 `grabbing` 均被继承规则覆盖。
- 浏览器快速跨越房间、商店菜单和猫窝前后，三处计算样式始终为 `url("/game/cursor-cat-paw.png") 15 15, auto`。
- 生产构建、12 项自动测试和 `git diff --check` 均通过。

## 起床动画固定尺寸修正

- 移除睡眠和起床状态原先单独放大的容器宽度，所有状态统一使用 `.walking-cat` 的基础宽度。
- 移除起床序列中 `.82`、`.7` 和按猫咪变化的运行时缩放；浏览器逐帧读取均为 `translateY(0%) scale(1, 1)`。
- 为三只猫各自生成 4 张仅供起床动画使用的标准化哈欠帧 `cat-*-wake-yawn-1..4.png`，不影响原有自主哈欠动画。
- 撑起帧的基线按睡姿与标准化哈欠帧之间的中点重新放置，哈欠帧的可见体型按原角色比例预先烘焙。
- 三只猫固定尺寸对照：`work/wake-sprites/wake-size-normalized-preview.png`；动画预览：`work/wake-sprites/wake-animation-preview.gif`。
- 生产构建、11 项自动测试和 `git diff --check` 均通过。
