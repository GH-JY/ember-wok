// The six dishes on the night menu. Every ticket carries one of these: the ingredients it calls
// for, the one item the cook must chop first (null when nothing needs the knife), how long it
// takes over the flame, and what the bowl pays before tips. The plate drawing reads the same
// entry, so a ticket's icons, the tray chips, the wok's contents and the finished plate always
// agree with each other.

export const RECIPES = [
  {
    id: 'dragon-noodles',
    name: 'DRAGON NOODLES',
    base: 'noodles',
    ingredients: ['noodles', 'beef', 'greens', 'chili'],
    chop: 'greens',
    cookSeconds: 4.6,
    price: 12,
    accents: ['#a84632', '#57c785', '#e6402e'],
  },
  {
    id: 'jade-fried-rice',
    name: 'JADE FRIED RICE',
    base: 'rice',
    ingredients: ['rice', 'egg', 'greens', 'garlic'],
    chop: 'greens',
    cookSeconds: 4.2,
    price: 11,
    accents: ['#ffd166', '#57c785', '#efe6d2'],
  },
  {
    id: 'ember-ramen',
    name: 'EMBER RAMEN',
    base: 'noodles',
    ingredients: ['noodles', 'shrimp', 'egg', 'garlic'],
    chop: 'garlic',
    cookSeconds: 4.8,
    price: 13,
    accents: ['#ff8a5c', '#ffd166', '#efe6d2'],
  },
  {
    id: 'chili-beef-rice',
    name: 'CHILI BEEF RICE',
    base: 'rice',
    ingredients: ['rice', 'beef', 'chili', 'garlic'],
    chop: 'garlic',
    cookSeconds: 4.4,
    price: 12,
    accents: ['#a84632', '#e6402e', '#efe6d2'],
  },
  {
    id: 'shrimp-noodles',
    name: 'SHRIMP NOODLES',
    base: 'noodles',
    ingredients: ['noodles', 'shrimp', 'greens', 'chili'],
    chop: 'greens',
    cookSeconds: 4.5,
    price: 13,
    accents: ['#ff8a5c', '#57c785', '#e6402e'],
  },
  {
    id: 'golden-egg-rice',
    name: 'GOLDEN EGG RICE',
    base: 'rice',
    ingredients: ['rice', 'egg', 'chili', 'shrimp'],
    chop: 'chili',
    cookSeconds: 4.3,
    price: 12,
    accents: ['#ffd166', '#e6402e', '#ff8a5c'],
  },
];

const BY_ID = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export function recipeById(id) {
  return BY_ID.get(id) ?? null;
}

/** A dish name broken into two lines where it reads best on a ticket ("CHILI BEEF" / "RICE"). */
export function recipeLines(recipe) {
  const words = recipe.name.split(' ');
  if (words.length < 3) return [recipe.name];
  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(' '), words.slice(middle).join(' ')];
}
