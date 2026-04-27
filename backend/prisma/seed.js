import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "DzMarket123";

const demoSellers = [
  {
    username: "techhubdz",
    email: "techhubdz@example.com",
    phone: "0550000001",
    firstName: "Yacine",
    lastName: "Bensaid",
    gender: "male",
    birthDate: "1992-03-15",
    wilayaId: 16,
    municipality: "Alger Centre",
    bio: "متجر متخصص في الحواسيب وملحقاتها وأجهزة ألعاب الفيديو.",
    ccp: { accountNumber: "00799999000123456789", securityKey: "45" },
    edahabia: {
      cardNumberMasked: "5078********1234",
      cvv: "321",
      holderName: "Yacine Bensaid",
      expiry: "11/29",
    },
    products: [
      {
        title: "PC Gamer Ryzen 5 RTX 4060",
        description: "حاسوب ألعاب مكتبي مناسب للألعاب الحديثة والعمل الإبداعي بدقة عالية.",
        categoryId: "electronics",
        subcategoryId: "electronics:computers",
        condition: "new",
        packageSize: "large",
        freeShipping: false,
        images: [
          "https://placehold.co/800x600?text=PC+Gamer+Ryzen+5",
          "https://placehold.co/800x600?text=RTX+4060+Desktop",
        ],
        options: [
          { name: "16GB RAM / 512GB SSD", price: 185000, quantity: 3 },
          { name: "32GB RAM / 1TB SSD", price: 214000, quantity: 2 },
        ],
      },
      {
        title: "Laptop Lenovo IdeaPad Gaming 3",
        description: "لابتوب ألعاب وأعمال بتبريد جيد وشاشة سريعة للاستعمال اليومي واللعب.",
        categoryId: "electronics",
        subcategoryId: "electronics:computers",
        condition: "new",
        packageSize: "medium",
        freeShipping: true,
        images: [
          "https://placehold.co/800x600?text=Gaming+Laptop",
        ],
        options: [
          { name: "15.6 pouces / RTX 3050", price: 149500, quantity: 4 },
        ],
      },
      {
        title: "PlayStation 5 Slim Standard",
        description: "جهاز PS5 Slim إصدار قارئ الأقراص مع ذراع تحكم أصلية.",
        categoryId: "electronics",
        subcategoryId: "electronics:gaming",
        condition: "new",
        packageSize: "medium",
        freeShipping: false,
        images: [
          "https://placehold.co/800x600?text=PS5+Slim",
        ],
        options: [
          { name: "Console + Manette", price: 118000, quantity: 5 },
        ],
      },
      {
        title: "Nintendo Switch OLED",
        description: "جهاز Nintendo Switch OLED مناسب للألعاب العائلية والتنقل.",
        categoryId: "electronics",
        subcategoryId: "electronics:gaming",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: [
          "https://placehold.co/800x600?text=Switch+OLED",
        ],
        options: [
          { name: "White Edition", price: 62000, quantity: 6 },
          { name: "Neon Edition", price: 61500, quantity: 4 },
        ],
      },
    ],
  },
  {
    username: "stylehommedz",
    email: "stylehommedz@example.com",
    phone: "0550000002",
    firstName: "Amine",
    lastName: "Mekki",
    gender: "male",
    birthDate: "1990-08-21",
    wilayaId: 31,
    municipality: "Oran",
    bio: "منتجات رجالية تشمل الملابس والأحذية والإكسسوارات اليومية.",
    ccp: { accountNumber: "00799999000123456788", securityKey: "46" },
    edahabia: {
      cardNumberMasked: "5078********5678",
      cvv: "654",
      holderName: "Amine Mekki",
      expiry: "08/30",
    },
    products: [
      {
        title: "Chemise Homme Oxford Premium",
        description: "قميص رجالي أنيق بخامة مريحة مناسب للعمل والخروج.",
        categoryId: "men",
        subcategoryId: "men:clothing",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Oxford+Shirt"],
        options: [
          { name: "M Bleu", price: 4200, quantity: 8 },
          { name: "L Blanc", price: 4200, quantity: 6 },
        ],
      },
      {
        title: "Jean Homme Coupe Slim",
        description: "جينز رجالي عملي بخياطة متينة واستعمال يومي.",
        categoryId: "men",
        subcategoryId: "men:clothing",
        condition: "new",
        packageSize: "small",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Men+Jeans"],
        options: [
          { name: "42 Bleu Marine", price: 5300, quantity: 7 },
          { name: "44 Noir", price: 5300, quantity: 5 },
        ],
      },
      {
        title: "Sneakers Homme Urban Run",
        description: "حذاء رياضي رجالي مريح للمشي والاستعمال اليومي.",
        categoryId: "men",
        subcategoryId: "men:shoes",
        condition: "new",
        packageSize: "medium",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Urban+Sneakers"],
        options: [
          { name: "42 Blanc", price: 6900, quantity: 4 },
          { name: "43 Noir", price: 6900, quantity: 4 },
        ],
      },
      {
        title: "Mocassins Homme Classic",
        description: "حذاء موكاسان رجالي أنيق للمناسبات والعمل.",
        categoryId: "men",
        subcategoryId: "men:shoes",
        condition: "new",
        packageSize: "medium",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Mocassins+Classic"],
        options: [
          { name: "41 Marron", price: 7800, quantity: 3 },
          { name: "42 Noir", price: 7800, quantity: 3 },
        ],
      },
      {
        title: "Montre Homme Chronograph Silver",
        description: "ساعة رجالية بتصميم عصري وسوار معدني أنيق.",
        categoryId: "men",
        subcategoryId: "men:accessories",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Men+Watch"],
        options: [
          { name: "Silver Dial", price: 8500, quantity: 5 },
        ],
      },
      {
        title: "Lunettes Soleil Homme Polarized",
        description: "نظارات شمسية رجالية بعدسات مستقطبة وإطار خفيف.",
        categoryId: "men",
        subcategoryId: "men:accessories",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Men+Sunglasses"],
        options: [
          { name: "Black Frame", price: 3600, quantity: 9 },
        ],
      },
    ],
  },
  {
    username: "kidsworlddz",
    email: "kidsworlddz@example.com",
    phone: "0550000003",
    firstName: "Sabrina",
    lastName: "Khelifi",
    gender: "female",
    birthDate: "1994-01-09",
    wilayaId: 19,
    municipality: "Setif",
    bio: "ملابس وأحذية أطفال بخامات مريحة وتصاميم مناسبة للاستعمال اليومي.",
    ccp: { accountNumber: "00799999000123456787", securityKey: "47" },
    edahabia: {
      cardNumberMasked: "5078********2468",
      cvv: "258",
      holderName: "Sabrina Khelifi",
      expiry: "02/30",
    },
    products: [
      {
        title: "Ensemble Enfant Coton",
        description: "طقم أطفال قطني مريح مناسب للمدرسة والخروج.",
        categoryId: "children",
        subcategoryId: "children:clothing",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Kids+Cotton+Set"],
        options: [
          { name: "6 ans", price: 2800, quantity: 6 },
          { name: "8 ans", price: 2900, quantity: 5 },
        ],
      },
      {
        title: "Pyjama Enfant Hiver",
        description: "بيجاما أطفال دافئة بخامة ناعمة لفصل الشتاء.",
        categoryId: "children",
        subcategoryId: "children:clothing",
        condition: "new",
        packageSize: "small",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Kids+Pyjama"],
        options: [
          { name: "5 ans", price: 2400, quantity: 7 },
          { name: "7 ans", price: 2500, quantity: 6 },
        ],
      },
      {
        title: "Basket Enfant School Step",
        description: "حذاء أطفال رياضي خفيف ومناسب للدراسة واللعب.",
        categoryId: "children",
        subcategoryId: "children:shoes",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Kids+Sneakers"],
        options: [
          { name: "31 Bleu", price: 3200, quantity: 5 },
          { name: "33 Rose", price: 3200, quantity: 5 },
        ],
      },
      {
        title: "Sandales Enfant Summer Fun",
        description: "صندل أطفال عملي ومريح لفصل الصيف.",
        categoryId: "children",
        subcategoryId: "children:shoes",
        condition: "new",
        packageSize: "small",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Kids+Sandals"],
        options: [
          { name: "30 Beige", price: 2600, quantity: 4 },
          { name: "32 Bleu", price: 2600, quantity: 4 },
        ],
      },
    ],
  },
  {
    username: "homelivingdz",
    email: "homelivingdz@example.com",
    phone: "0550000004",
    firstName: "Nadir",
    lastName: "Zerouki",
    gender: "male",
    birthDate: "1988-11-12",
    wilayaId: 25,
    municipality: "Constantine",
    bio: "أجهزة كهرومنزلية وديكور وأثاث منزلي بتشكيلة متنوعة.",
    ccp: { accountNumber: "00799999000123456786", securityKey: "48" },
    edahabia: {
      cardNumberMasked: "5078********9753",
      cvv: "741",
      holderName: "Nadir Zerouki",
      expiry: "09/31",
    },
    products: [
      {
        title: "Blender Inox 1.5L",
        description: "خلاط مطبخ بمحرك قوي وكأس زجاجي لتحضير العصائر والصلصات.",
        categoryId: "home",
        subcategoryId: "home:appliances",
        condition: "new",
        packageSize: "medium",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Blender+1.5L"],
        options: [
          { name: "850W", price: 7900, quantity: 6 },
        ],
      },
      {
        title: "Aspirateur Compact 1600W",
        description: "مكنسة كهربائية منزلية خفيفة وسهلة التخزين.",
        categoryId: "home",
        subcategoryId: "home:appliances",
        condition: "new",
        packageSize: "large",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Vacuum+1600W"],
        options: [
          { name: "Compact Model", price: 15400, quantity: 4 },
        ],
      },
      {
        title: "Lampe Decor LED Dorée",
        description: "مصباح ديكور LED بتصميم عصري للمكاتب وغرف الجلوس.",
        categoryId: "home",
        subcategoryId: "home:decor",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=LED+Decor+Lamp"],
        options: [
          { name: "Warm Light", price: 4800, quantity: 8 },
        ],
      },
      {
        title: "Miroir Mural Moderne",
        description: "مرآة حائط ديكورية بإطار أنيق تناسب المدخل وغرفة النوم.",
        categoryId: "home",
        subcategoryId: "home:decor",
        condition: "new",
        packageSize: "medium",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Modern+Mirror"],
        options: [
          { name: "70x50 cm", price: 6200, quantity: 5 },
        ],
      },
      {
        title: "Table Basse Scandinave",
        description: "طاولة قهوة بتصميم اسكندنافي وخشب مقاوم للاستعمال اليومي.",
        categoryId: "home",
        subcategoryId: "home:furniture",
        condition: "new",
        packageSize: "large",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Coffee+Table"],
        options: [
          { name: "Bois Clair", price: 12900, quantity: 3 },
        ],
      },
      {
        title: "Etagere Rangement 5 Niveaux",
        description: "رف تخزين متعدد الاستعمالات للمطبخ أو غرفة الجلوس.",
        categoryId: "home",
        subcategoryId: "home:furniture",
        condition: "new",
        packageSize: "large",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Storage+Shelf"],
        options: [
          { name: "Noir Mat", price: 11600, quantity: 4 },
        ],
      },
    ],
  },
  {
    username: "booksdz",
    email: "booksdz@example.com",
    phone: "0550000005",
    firstName: "Lina",
    lastName: "Rahmani",
    gender: "female",
    birthDate: "1993-06-03",
    wilayaId: 15,
    municipality: "Tizi Ouzou",
    bio: "مكتبة لبيع الكتب الجامعية والروايات الأكثر طلبًا.",
    ccp: { accountNumber: "00799999000123456785", securityKey: "49" },
    edahabia: {
      cardNumberMasked: "5078********8642",
      cvv: "159",
      holderName: "Lina Rahmani",
      expiry: "05/30",
    },
    products: [
      {
        title: "Livre Python Pour Debutants",
        description: "كتاب مبسط لتعلم Python من الصفر مع أمثلة وتمارين.",
        categoryId: "books",
        subcategoryId: "books:textbooks",
        condition: "new",
        packageSize: "small",
        freeShipping: true,
        images: ["https://placehold.co/800x600?text=Python+Book"],
        options: [
          { name: "Edition 2025", price: 2500, quantity: 10 },
        ],
      },
      {
        title: "Roman Les Jours de Lumiere",
        description: "رواية اجتماعية مشوقة بنسخة ورقية فاخرة.",
        categoryId: "books",
        subcategoryId: "books:fiction",
        condition: "new",
        packageSize: "small",
        freeShipping: false,
        images: ["https://placehold.co/800x600?text=Novel+Book"],
        options: [
          { name: "Couverture Souple", price: 1800, quantity: 12 },
        ],
      },
    ],
  },
];

