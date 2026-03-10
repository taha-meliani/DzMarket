import { prisma } from "../config/prisma.js";

export const productModel = {
  ensureCategoryAndSubcategory: async (categoryId, subcategoryId) => {
    const subName = subcategoryId.includes(":") ? subcategoryId.split(":").at(-1) : subcategoryId;
    const category = await prisma.category.upsert({
      where: { id: categoryId },
      create: { id: categoryId, name: categoryId },
      update: {},
    });

    const subcategory = await prisma.subcategory.findFirst({
      where: {
        OR: [{ id: subcategoryId }, { categoryId: category.id, name: subName }],
      },
    });

    if (subcategory) {
      if (subcategory.categoryId !== category.id) {
        // Keep subcategory ids globally unique across categories.
        const mappedId = `${category.id}:${subcategoryId}`;
        return prisma.subcategory.upsert({
          where: { id: mappedId },
          create: { id: mappedId, categoryId: category.id, name: subName },
          update: {},
        });
      }
      return subcategory;
    }

    return prisma.subcategory.create({
      data: { id: subcategoryId, categoryId: category.id, name: subName },
    });
  },
  create: (data) =>
    prisma.product.create({
      data,
      include: {
        category: true,
        subcategory: true,
        seller: { select: { id: true, username: true } },
        images: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
    }),
  listBySeller: (sellerId, requesterId, requesterRole) => {
    const visibilityFilter = requesterId
      ? {
          OR: [{ seller: { isDisabled: false } }, { sellerId: requesterId }],
        }
      : { seller: { isDisabled: false } };
    return prisma.product.findMany({
      where: { sellerId, deletedAt: null, ...visibilityFilter },
      include: {
        category: true,
        subcategory: true,
        seller: { select: { id: true, username: true } },
        images: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  },
  listCategories: () =>
    prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
  count: () =>
    prisma.product.count({
      where: { deletedAt: null },
    }),
  list: () =>
    prisma.product.findMany({
      where: {
        deletedAt: null,
        seller: { isDisabled: false },
        quantity: {
          gt: 0,
        },
      },
      include: {
        category: true,
        subcategory: true,
        seller: { select: { id: true, username: true } },
        images: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    }),
  getById: (id, requesterId, requesterRole) => {
    const visibilityFilter = requesterId
      ? {
          OR: [{ seller: { isDisabled: false } }, { sellerId: requesterId }],
        }
      : { seller: { isDisabled: false } };
    return prisma.product.findFirst({
      where: { id, deletedAt: null, ...visibilityFilter },
      include: {
        category: true,
        subcategory: true,
        seller: { select: { id: true, username: true } },
        images: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
    });
  },
  update: (id, data) =>
    prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        subcategory: true,
        seller: { select: { id: true, username: true } },
        images: { orderBy: { sortOrder: "asc" } },
        options: { orderBy: { sortOrder: "asc" } },
      },
    }),
  remove: (id) =>
    prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
};
