export type SeedProduct = {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imagePath: string;
  category: string;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  sizes?: string[];
  colors?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
};

export const freeShippingThreshold = 300;
export const flatShippingFee = 25;

export const seedProducts: SeedProduct[] = [
  {
    id: 1,
    name: 'Ladies Top',
    description:
        'Elegant ladies top crafted with premium fabric. Perfect for casual outings or formal events.',
    price: 150,
    imagePath: '/products/ladies-top.jpg',
    category: 'Bags',
    tags: ['Top', 'Fashion'],
    rating: 4.8,
    reviewCount: 24,
    isNew: true,
    inStock: true,
    colors: ['Cream', 'White', 'Black'],
  },
  {
    id: 2,
    name: 'Premium Leather Tote',
    description:
        'Elegant leather tote crafted with premium full-grain leather. Spacious interior with multiple compartments, perfect for everyday use.',
    price: 50,
    originalPrice: 120,
    imagePath: '/products/premium-leather-tote.jpg',
    category: 'Bags',
    tags: ['Bags', 'Leather', 'Tote'],
    rating: 4.7,
    reviewCount: 18,
    isBestSeller: true,
    colors: ['Brown', 'Black', 'Tan'],
  },
  {
    id: 3,
    name: 'Chic Crossbody',
    description:
        'Chic crossbody bag with adjustable strap, ideal for hands-free convenience without compromising style.',
    price: 85,
    imagePath: '/products/chic-crossbody.jpg',
    category: 'Bags',
    tags: ['Bags', 'Crossbody'],
    rating: 4.6,
    reviewCount: 12,
    colors: ['Black', 'Caramel'],
  },
  {
    id: 4,
    name: 'Luxury Clutch',
    description:
        'Luxurious clutch bag with magnetic clasp closure. Perfect companion for formal occasions and date nights.',
    price: 75,
    originalPrice: 150,
    imagePath: '/products/luxury-clutch.jpg',
    category: 'Bags',
    tags: ['Bags', 'Clutch', 'Formal'],
    rating: 4.9,
    reviewCount: 31,
    isBestSeller: true,
    colors: ['Black', 'Nude', 'Red'],
  },
  {
    id: 5,
    name: 'Classic Shoulder Bag',
    description:
        'Timeless shoulder bag with gold-tone hardware. A wardrobe staple that pairs beautifully with any outfit.',
    price: 50,
    originalPrice: 95,
    imagePath: '/products/classic-shoulder-bag.jpg',
    category: 'Bags',
    tags: ['Bags', 'Shoulder'],
    rating: 4.5,
    reviewCount: 9,
    colors: ['Brown', 'Black'],
  },
  {
    id: 6,
    name: 'Modern Satchel',
    description:
        'Structured satchel with top handle and detachable strap. Sophisticated design for the modern professional.',
    price: 100,
    originalPrice: 150,
    imagePath: '/products/modern-satchel.jpg',
    category: 'Bags',
    tags: ['Bags', 'Satchel', 'Professional'],
    rating: 4.4,
    reviewCount: 7,
    colors: ['Navy', 'Black', 'Burgundy'],
  },
  {
    id: 7,
    name: 'Sporty Jersey',
    description:
        'High-quality jersey for sports and casual wear. Breathable material and stylish fit.',
    price: 85,
    originalPrice: 165,
    imagePath: '/products/sporty-jersey.jpg',
    category: 'Accessories',
    tags: ['Jersey', 'Sports'],
    rating: 4.7,
    reviewCount: 15,
    isBestSeller: true,
  },
  {
    id: 8,
    name: 'Premium Slippers',
    description:
        'Comfortable and stylish slippers for home or outdoor use. Made with durable materials.',
    price: 100,
    originalPrice: 200,
    imagePath: '/products/premium-slippers.jpg',
    category: 'Shoes',
    tags: ['Shoes', 'Slippers'],
    rating: 4.8,
    reviewCount: 22,
    isNew: true,
  },
  {
    id: 9,
    name: 'Luxury Watch',
    description:
        'A timeless luxury watch that combines precision and elegance. Water-resistant and crafted with a premium finish.',
    price: 350,
    imagePath: '/products/luxury-watch.jpg',
    category: 'Watches',
    tags: ['Watches', 'Luxury', 'Accessories'],
    rating: 4.9,
    reviewCount: 44,
    isNew: true,
  },
  {
    id: 10,
    name: 'Leather Wallet',
    description:
        'Slim leather wallet with multiple card slots and cash compartment. Minimalist design for the modern individual.',
    price: 150,
    imagePath: '/products/leather-wallet.jpg',
    category: 'Wallets',
    tags: ['Wallets', 'Leather', 'Slim'],
    rating: 4.6,
    reviewCount: 19,
    colors: ['Brown', 'Black', 'Tan'],
  },
];