async function ensureCategoryAndSubcategory(categoryId, subcategoryId) {
  const subName = subcategoryId.includes(":") ? subcategoryId.split(":").at(-1) : subcategoryId;
  const category = await prisma.category.upsert({
    where: { id: categoryId },
    create: { id: categoryId, name: categoryId },
    update: { name: categoryId },
  });

  const existingSubcategory = await prisma.subcategory.findFirst({
    where: {
      OR: [{ id: subcategoryId }, { categoryId: category.id, name: subName }],
    },
  });

  if (existingSubcategory) {
    if (existingSubcategory.categoryId === category.id) {
      return existingSubcategory;
    }

    return prisma.subcategory.upsert({
      where: { id: `${category.id}:${subName}` },
      create: {
        id: `${category.id}:${subName}`,
        categoryId: category.id,
        name: subName,
      },
      update: {},
    });
  }

  return prisma.subcategory.create({
    data: {
      id: subcategoryId,
      categoryId: category.id,
      name: subName,
    },
  });
}

async function upsertDemoUser(seller) {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  return prisma.user.upsert({
    where: { email: seller.email },
    create: {
      username: seller.username,
      email: seller.email,
      phone: seller.phone,
      passwordHash,
      role: "USER",
      profile: {
        create: {
          firstName: seller.firstName,
          lastName: seller.lastName,
          gender: seller.gender,
          birthDate: new Date(seller.birthDate),
          wilayaId: seller.wilayaId,
          municipality: seller.municipality,
          bio: seller.bio,
          showLocation: true,
          verified: true,
        },
      },
      wallet: { create: {} },
      paymentCcp: {
        create: {
          accountNumber: seller.ccp.accountNumber,
          securityKey: seller.ccp.securityKey,
        },
      },
      paymentEdahabia: {
        create: seller.edahabia,
      },
    },
    update: {
      username: seller.username,
      phone: seller.phone,
      passwordHash,
      isDisabled: false,
      profile: {
        upsert: {
          create: {
            firstName: seller.firstName,
            lastName: seller.lastName,
            gender: seller.gender,
            birthDate: new Date(seller.birthDate),
            wilayaId: seller.wilayaId,
            municipality: seller.municipality,
            bio: seller.bio,
            showLocation: true,
            verified: true,
          },
          update: {
            firstName: seller.firstName,
            lastName: seller.lastName,
            gender: seller.gender,
            birthDate: new Date(seller.birthDate),
            wilayaId: seller.wilayaId,
            municipality: seller.municipality,
            bio: seller.bio,
            showLocation: true,
            verified: true,
          },
        },
      },
      wallet: {
        upsert: {
          create: {},
          update: {},
        },
      },
      paymentCcp: {
        upsert: {
          create: {
            accountNumber: seller.ccp.accountNumber,
            securityKey: seller.ccp.securityKey,
          },
          update: {
            accountNumber: seller.ccp.accountNumber,
            securityKey: seller.ccp.securityKey,
          },
        },
      },
      paymentEdahabia: {
        upsert: {
          create: seller.edahabia,
          update: seller.edahabia,
        },
      },
    },
  });
}

