const activities = [
  { words: ["跳绳"], met: 10 },
  { words: ["爬楼", "楼梯"], met: 8.8 },
  { words: ["跑步", "慢跑"], met: 8.3 },
  { words: ["游泳"], met: 8 },
  { words: ["骑车", "单车", "自行车"], met: 7.5 },
  { words: ["篮球", "足球", "羽毛球", "网球"], met: 7 },
  { words: ["舞蹈", "跳舞", "有氧操"], met: 6 },
  { words: ["力量", "举铁", "健身"], met: 5.5 },
  { words: ["快走", "散步", "走路"], met: 3.8 },
  { words: ["瑜伽", "普拉提", "拉伸"], met: 3 },
];

export function estimateCalories(activity: string, minutes: number) {
  if (!activity.trim() || !Number.isFinite(minutes) || minutes <= 0) return 0;
  const met = activities.find((item) => item.words.some((word) => activity.includes(word)))?.met ?? 5;
  return Math.round(met * 3.5 * 60 / 200 * Math.min(minutes, 600));
}
