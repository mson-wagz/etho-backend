import { Seeder } from 'nestjs-seeder';
import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../../repository/category.repository';
import { Category } from '../category.entity';

@Injectable()
export class CategorySeeder implements Seeder {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async seed(): Promise<any> {
    const createdCategories: { [key: string]: Category } = {};

    const rootCategories = [
      { name: 'Apparel', slug: 'apparel', level: 1 },
      { name: 'Shoes', slug: 'shoes', level: 1 },
      { name: 'Bags & Luggage', slug: 'bags-luggage', level: 1 },
      { name: 'Accessories', slug: 'accessories', level: 1 },
      {
        name: 'Beauty & Personal Care',
        slug: 'beauty-personal-care',
        level: 1,
      },
      { name: 'Home & Living', slug: 'home-living', level: 1 },
      { name: 'Purposeful Cleaning', slug: 'purposeful-cleaning', level: 1 },
      { name: 'Grocery & Beverages', slug: 'grocery-beverages', level: 1 },
      { name: 'Baby & Nursery', slug: 'baby-nursery', level: 1 },
      { name: 'Kids Toys & Learning', slug: 'kids-toys-learning', level: 1 },
      { name: 'Health & Wellness', slug: 'health-wellness', level: 1 },
      { name: 'Sports & Outdoors', slug: 'sports-outdoors', level: 1 },
      { name: 'Office & Stationery', slug: 'office-stationery', level: 1 },
      {
        name: 'Electronics & Tech Accessories',
        slug: 'electronics-tech',
        level: 1,
      },
      { name: 'Hobbies, Craft & DIY', slug: 'hobbies-craft-diy', level: 1 },
      { name: 'Pets', slug: 'pets', level: 1 },
      { name: 'Gifts/Holiday', slug: 'gifts-holiday', level: 1 },
      { name: 'Travel', slug: 'travel', level: 1 },
      { name: 'Vintage / Pre-Loved', slug: 'vintage-pre-loved', level: 1 },
    ];

    for (const cat of rootCategories) {
      const existing = await this.categoryRepository.findOne({
        where: { slug: cat.slug },
      });
      if (!existing) {
        const category = this.categoryRepository.create({
          name: cat.name,
          slug: cat.slug,
          parent_id: undefined,
          path: [cat.slug],
          level: 1,
        });
        createdCategories[cat.slug] =
          await this.categoryRepository.save(category);
      } else {
        createdCategories[cat.slug] = existing;
      }
    }

    const createSubcategories = async (
      subcats: Array<{
        name: string;
        slug: string;
        parent: string;
        level: number;
      }>,
    ) => {
      for (const sub of subcats) {
        const parent = createdCategories[sub.parent];
        if (parent) {
          const existing = await this.categoryRepository.findOne({
            where: { slug: sub.slug },
          });
          if (!existing) {
            const category = this.categoryRepository.create({
              name: sub.name,
              slug: sub.slug,
              parent_id: parent.id,
              path: [...parent.path, sub.slug],
              level: sub.level,
            });
            createdCategories[sub.slug] =
              await this.categoryRepository.save(category);
          } else {
            createdCategories[sub.slug] = existing;
          }
        }
      }
    };

    // 1. Apparel subcategories
    await createSubcategories([
      {
        name: "Women's Clothing",
        slug: 'womens-clothing',
        parent: 'apparel',
        level: 2,
      },
      {
        name: "Men's Clothing",
        slug: 'mens-clothing',
        parent: 'apparel',
        level: 2,
      },
      {
        name: 'Kids & Baby Clothing',
        slug: 'kids-baby-clothing',
        parent: 'apparel',
        level: 2,
      },
      {
        name: 'Gender-Neutral Clothing',
        slug: 'gender-neutral-clothing',
        parent: 'apparel',
        level: 2,
      },
      {
        name: 'Adaptive Clothing',
        slug: 'adaptive-clothing',
        parent: 'apparel',
        level: 2,
      },
    ]);

    // Women's Clothing subcategories
    await createSubcategories([
      {
        name: 'Tops',
        slug: 'womens-tops',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'T-Shirts',
        slug: 'womens-tshirts',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Blouses & Button-Downs',
        slug: 'womens-blouses',
        parent: 'womens-clothing',
        level: 3,
      },
      { name: 'Dresses', slug: 'dresses', parent: 'womens-clothing', level: 3 },
      {
        name: 'Jumpsuits & Rompers',
        slug: 'jumpsuits-rompers',
        parent: 'womens-clothing',
        level: 3,
      },
      { name: 'Skirts', slug: 'skirts', parent: 'womens-clothing', level: 3 },
      {
        name: 'Pants',
        slug: 'womens-pants',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Jeans & Denim',
        slug: 'womens-jeans',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Shorts',
        slug: 'womens-shorts',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Activewear & Athleisure Sets',
        slug: 'womens-activewear',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Sweaters, Knitwear, Sweatshirts',
        slug: 'womens-sweaters',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Outerwear (Coats & Jackets)',
        slug: 'womens-outerwear',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Swimwear',
        slug: 'womens-swimwear',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Sleepwear / Loungewear',
        slug: 'womens-sleepwear',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Intimates / Underwear',
        slug: 'womens-intimates',
        parent: 'womens-clothing',
        level: 3,
      },
      {
        name: 'Maternity',
        slug: 'maternity',
        parent: 'womens-clothing',
        level: 3,
      },
    ]);

