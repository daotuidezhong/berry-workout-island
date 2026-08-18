export type IngredientCategory = "base_spirit" | "liqueur" | "juice" | "mixer" | "syrup" | "garnish";
export type IngredientUnit = "ml" | "portion";
export type CocktailMethod = "shake" | "stir" | "build";
export type CocktailQuality = "完美" | "优秀" | "普通" | "失败";

export type IngredientId =
  | "gin" | "vodka" | "whiteRum" | "tequila" | "whisky" | "orangeLiqueur"
  | "tonic" | "soda" | "cola" | "orangeJuice" | "limeJuice" | "lemonJuice"
  | "simpleSyrup" | "grenadine" | "mint" | "ice";

export type StockedIngredientId = Exclude<IngredientId, "ice">;
export type IngredientInventory = Record<StockedIngredientId, number>;
export type MixAmounts = Partial<Record<IngredientId, number>>;

export type IngredientDefinition = {
  id: IngredientId;
  name: string;
  category: IngredientCategory;
  packageAmount: number;
  unit: IngredientUnit;
  price: number;
  iconIndex: number;
  description: string;
  relatedCocktails: string[];
  properties: {
    alcohol: number;
    sweetness: number;
    acidity: number;
    bitterness: number;
    color: string;
    carbonated: boolean;
  };
};

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  base_spirit: "基酒",
  liqueur: "利口酒",
  juice: "果汁",
  mixer: "软饮",
  syrup: "糖浆",
  garnish: "辅料",
};

export const COCKTAIL_METHOD_LABELS: Record<CocktailMethod, string> = {
  shake: "摇和 Shake",
  stir: "搅拌 Stir",
  build: "直接调和 Build",
};

