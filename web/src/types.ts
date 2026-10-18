export interface Listing {
  name: string;
  description: string;
  category: string | null;
  subcategory: string | null;
  style: string | null;
  gender: string | null;
  brand: string | null;
  materials: string[];
  condition: string | null;
  color: string | null;
  colorHex: string | null;
  size: string | null;
  productDefects: string;
}

export interface GenerateResponse {
  listing: Listing;
  warnings: string[];
  missingFields: (keyof Listing)[];
  meta: { model: string; photos: number; seconds: number };
}