    // Men's Clothing subcategories
    await createSubcategories([
      {
        name: 'T-Shirts',
        slug: 'mens-tshirts',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Shirts',
        slug: 'mens-shirts',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Sweaters',
        slug: 'mens-sweaters',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Hoodies & Sweatshirts',
        slug: 'mens-hoodies',
        parent: 'mens-clothing',
        level: 3,
      },
      { name: 'Pants', slug: 'mens-pants', parent: 'mens-clothing', level: 3 },
      {
        name: 'Jeans & Denim',
        slug: 'mens-jeans',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Shorts',
        slug: 'mens-shorts',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Activewear',
        slug: 'mens-activewear',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Swimwear',
        slug: 'mens-swimwear',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Sleepwear / Loungewear',
        slug: 'mens-sleepwear',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Underwear',
        slug: 'mens-underwear',
        parent: 'mens-clothing',
        level: 3,
      },
      {
        name: 'Outerwear',
        slug: 'mens-outerwear',
        parent: 'mens-clothing',
        level: 3,
      },
    ]);

    // Kids & Baby Clothing subcategories
    await createSubcategories([
      {
        name: 'Baby Clothing (0–24 months)',
        slug: 'baby-clothing',
        parent: 'kids-baby-clothing',
        level: 3,
      },
      {
        name: 'Kids Clothing (2–12 years)',
        slug: 'kids-clothing',
        parent: 'kids-baby-clothing',
        level: 3,
      },
      {
        name: 'Teens Clothing',
        slug: 'teens-clothing',
        parent: 'kids-baby-clothing',
        level: 3,
      },
      {
        name: 'Schoolwear',
        slug: 'schoolwear',
        parent: 'kids-baby-clothing',
        level: 3,
      },
      {
        name: 'Swim',
        slug: 'kids-swim',
        parent: 'kids-baby-clothing',
        level: 3,
      },
      {
        name: 'Sleepwear',
        slug: 'kids-sleepwear',
        parent: 'kids-baby-clothing',
        level: 3,
      },
      {
        name: 'Outerwear',
        slug: 'kids-outerwear',
        parent: 'kids-baby-clothing',
        level: 3,
      },
    ]);

    // 2. Shoes subcategories
    await createSubcategories([
      {
        name: "Women's Shoes",
        slug: 'womens-shoes',
        parent: 'shoes',
        level: 2,
      },
      { name: "Men's Shoes", slug: 'mens-shoes', parent: 'shoes', level: 2 },
      { name: 'Kids Shoes', slug: 'kids-shoes', parent: 'shoes', level: 2 },
    ]);

    // Women's Shoes subcategories
    await createSubcategories([
      { name: 'Boots', slug: 'womens-boots', parent: 'womens-shoes', level: 3 },
      {
        name: 'Sneakers',
        slug: 'womens-sneakers',
        parent: 'womens-shoes',
        level: 3,
      },
      {
        name: 'Sandals & Slides',
        slug: 'womens-sandals',
        parent: 'womens-shoes',
        level: 3,
      },
      { name: 'Flats', slug: 'womens-flats', parent: 'womens-shoes', level: 3 },
      { name: 'Heels', slug: 'womens-heels', parent: 'womens-shoes', level: 3 },
      {
        name: 'Loafers',
        slug: 'womens-loafers',
        parent: 'womens-shoes',
        level: 3,
      },
      {
        name: 'Slippers',
        slug: 'womens-slippers',
        parent: 'womens-shoes',
        level: 3,
      },
    ]);

    // Men's Shoes subcategories
    await createSubcategories([
      { name: 'Boots', slug: 'mens-boots', parent: 'mens-shoes', level: 3 },
      {
        name: 'Sneakers',
        slug: 'mens-sneakers',
        parent: 'mens-shoes',
        level: 3,
      },
      {
        name: 'Sandals & Slides',
        slug: 'mens-sandals',
        parent: 'mens-shoes',
        level: 3,
      },
      {
        name: 'Dress Shoes',
        slug: 'mens-dress-shoes',
        parent: 'mens-shoes',
        level: 3,
      },
      {
        name: 'Slippers',
        slug: 'mens-slippers',
        parent: 'mens-shoes',
        level: 3,
      },
    ]);