export const ingredientItems: IngredientDefinition[] = [
  { id: "gin", name: "金酒", category: "base_spirit", packageAmount: 750, unit: "ml", price: 36, iconIndex: 0, description: "清新的杜松子香气，适合清爽长饮。", relatedCocktails: ["金汤力", "汤姆柯林斯"], properties: { alcohol: 40, sweetness: 0, acidity: 0, bitterness: 2, color: "#dff4f1", carbonated: false } },
  { id: "vodka", name: "伏特加", category: "base_spirit", packageAmount: 750, unit: "ml", price: 34, iconIndex: 1, description: "干净利落的基酒，让果汁风味更突出。", relatedCocktails: ["螺丝刀", "伏特加苏打"], properties: { alcohol: 40, sweetness: 0, acidity: 0, bitterness: 0, color: "#f2f7f2", carbonated: false } },
  { id: "whiteRum", name: "白朗姆酒", category: "base_spirit", packageAmount: 750, unit: "ml", price: 36, iconIndex: 2, description: "带轻柔甘蔗香，适合热带风味。", relatedCocktails: ["自由古巴", "莫吉托", "代基里"], properties: { alcohol: 40, sweetness: 1, acidity: 0, bitterness: 0, color: "#fff3c9", carbonated: false } },
  { id: "tequila", name: "龙舌兰酒", category: "base_spirit", packageAmount: 750, unit: "ml", price: 44, iconIndex: 3, description: "明亮辛香的基酒，和柑橘非常合拍。", relatedCocktails: ["玛格丽特", "龙舌兰日出"], properties: { alcohol: 40, sweetness: 0, acidity: 0, bitterness: 2, color: "#f2c56f", carbonated: false } },
  { id: "whisky", name: "威士忌", category: "base_spirit", packageAmount: 750, unit: "ml", price: 46, iconIndex: 4, description: "温暖的木香与焦糖香，适合酸甜配方。", relatedCocktails: ["威士忌酸", "威士忌可乐"], properties: { alcohol: 40, sweetness: 1, acidity: 0, bitterness: 2, color: "#b96827", carbonated: false } },
  { id: "orangeLiqueur", name: "橙味利口酒", category: "liqueur", packageAmount: 500, unit: "ml", price: 38, iconIndex: 5, description: "甜橙香气浓郁，连接龙舌兰与青柠。", relatedCocktails: ["玛格丽特"], properties: { alcohol: 30, sweetness: 4, acidity: 1, bitterness: 1, color: "#e88327", carbonated: false } },
  { id: "tonic", name: "汤力水", category: "mixer", packageAmount: 330, unit: "ml", price: 6, iconIndex: 6, description: "带气泡与轻微苦味的经典搭档。", relatedCocktails: ["金汤力"], properties: { alcohol: 0, sweetness: 2, acidity: 1, bitterness: 4, color: "#eff2cf", carbonated: true } },
  { id: "soda", name: "苏打水", category: "mixer", packageAmount: 330, unit: "ml", price: 5, iconIndex: 7, description: "清爽气泡让长饮更轻盈。", relatedCocktails: ["莫吉托", "汤姆柯林斯", "伏特加苏打"], properties: { alcohol: 0, sweetness: 0, acidity: 0, bitterness: 0, color: "#e8f8ff", carbonated: true } },
  { id: "cola", name: "可乐", category: "mixer", packageAmount: 330, unit: "ml", price: 6, iconIndex: 8, description: "焦糖甜香适合朗姆酒和威士忌。", relatedCocktails: ["自由古巴", "威士忌可乐"], properties: { alcohol: 0, sweetness: 4, acidity: 1, bitterness: 1, color: "#4c251d", carbonated: true } },
  { id: "orangeJuice", name: "橙汁", category: "juice", packageAmount: 1000, unit: "ml", price: 10, iconIndex: 9, description: "果香甜润，是明亮长饮的基础。", relatedCocktails: ["螺丝刀", "龙舌兰日出"], properties: { alcohol: 0, sweetness: 3, acidity: 2, bitterness: 0, color: "#f39a24", carbonated: false } },
  { id: "limeJuice", name: "青柠汁", category: "juice", packageAmount: 250, unit: "ml", price: 12, iconIndex: 10, description: "锐利清新的酸味，用来提亮酒体。", relatedCocktails: ["玛格丽特", "莫吉托", "代基里"], properties: { alcohol: 0, sweetness: 0, acidity: 5, bitterness: 1, color: "#9ecb46", carbonated: false } },
  { id: "lemonJuice", name: "柠檬汁", category: "juice", packageAmount: 250, unit: "ml", price: 11, iconIndex: 11, description: "明快酸味适合酸酒与气泡长饮。", relatedCocktails: ["威士忌酸", "汤姆柯林斯"], properties: { alcohol: 0, sweetness: 0, acidity: 5, bitterness: 1, color: "#f3d94d", carbonated: false } },
  { id: "simpleSyrup", name: "简单糖浆", category: "syrup", packageAmount: 250, unit: "ml", price: 14, iconIndex: 12, description: "柔和甜味，负责平衡柑橘酸度。", relatedCocktails: ["威士忌酸", "代基里", "汤姆柯林斯"], properties: { alcohol: 0, sweetness: 5, acidity: 0, bitterness: 0, color: "#f4e0af", carbonated: false } },
  { id: "grenadine", name: "红石榴糖浆", category: "syrup", packageAmount: 250, unit: "ml", price: 16, iconIndex: 13, description: "红润果甜，为饮品添上日出渐层。", relatedCocktails: ["龙舌兰日出"], properties: { alcohol: 0, sweetness: 5, acidity: 1, bitterness: 0, color: "#c72e45", carbonated: false } },
  { id: "mint", name: "薄荷叶", category: "garnish", packageAmount: 10, unit: "portion", price: 6, iconIndex: 14, description: "一份清凉草本香，是莫吉托的灵魂。", relatedCocktails: ["莫吉托"], properties: { alcohol: 0, sweetness: 0, acidity: 0, bitterness: 2, color: "#4b9d5c", carbonated: false } },
  { id: "ice", name: "冰块", category: "garnish", packageAmount: 0, unit: "portion", price: 0, iconIndex: 15, description: "吧台常备，免费且不限量。", relatedCocktails: ["全部长饮"], properties: { alcohol: 0, sweetness: 0, acidity: 0, bitterness: 0, color: "#dff5ff", carbonated: false } },
];