async function upsertProduct(sellerId, product) {
  const subcategory = await ensureCategoryAndSubcategory(product.categoryId, product.subcategoryId);
  const totalQuantity = product.options.reduce((sum, option) => sum + option.quantity, 0);
  const defaultPrice = product.options[0].price;

  const existing = await prisma.product.findFirst({
    where: {
      sellerId,
      title: product.title,
    },
    select: { id: true },
  });

  const data = {
    sellerId,
    title: product.title,
    description: product.description,
    condition: product.condition,
    packageSize: product.packageSize,
    freeShipping: product.freeShipping,
    price: defaultPrice,
    quantity: totalQuantity,
    categoryId: product.categoryId,
    subcategoryId: subcategory.id,
    deletedAt: null,
  };

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: {
        ...data,
        images: {
          deleteMany: {},
          create: product.images.map((url, index) => ({ url, sortOrder: index })),
        },
        options: {
          deleteMany: {},
          create: product.options.map((option, index) => ({
            name: option.name,
            price: option.price,
            quantity: option.quantity,
            sortOrder: index,
          })),
        },
      },
    });
    return;
  }

  await prisma.product.create({
    data: {
      ...data,
      images: {
        create: product.images.map((url, index) => ({ url, sortOrder: index })),
      },
      options: {
        create: product.options.map((option, index) => ({
          name: option.name,
          price: option.price,
          quantity: option.quantity,
          sortOrder: index,
        })),
      },
    },
  });
}

async function main() {
  const createdUsers = [];

  for (const seller of demoSellers) {
    // eslint-disable-next-line no-await-in-loop
    const user = await upsertDemoUser(seller);
    createdUsers.push({
      username: seller.username,
      email: seller.email,
      password: DEFAULT_PASSWORD,
      products: seller.products.length,
    });

    for (const product of seller.products) {
      // eslint-disable-next-line no-await-in-loop
      await upsertProduct(user.id, product);
    }
  }

  console.log("Demo sellers seeded successfully:");
  for (const user of createdUsers) {
    console.log(`- ${user.username} | ${user.email} | password: ${user.password} | products: ${user.products}`);
  }
}

main()
  .catch((error) => {
    console.error("Failed to seed demo sellers.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
