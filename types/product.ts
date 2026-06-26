export type ProductVariantInput = {
    size?: string;
    color?: string;
    price?: number;
  };


  export type CreateProductBody = {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: string;
    variants?: ProductVariantInput[];
    imageUrls?: string[];
  };
  