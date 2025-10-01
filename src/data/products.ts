import { v4 as uuidv4 } from 'uuid';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  image: string;
  available: boolean;
  ingredients?: string[];
  ordem?: number;
}

export const products: Product[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Seu produto',
    price: 8.50,
    description: 'Pastel tradicional recheado com carne moída temperada',
    category: 'Salgados',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Carne moída', 'Cebola', 'Temperos']
  },
  {
    id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    name: 'Seu produto',
    price: 7.00,
    description: 'Pastel cremoso com queijo derretido',
    category: 'Salgados',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Queijo mussarela', 'Orégano']
  },
  {
    id: 'c3d4e5f6-g7h8-9012-cdef-345678901234',
    name: 'Seu produto',
    price: 9.00,
    description: 'Pastel com frango desfiado e catupiry',
    category: 'Salgados',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Frango desfiado', 'Catupiry', 'Temperos']
  },
  {
    id: 'd4e5f6g7-h8i9-0123-def0-456789012345',
    name: 'Seu produto',
    price: 12.00,
    description: 'Pastel gourmet com camarão e cream cheese',
    category: 'Gourmet',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: false,
    ingredients: ['Camarão', 'Cream cheese', 'Cebolinha']
  },
  {
    id: 'e5f6g7h8-i9j0-1234-ef01-567890123456',
    name: 'Seu produto',
    price: 8.00,
    description: 'Pastel vegano com palmito refogado',
    category: 'Vegano',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Palmito', 'Tomate', 'Cebola']
  },
  {
    id: 'f6g7h8i9-j0k1-2345-f012-678901234567',
    name: 'Seu produto',
    price: 6.50,
    description: 'Pastel doce com chocolate derretido',
    category: 'Doces',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Chocolate', 'Leite condensado']
  },
  {
    id: 'g7h8i9j0-k1l2-3456-0123-789012345678',
    name: 'Seu produto',
    price: 7.50,
    description: 'Pastel doce com banana e canela',
    category: 'Doces',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Banana', 'Canela', 'Açúcar']
  },
  {
    id: 'h8i9j0k1-l2m3-4567-1234-890123456789',
    name: 'Seu produto',
    price: 13.50,
    description: 'Pastel especial com bacalhau desfiado',
    category: 'Gourmet',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Bacalhau', 'Batata', 'Azeite']
  },
  {
    id: 'i9j0k1l2-m3n4-5678-2345-901234567890',
    name: 'Seu produto',
    price: 10.00,
    description: 'Pastel com sabor de pizza margherita',
    category: 'Salgados',
    image: 'https://images.pexels.com/photos/4199098/pexels-photo-4199098.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true,
    ingredients: ['Queijo', 'Tomate', 'Manjericão']
  },
  {
    id: 'j0k1l2m3-n4o5-6789-3456-012345678901',
    name: 'Seu produto',
    price: 4.50,
    description: 'Refrigerante gelado 350ml',
    category: 'Bebidas',
    image: 'https://images.pexels.com/photos/2775860/pexels-photo-2775860.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: 'k1l2m3n4-o5p6-7890-4567-123456789012',
    name: 'Seu produto',
    price: 6.00,
    description: 'Suco natural de frutas da estação',
    category: 'Bebidas',
    image: 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  },
  {
    id: 'l2m3n4o5-p6q7-8901-5678-234567890123',
    name: 'Seu produto',
    price: 2.50,
    description: 'Água mineral sem gás 500ml',
    category: 'Bebidas',
    image: 'https://images.pexels.com/photos/327090/pexels-photo-327090.jpeg?auto=compress&cs=tinysrgb&w=400',
    available: true
  }
];

export const categories = [
  'Todos',
  'Salgados',
  'Doces',
  'Gourmet',
  'Vegano',
  'Bebidas'
];