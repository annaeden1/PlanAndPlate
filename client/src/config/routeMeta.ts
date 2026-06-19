export interface RouteMeta {

  title: string;
  subtitle: string;

  isGreeting?: boolean;
}

export const ROUTE_META: Record<string, RouteMeta> = {
  '/': { title: 'Home', subtitle: "Here's how your day is shaping up.", isGreeting: true },
  '/planner': { title: 'Meal Planner', subtitle: 'Plan and balance your whole week.' },
  '/my-recipes': { title: 'My Recipes', subtitle: 'Your saved and custom recipes.' },
  '/cart': { title: 'Grocery List', subtitle: 'Everything you need, sorted by aisle.' },
  '/scanner': { title: 'Product Scanner', subtitle: 'Check if a product fits your goals.' },
  '/profile': { title: 'Profile', subtitle: 'Manage your account and preferences.' },
};

export const getRouteMeta = (path: string): RouteMeta => {
  if (ROUTE_META[path]) return ROUTE_META[path];

  if (path.startsWith('/recipe')) {
    return { title: 'Recipe', subtitle: 'The full recipe, ingredients and steps.' };
  }
  return { title: 'Plan & Plate', subtitle: '' };
};

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};