export const INITIAL_INGREDIENT_INVENTORY: IngredientInventory = {
  gin: 0,
  vodka: 0,
  whiteRum: 0,
  tequila: 0,
  whisky: 0,
  orangeLiqueur: 0,
  tonic: 0,
  soda: 0,
  cola: 0,
  orangeJuice: 0,
  limeJuice: 0,
  lemonJuice: 0,
  simpleSyrup: 0,
  grenadine: 0,
  mint: 0,
};

export type CocktailId = "ginTonic" | "screwdriver" | "cubaLibre" | "whiskySour" | "margarita" | "mojito" | "daiquiri" | "tomCollins" | "tequilaSunrise" | "vodkaSoda";

export type CocktailRecipe = {
  id: CocktailId;
  name: string;
  ingredients: { ingredientId: IngredientId; amount: number; tolerance: number }[];
  method: CocktailMethod;
  color: string;
  description: string;
  clue: string;
  baseHint: string;
  difficulty: number;
};

export const cocktailRecipes: CocktailRecipe[] = [
  { id: "ginTonic", name: "金汤力", ingredients: [{ ingredientId: "gin", amount: 45, tolerance: 5 }, { ingredientId: "tonic", amount: 120, tolerance: 10 }], method: "build", color: "#e9f2d3", description: "杜松子香与汤力气泡交织的清爽经典。", clue: "清爽、微苦，还会冒出细小气泡。", baseHint: "可能需要金酒", difficulty: 1 },
  { id: "screwdriver", name: "螺丝刀", ingredients: [{ ingredientId: "vodka", amount: 45, tolerance: 5 }, { ingredientId: "orangeJuice", amount: 90, tolerance: 10 }], method: "build", color: "#efa137", description: "橙汁的明亮果香包裹干净的伏特加。", clue: "像一杯带有成熟酒香的橙汁。", baseHint: "可能需要伏特加", difficulty: 1 },
  { id: "cubaLibre", name: "自由古巴", ingredients: [{ ingredientId: "whiteRum", amount: 45, tolerance: 5 }, { ingredientId: "cola", amount: 120, tolerance: 10 }, { ingredientId: "limeJuice", amount: 10, tolerance: 5 }], method: "build", color: "#6b3726", description: "朗姆、可乐与一抹青柠组成的畅快长饮。", clue: "深色气泡里藏着一点清亮酸香。", baseHint: "可能需要白朗姆酒", difficulty: 2 },
  { id: "whiskySour", name: "威士忌酸", ingredients: [{ ingredientId: "whisky", amount: 45, tolerance: 5 }, { ingredientId: "lemonJuice", amount: 25, tolerance: 5 }, { ingredientId: "simpleSyrup", amount: 15, tolerance: 5 }], method: "shake", color: "#d39a4c", description: "木香、柠檬与糖浆形成温暖的酸甜平衡。", clue: "木质酒香需要酸与甜一起托住。", baseHint: "可能需要威士忌", difficulty: 2 },
  { id: "margarita", name: "玛格丽特", ingredients: [{ ingredientId: "tequila", amount: 45, tolerance: 5 }, { ingredientId: "orangeLiqueur", amount: 20, tolerance: 5 }, { ingredientId: "limeJuice", amount: 25, tolerance: 5 }], method: "shake", color: "#d7d36a", description: "龙舌兰、甜橙与青柠构成鲜明爽利的层次。", clue: "柑橘酸香中还需要一层甜橙。", baseHint: "可能需要龙舌兰酒", difficulty: 3 },
  { id: "mojito", name: "莫吉托", ingredients: [{ ingredientId: "whiteRum", amount: 45, tolerance: 5 }, { ingredientId: "limeJuice", amount: 20, tolerance: 5 }, { ingredientId: "simpleSyrup", amount: 15, tolerance: 5 }, { ingredientId: "mint", amount: 1, tolerance: 0 }, { ingredientId: "soda", amount: 90, tolerance: 10 }], method: "build", color: "#b9d99e", description: "薄荷、青柠和气泡把朗姆酒变得格外轻盈。", clue: "清凉草本、酸甜与气泡缺一不可。", baseHint: "可能需要白朗姆酒", difficulty: 3 },
  { id: "daiquiri", name: "代基里", ingredients: [{ ingredientId: "whiteRum", amount: 50, tolerance: 5 }, { ingredientId: "limeJuice", amount: 25, tolerance: 5 }, { ingredientId: "simpleSyrup", amount: 15, tolerance: 5 }], method: "shake", color: "#dce5a0", description: "朗姆、青柠与糖浆的简洁三角平衡。", clue: "三种材料，酸甜围绕甘蔗酒香。", baseHint: "可能需要白朗姆酒", difficulty: 2 },
  { id: "tomCollins", name: "汤姆柯林斯", ingredients: [{ ingredientId: "gin", amount: 45, tolerance: 5 }, { ingredientId: "lemonJuice", amount: 25, tolerance: 5 }, { ingredientId: "simpleSyrup", amount: 15, tolerance: 5 }, { ingredientId: "soda", amount: 90, tolerance: 10 }], method: "shake", color: "#e9df98", description: "金酒酸甜调和后，由苏打水带来轻快气泡。", clue: "杜松子、柠檬、甜味和气泡的组合。", baseHint: "可能需要金酒", difficulty: 3 },
  { id: "tequilaSunrise", name: "龙舌兰日出", ingredients: [{ ingredientId: "tequila", amount: 45, tolerance: 5 }, { ingredientId: "orangeJuice", amount: 90, tolerance: 10 }, { ingredientId: "grenadine", amount: 15, tolerance: 5 }], method: "build", color: "#e77a39", description: "橙汁与红石榴糖浆在龙舌兰中染出日出渐层。", clue: "橙色果香的杯底需要一抹红。", baseHint: "可能需要龙舌兰酒", difficulty: 2 },
  { id: "vodkaSoda", name: "伏特加苏打", ingredients: [{ ingredientId: "vodka", amount: 45, tolerance: 5 }, { ingredientId: "soda", amount: 120, tolerance: 10 }, { ingredientId: "limeJuice", amount: 10, tolerance: 5 }], method: "build", color: "#e0f0dc", description: "干净酒体、苏打气泡与一线青柠的极简长饮。", clue: "透明气泡中只留下一点青柠清香。", baseHint: "可能需要伏特加", difficulty: 1 },
];

