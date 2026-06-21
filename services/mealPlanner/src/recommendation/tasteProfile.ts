import { AiProvider } from "../ai/aiProvider";
import { buildEmbeddingText } from "./embeddingText";
import { meanVector } from "./vectorMath";

export const MIN_LIKES = 3;

export interface TasteRecipe {
  name: string;
  cuisines?: string[];
  dishTypes?: string[];
  diets?: string[];
  ingredients?: { name: string }[];
  embedding?: number[];
  calories?: number;
}

export interface TasteProfile {
  centroid: number[];
  cuisines: string[];
  diet?: string;
  healthGoal?: string;
}

interface BuildArgs {
  likedRecipes: TasteRecipe[];
  currentRecipe: TasteRecipe;
  prefs: { diet?: string; healthGoal?: string };
  provider: AiProvider;
}

const CUISINE_KEYWORDS: [RegExp, string][] = [
  [/\bitalian\b|pasta|pizza|risotto|lasagna|parmesan|marinara|carbonara|pesto|gnocchi|bruschetta|bolognese|fettuccine|linguine|spaghetti|ravioli|tortellini|tiramisu|osso|cacciatore|farfalle|mozzarella|prosciutto|pancetta|focaccia|caprese|minestrone|arancini|saltimbocca|aglio|olio|tagliatelle|penne|rigatoni|orecchiette|ricotta|pecorino|burrata|bresaola|calzone|antipasto|polenta|frittata|carpaccio|arrabiata|amatriciana|cacio|cannoli|gelato|ciabatta|mortadella|stracciatella|piccata|scaloppine|ossobuco/i, "Italian"],
  [/\bmexican\b|taco|burrito|enchilada|quesadilla|guacamole|salsa|tamale|mole|pozole|chilaquile|carnitas|barbacoa|fajita|nachos|churro|horchata|chile relleno|huevos rancheros|menudo|torta|elote|jalapeño|chipotle/i, "Mexican"],
  [/\bjapanese\b|sushi|ramen|teriyaki|tempura|miso|udon|soba|katsu|yakitori|tonkatsu|edamame|gyoza|takoyaki|okonomiyaki|onigiri|wasabi|ponzu|sukiyaki|shabu|nigiri|sashimi|donburi|karaage|matcha/i, "Japanese"],
  [/\bindian\b|curry|tikka|masala|biryani|dal|naan|tandoori|chutney|korma|samosa|paneer|ghee|raita|dosa|idli|pakora|vindaloo|saag|palak|aloo|gobi|rajma|chole|chapati|paratha|lassi|halwa/i, "Indian"],
  [/\bmediterranean\b|falafel|hummus|shawarma|kebab|tahini|pita|baba ganoush|gyro|tzatziki|tabbouleh|fattoush|labneh|kibbeh|za.?atar|shakshuka|dolma/i, "Mediterranean"],
  [/\bchinese\b|stir.?fry|fried rice|dim sum|chow mein|kung pao|mapo|dumplings|wonton|peking|hot pot|spring roll|bok choy|congee|char siu|lo mein|baozi|xiaolongbao|hoisin|szechuan|cantonese/i, "Chinese"],
  [/\bthai\b|pad thai|tom yum|green curry|massaman|satay|larb|som tam|phat kaphrao|galangal|lemongrass|thai basil/i, "Thai"],
  [/\bspanish\b|paella|gazpacho|chorizo|croqueta|tapas|albondigas|patatas bravas|empanada|tortilla española|sangria|jamon|manchego/i, "Spanish"],
  [/\bfrench\b|croissant|quiche|boeuf bourguignon|coq au vin|ratatouille|crêpe|baguette|bouillabaisse|cassoulet|confit|escargot|vichyssoise|gratin|soufflé|béarnaise|béchamel|niçoise/i, "French"],
  [/\bgreek\b|moussaka|spanakopita|souvlaki|dolma|pastitsio|avgolemono|baklava|keftedes|loukoumades|orzo|feta|kalamata|gyros/i, "Greek"],
  [/\bkorean\b|kimchi|bulgogi|bibimbap|gochujang|japchae|doenjang|tteokbokki|galbi|samgyeopsal|banchan|sundubu|dakgalbi/i, "Korean"],
  [/\bvietnamese\b|pho|banh mi|vermicelli|bun bo|goi cuon|com tam|pho bo|nuoc cham|lemongrass chicken/i, "Vietnamese"],
  [/\bmorrocan\b|moroccan\b|tagine|couscous|harissa|chermoula|ras el hanout|merguez|bastilla|zaalouk/i, "Moroccan"],
  [/\blebanese\b|kafta|kibbeh nayyeh|fattoush|warak enab|mjaddara/i, "Lebanese"],
  [/\bamerican\b|burger|bbq|barbecue|mac and cheese|cornbread|buffalo|coleslaw|pulled pork|biscuits and gravy|clam chowder|po.?boy/i, "American"],
];

function inferCuisineFromName(name: string): string | null {
  for (const [regex, cuisine] of CUISINE_KEYWORDS) {
    if (regex.test(name)) return cuisine;
  }
  return null;
}

function topCuisines(recipes: TasteRecipe[], limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const r of recipes) {
    const tagged = r.cuisines ?? [];
    const sources = tagged.length
      ? tagged
      : [inferCuisineFromName(r.name)].filter((c): c is string => c !== null);
    for (const c of sources) counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([c]) => c);
}

export async function buildTasteProfile(args: BuildArgs): Promise<TasteProfile> {
  const { likedRecipes, currentRecipe, prefs, provider } = args;

  if (likedRecipes.length >= MIN_LIKES) {
    const needEmbed = likedRecipes.filter((r) => !r.embedding?.length);
    const fresh = needEmbed.length
      ? await provider.embed(needEmbed.map(buildEmbeddingText))
      : [];
    let freshIdx = 0;
    const vectors = likedRecipes
      .map((r) => (r.embedding?.length ? r.embedding : (fresh[freshIdx++] ?? [])))
      .filter((v) => v.length > 0);
    const likedCentroid = meanVector(vectors);

    const currentVec = currentRecipe.embedding?.length
      ? currentRecipe.embedding
      : (await provider.embed([buildEmbeddingText(currentRecipe)]))[0] ?? [];

    const centroid = currentVec.length
      ? likedCentroid.map((v, i) => v * 0.7 + (currentVec[i] ?? 0) * 0.3)
      : likedCentroid;

    return {
      centroid,
      cuisines: topCuisines(likedRecipes),
      diet: prefs.diet,
      healthGoal: prefs.healthGoal,
    };
  }

  const prefsText = [prefs.diet, prefs.healthGoal].filter(Boolean).join(" ");
  const seedText = `${buildEmbeddingText(currentRecipe)} ${prefsText}`.trim();
  const [seedVec] = await provider.embed([seedText]);
  return {
    centroid: seedVec ?? [],
    cuisines: currentRecipe.cuisines ?? [],
    diet: prefs.diet,
    healthGoal: prefs.healthGoal,
  };
}
