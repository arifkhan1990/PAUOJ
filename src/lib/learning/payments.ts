export type PaidModule = {
  slug: string;
  order: number;
  title: string;
};

/** Advanced SQL is sold separately (৳500) and is not part of the bundle. */
export const ADVANCED_SQL = {
  slug: "advanced-sql",
  order: 8,
  title: "Advanced SQL",
  priceBdt: 500,
} as const;

/** Learning modules that require a purchase (modules 1-2 stay free). */
export const PAID_MODULES: PaidModule[] = [
  {
    slug: "basic-intermediate-algorithms",
    order: 3,
    title: "Basic & Intermediate Algorithms",
  },
  { slug: "trees-graphs", order: 4, title: "Trees & Graphs" },
  { slug: "dynamic-programming", order: 5, title: "Dynamic Programming" },
  {
    slug: "advanced-data-structures",
    order: 6,
    title: "Advanced Data Structures",
  },
  { slug: "advanced-algorithms", order: 7, title: "Advanced Algorithms" },
];

export const MODULE_PRICE_BDT = 200;
export const BUNDLE_PRICE_BDT = 700;

export type PaidProduct = "MODULE" | "BUNDLE";

export function getPaidModule(slug: string): PaidModule | null {
  return PAID_MODULES.find((paid) => paid.slug === slug) ?? null;
}

export function isPaidModule(slug: string): boolean {
  return getPaidModule(slug) !== null;
}

/** Modules that need any purchase, including the separately sold SQL track. */
export function requiresPurchase(slug: string): boolean {
  return isPaidModule(slug) || slug === ADVANCED_SQL.slug;
}

export function purchasePriceBdt(slug: string): number {
  return modulePriceBdt(slug) ?? MODULE_PRICE_BDT;
}

export function isPurchasableModule(slug: string): boolean {
  return getPaidModule(slug) !== null || slug === ADVANCED_SQL.slug;
}

export function modulePriceBdt(slug: string): number | null {
  if (slug === ADVANCED_SQL.slug) return ADVANCED_SQL.priceBdt;
  return getPaidModule(slug) ? MODULE_PRICE_BDT : null;
}

/** Server-side price for a product; returns null for an invalid module. */
export function priceForProduct(
  product: PaidProduct,
  moduleSlug: string | null | undefined,
): number | null {
  if (product === "BUNDLE") return BUNDLE_PRICE_BDT;
  if (!moduleSlug) return null;
  return modulePriceBdt(moduleSlug);
}

export function productLabel(
  product: PaidProduct,
  moduleSlug?: string | null,
): string {
  if (product === "BUNDLE") {
    return `All 5 premium modules (৳${BUNDLE_PRICE_BDT})`;
  }
  if (moduleSlug === ADVANCED_SQL.slug) {
    return `Advanced SQL (৳${ADVANCED_SQL.priceBdt})`;
  }
  const paid = moduleSlug ? getPaidModule(moduleSlug) : null;
  return paid
    ? `Module ${paid.order}: ${paid.title} (৳${MODULE_PRICE_BDT})`
    : "Premium module";
}

/** TrxIDs are stored normalized: no spaces, upper case. */
export function normalizeTrxId(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isValidTrxId(raw: string): boolean {
  return /^[A-Z0-9]{6,32}$/.test(normalizeTrxId(raw));
}

/** Modules granted by a product (bundle covers every paid module). */
export function modulesForProduct(
  product: PaidProduct,
  moduleSlug?: string | null,
): string[] {
  if (product === "BUNDLE") return PAID_MODULES.map((paid) => paid.slug);
  return moduleSlug && isPurchasableModule(moduleSlug) ? [moduleSlug] : [];
}