export type CocktailCollectionEntry = { cocktailId: CocktailId; unlocked: boolean; bestScore: number; bestQuality: CocktailQuality };
export type CocktailCollection = Record<CocktailId, CocktailCollectionEntry>;

export function createInitialCocktailCollection(): CocktailCollection {
  return Object.fromEntries(cocktailRecipes.map((recipe) => [recipe.id, { cocktailId: recipe.id, unlocked: false, bestScore: 0, bestQuality: "失败" }])) as CocktailCollection;
}

export function getIngredient(id: IngredientId) {
  return ingredientItems.find((item) => item.id === id)!;
}

export function getIngredientStock(inventory: IngredientInventory, id: IngredientId) {
  return id === "ice" ? Infinity : inventory[id];
}

export function formatIngredientAmount(amount: number, unit: IngredientUnit) {
  return unit === "ml" ? `${amount}ml` : `${amount}份`;
}

export function getLiquidTotal(amounts: MixAmounts) {
  return Object.entries(amounts).reduce((total, [id, amount]) => total + (getIngredient(id as IngredientId).unit === "ml" ? amount ?? 0 : 0), 0);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getQuality(score: number): CocktailQuality {
  if (score >= 90) return "完美";
  if (score >= 75) return "优秀";
  if (score >= 60) return "普通";
  return "失败";
}

function getMysteryFeedback(amounts: MixAmounts, closest: CocktailRecipe, missing: IngredientId[], extras: IngredientId[]) {
  if (extras.length) return "加入了不协调的材料，先试着让风味更专注。";
  if (missing.length) return `已经很接近某种鸡尾酒了，线索：${closest.clue}`;
  let total = 0;
  let alcohol = 0;
  let sweetness = 0;
  let acidity = 0;
  let bitterness = 0;
  for (const [id, amount] of Object.entries(amounts)) {
    const ingredient = getIngredient(id as IngredientId);
    const weight = ingredient.unit === "ml" ? amount ?? 0 : (amount ?? 0) * 10;
    total += weight;
    alcohol += ingredient.properties.alcohol * weight;
    sweetness += ingredient.properties.sweetness * weight;
    acidity += ingredient.properties.acidity * weight;
    bitterness += ingredient.properties.bitterness * weight;
  }
  if (!total) return "杯子还是空的，先挑选喜欢的材料吧。";
  if (alcohol / total > 22) return "酒味太重，需要更多能拉开层次的材料。";
  if (acidity / total > 3.2) return "酸味太强，试着补一点甜味或软饮。";
  if (sweetness / total > 3.7) return "甜度过高，需要酸味或气泡找回平衡。";
  if (bitterness / total > 2.7) return "苦味过重，比例还可以再柔和一点。";
  return "味道已经成形，不过还缺少平衡味道的材料。";
}

export type CocktailResult = {
  recipe: CocktailRecipe;
  score: number;
  quality: CocktailQuality;
  success: boolean;
  missing: IngredientId[];
  extras: IngredientId[];
  feedback: string;
};

export function evaluateCocktail(amounts: MixAmounts, method: CocktailMethod): CocktailResult {
  const usedIds = Object.entries(amounts).filter(([id, amount]) => id !== "ice" && (amount ?? 0) > 0).map(([id]) => id as IngredientId);
  const ranked = cocktailRecipes.map((recipe) => {
    const requiredIds = recipe.ingredients.map((item) => item.ingredientId);
    const missing = requiredIds.filter((id) => !(amounts[id] && amounts[id]! > 0));
    const extras = usedIds.filter((id) => !requiredIds.includes(id));
    let score = 100;
    for (const expected of recipe.ingredients) {
      const actual = amounts[expected.ingredientId] ?? 0;
      if (!actual) {
        score -= 35;
        continue;
      }
      const outsideTolerance = Math.max(0, Math.abs(actual - expected.amount) - expected.tolerance);
      score -= Math.min(22, (outsideTolerance / expected.amount) * 55);
    }
    score -= Math.min(45, extras.length * 25);
    if (recipe.method !== method) score -= 15;
    const finalScore = clampScore(score);
    return { recipe, score: finalScore, missing, extras };
  }).sort((left, right) => right.score - left.score);

  const best = ranked[0];
  const success = best.score >= 60 && best.missing.length === 0 && best.extras.length === 0;
  const quality = success ? getQuality(best.score) : "失败";
  const feedback = success
    ? best.score >= 90
      ? `比例非常漂亮，这是一杯完美的${best.recipe.name}。`
      : best.recipe.method === method
        ? "调制方式正确，材料比例还可以更精准。"
        : "味道已经成形，下次换一种调制方式会更接近标准。"
    : getMysteryFeedback(amounts, best.recipe, best.missing, best.extras);
  return { ...best, success, quality, feedback };
}

export function mixIngredientColors(amounts: MixAmounts) {
  let total = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const [id, amount] of Object.entries(amounts)) {
    const ingredient = getIngredient(id as IngredientId);
    if (ingredient.unit !== "ml" || !amount) continue;
    const color = ingredient.properties.color.replace("#", "");
    total += amount;
    red += Number.parseInt(color.slice(0, 2), 16) * amount;
    green += Number.parseInt(color.slice(2, 4), 16) * amount;
    blue += Number.parseInt(color.slice(4, 6), 16) * amount;
  }
  if (!total) return "#f7d8c8";
  return `rgb(${Math.round(red / total)} ${Math.round(green / total)} ${Math.round(blue / total)})`;
}
