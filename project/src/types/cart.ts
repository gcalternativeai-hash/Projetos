// src/types/cart.ts
import { Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
}