    // 3. Bags & Luggage subcategories
    await createSubcategories([
      { name: 'Handbags', slug: 'handbags', parent: 'bags-luggage', level: 2 },
      {
        name: 'Crossbody Bags',
        slug: 'crossbody-bags',
        parent: 'bags-luggage',
        level: 2,
      },
      {
        name: 'Tote Bags',
        slug: 'tote-bags',
        parent: 'bags-luggage',
        level: 2,
      },
      {
        name: 'Backpacks',
        slug: 'backpacks',
        parent: 'bags-luggage',
        level: 2,
      },
      {
        name: 'Belt Bags / Fanny Packs',
        slug: 'belt-bags',
        parent: 'bags-luggage',
        level: 2,
      },
      {
        name: 'Laptop Bags',
        slug: 'laptop-bags',
        parent: 'bags-luggage',
        level: 2,
      },
      {
        name: 'Camera Bags',
        slug: 'camera-bags',
        parent: 'bags-luggage',
        level: 2,
      },
      {
        name: 'Wallets & Cardholders',
        slug: 'wallets',
        parent: 'bags-luggage',
        level: 2,
      },
    ]);

    // 4. Accessories subcategories
    await createSubcategories([
      { name: 'Jewelry', slug: 'jewelry', parent: 'accessories', level: 2 },
      {
        name: 'Sunglasses & Glasses',
        slug: 'sunglasses',
        parent: 'accessories',
        level: 2,
      },
      { name: 'Watches', slug: 'watches', parent: 'accessories', level: 2 },
      { name: 'Hats', slug: 'hats', parent: 'accessories', level: 2 },
      {
        name: 'Scarves & Wraps',
        slug: 'scarves',
        parent: 'accessories',
        level: 2,
      },
      { name: 'Gloves', slug: 'gloves', parent: 'accessories', level: 2 },
      {
        name: 'Hair Accessories',
        slug: 'hair-accessories',
        parent: 'accessories',
        level: 2,
      },
      { name: 'Belts', slug: 'belts', parent: 'accessories', level: 2 },
      {
        name: 'Socks & Hosiery',
        slug: 'socks-hosiery',
        parent: 'accessories',
        level: 2,
      },
    ]);

    // Jewelry subcategories
    await createSubcategories([
      { name: 'Necklaces', slug: 'necklaces', parent: 'jewelry', level: 3 },
      { name: 'Earrings', slug: 'earrings', parent: 'jewelry', level: 3 },
      { name: 'Bracelets', slug: 'bracelets', parent: 'jewelry', level: 3 },
      { name: 'Rings', slug: 'rings', parent: 'jewelry', level: 3 },
      {
        name: 'Fine Jewelry',
        slug: 'fine-jewelry',
        parent: 'jewelry',
        level: 3,
      },
      {
        name: 'Upcycled Jewelry',
        slug: 'upcycled-jewelry',
        parent: 'jewelry',
        level: 3,
      },
    ]);

    // 5. Beauty & Personal Care subcategories
    await createSubcategories([
      {
        name: 'Skincare',
        slug: 'skincare',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Haircare',
        slug: 'haircare',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Bath & Body',
        slug: 'bath-body',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Oral Care',
        slug: 'oral-care',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Menstrual Care',
        slug: 'menstrual-care',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Shaving & Grooming',
        slug: 'shaving-grooming',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Makeup',
        slug: 'makeup',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Fragrance',
        slug: 'fragrance',
        parent: 'beauty-personal-care',
        level: 2,
      },
      {
        name: 'Baby & Kids Personal Care',
        slug: 'baby-kids-personal-care',
        parent: 'beauty-personal-care',
        level: 2,
      },
    ]);

    // 6. Home & Living subcategories
    await createSubcategories([
      { name: 'Bedding', slug: 'bedding', parent: 'home-living', level: 2 },
      { name: 'Bath', slug: 'bath', parent: 'home-living', level: 2 },
      { name: 'Lighting', slug: 'lighting', parent: 'home-living', level: 2 },
      {
        name: 'Rugs & Textiles',
        slug: 'rugs-textiles',
        parent: 'home-living',
        level: 2,
      },
      { name: 'Decor', slug: 'decor', parent: 'home-living', level: 2 },
      {
        name: 'Kitchen & Dining',
        slug: 'kitchen-dining',
        parent: 'home-living',
        level: 2,
      },
      {
        name: 'Storage & Organization',
        slug: 'storage-organization',
        parent: 'home-living',
        level: 2,
      },
      {
        name: 'Home Office',
        slug: 'home-office',
        parent: 'home-living',
        level: 2,
      },
      { name: 'Furniture', slug: 'furniture', parent: 'home-living', level: 2 },
      {
        name: 'Appliances',
        slug: 'appliances',
        parent: 'home-living',
        level: 2,
      },
      { name: 'Outdoor', slug: 'outdoor', parent: 'home-living', level: 2 },
    ]);
  }

  async drop(): Promise<any> {
    const categories = await this.categoryRepository.find();
    for (const category of categories) {
      await this.categoryRepository.remove(category);
    }
  }
}
