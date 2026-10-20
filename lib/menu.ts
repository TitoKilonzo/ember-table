export type MenuCategory = "Popular" | "Mains" | "Sides" | "Drinks" | "Desserts";

export type MenuItem = {
  id: string;
  odooProductId: string;
  name: string;
  description: string;
  price: number;
  category: Exclude<MenuCategory, "Popular">;
  image: string;
  badge?: string;
  popular?: boolean;
  isAvailable: boolean;
  prepMinutes: number;
};

// Menu items, prices and preparation estimates supplied for 400.
export const menuItems: MenuItem[] = [
  {
    id: "ember-burger", odooProductId: "demo-product-001", name: "Ember smash burger",
    description: "Two beef patties, cheddar, pickles and house sauce on a brioche bun.", price: 980,
    category: "Mains", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85",
    popular: true, isAvailable: true, prepMinutes: 14,
  },
  {
    id: "crispy-chicken", odooProductId: "demo-product-002", name: "Crispy herb chicken",
    description: "Crispy chicken with lemon herb slaw and house mayo on a sesame bun.", price: 850,
    category: "Mains", image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=1000&q=85",
    popular: true, isAvailable: true, prepMinutes: 16,
  },
  {
    id: "chili-wings", odooProductId: "demo-product-003", name: "Sticky chilli wings",
    description: "Chilli-glazed wings with sesame, spring onion and a cool dip.", price: 720,
    category: "Mains", image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=1000&q=85",
    popular: true, isAvailable: true, prepMinutes: 18,
  },
  {
    id: "loaded-fries", odooProductId: "demo-product-004", name: "Loaded rosemary fries",
    description: "Crispy fries with rosemary salt, parmesan and garlic dip.", price: 420,
    category: "Sides", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1000&q=85",
    popular: true, isAvailable: true, prepMinutes: 8,
  },
  {
    id: "garden-bowl", odooProductId: "demo-product-005", name: "Market garden bowl",
    description: "Greens, avocado and roasted sweet potato with citrus dressing.", price: 780,
    category: "Mains", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85",
    isAvailable: true, prepMinutes: 10,
  },
  {
    id: "woodfired-pizza", odooProductId: "demo-product-006", name: "Margherita flatbread",
    description: "Tomato, mozzarella and basil on a thin, crisp crust.", price: 1100,
    category: "Mains", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1000&q=85",
    isAvailable: true, prepMinutes: 15,
  },
  {
    id: "lemonade", odooProductId: "demo-product-007", name: "Minted house lemonade",
    description: "Lemon and mint over ice, lightly sweetened.", price: 260,
    category: "Drinks", image: "https://images.unsplash.com/photo-1513558161293-c085ff47c3e8?auto=format&fit=crop&w=1000&q=85",
    isAvailable: true, prepMinutes: 3,
  },
  {
    id: "iced-coffee", odooProductId: "demo-product-008", name: "Vanilla iced coffee",
    description: "Cold-brew coffee with vanilla and milk.", price: 350,
    category: "Drinks", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=1000&q=85",
    isAvailable: true, prepMinutes: 3,
  },
  {
    id: "brownie", odooProductId: "demo-product-009", name: "Warm fudge brownie",
    description: "Chocolate brownie with a soft centre.", price: 390,
    category: "Desserts", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=85",
    isAvailable: true, prepMinutes: 5,
  },
  {
    id: "onion-rings", odooProductId: "demo-product-010", name: "Crispy onion rings",
    description: "Crispy battered onion rings with pepper and house ketchup.", price: 360,
    category: "Sides", image: "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=1000&q=85",
    isAvailable: true, prepMinutes: 7,
  },
];

export const categories: MenuCategory[] = ["Popular", "Mains", "Sides", "Drinks", "Desserts"];
