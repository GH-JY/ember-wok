// The eight bins on the stall's ingredient shelf, in the order they sit on the counter, plus the
// two garnish jars by the pass. Each entry names the shelf label, the ink colour the icon draws in,
// and a one-line note the shelf shows on hover. The tray keeps the ids the active ticket still
// needs, in recipe order, and functions here answer the two questions the rest of the game asks:
// does this ingredient belong on the active ticket, and has the tray got the whole list.

export const INGREDIENTS = [
  { id: 'noodles', name: 'NOODLES', color: '#f2c063', note: 'fresh egg noodles' },
  { id: 'rice', name: 'RICE', color: '#efe6d2', note: 'day-old jasmine rice' },
  { id: 'beef', name: 'BEEF', color: '#a84632', note: 'sliced sirloin' },
  { id: 'greens', name: 'BOK CHOY', color: '#57c785', note: 'crisp greens' },
  { id: 'chili', name: 'CHILI', color: '#e6402e', note: 'bird chili' },
  { id: 'garlic', name: 'GARLIC', color: '#e9ddc4', note: 'smashed cloves' },
  { id: 'egg', name: 'EGG', color: '#ffd166', note: 'golden yolk' },
  { id: 'shrimp', name: 'SHRIMP', color: '#ff8a5c', note: 'tiger prawns' },
];

export const GARNISHES = [
  { id: 'scallion', name: 'SCALLION', color: '#6fce8f' },
  { id: 'sesame', name: 'SESAME', color: '#d9b872' },
];

const BY_ID = new Map(INGREDIENTS.map((entry) => [entry.id, entry]));

export function ingredientById(id) {
  return BY_ID.get(id) ?? null;
}

/** The recipe's list without duplicates, in the order the ticket lists them. */
export function normalizeList(list) {
  const seen = new Set();
  const out = [];
  for (const id of list) {
    if (BY_ID.has(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/** The ids of `recipe` that are not on the tray yet, in recipe order. */
export function missingIngredients(recipe, tray) {
  return recipe.ingredients.filter((id) => !tray.includes(id));
}

/** True when every ingredient the recipe calls for is already on the tray. */
export function trayComplete(recipe, tray) {
  return missingIngredients(recipe, tray).length === 0;
}
