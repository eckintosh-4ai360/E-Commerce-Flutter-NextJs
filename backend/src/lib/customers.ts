import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from './auth';
import { HttpError, isPrismaError } from './errors';
import { getPrisma } from './prisma';
import { storeConfig } from './store-config';
import type { AddressInput } from './validation';

export async function ensureCustomer(user: AuthenticatedUser) {
  const prisma = getPrisma();
  const existing = await prisma.customer.findUnique({ where: { uid: user.uid } });

  if (existing) {
    const data: Prisma.CustomerUpdateInput = {};
    if (existing.email !== user.email) data.email = user.email;
    if (!existing.phone && user.phone) data.phone = user.phone;
    if (!existing.name && user.name) data.name = user.name;
    return Object.keys(data).length === 0
      ? existing
      : prisma.customer.update({ where: { uid: user.uid }, data });
  }

  try {
    return await prisma.customer.create({
      data: { uid: user.uid, email: user.email, phone: user.phone, name: user.name },
    });
  } catch (error) {
    // Two first requests raced; the other one created the row.
    if (isPrismaError(error, 'P2002')) {
      return prisma.customer.findUniqueOrThrow({ where: { uid: user.uid } });
    }
    throw error;
  }
}

export async function updateProfile(
  user: AuthenticatedUser,
  data: Prisma.CustomerUpdateInput,
) {
  await ensureCustomer(user);
  return getPrisma().customer.update({ where: { uid: user.uid }, data });
}

/** Fills in profile gaps from checkout details without overwriting edits. */
export async function rememberCheckoutDetails(
  user: AuthenticatedUser,
  details: { name: string; phone: string },
) {
  const customer = await ensureCustomer(user);
  const data: Prisma.CustomerUpdateInput = {};
  if (!customer.name) {
    data.name = details.name;
  }
  if (!customer.phone) {
    data.phone = details.phone;
  }
  if (Object.keys(data).length > 0) {
    await getPrisma().customer.update({ where: { uid: user.uid }, data });
  }
}

export async function listAddresses(user: AuthenticatedUser) {
  return getPrisma().address.findMany({
    where: { customerUid: user.uid },
    orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
  });
}

async function findOwnedAddress(user: AuthenticatedUser, id: string) {
  const address = await getPrisma().address.findFirst({
    where: { id, customerUid: user.uid },
  });
  if (!address) {
    throw new HttpError(404, 'Address not found.');
  }
  return address;
}

export async function createAddress(user: AuthenticatedUser, input: AddressInput) {
  await ensureCustomer(user);
  const prisma = getPrisma();
  const count = await prisma.address.count({ where: { customerUid: user.uid } });
  if (count >= storeConfig.maxSavedAddresses) {
    throw new HttpError(
      400,
      `You can save up to ${storeConfig.maxSavedAddresses} addresses. Remove one to add another.`,
    );
  }

  const makeDefault = input.isDefault === true || count === 0;
  const { isDefault: _ignored, ...fields } = input;

  return prisma.$transaction(async (tx) => {
    if (makeDefault) {
      await tx.address.updateMany({
        where: { customerUid: user.uid },
        data: { isDefault: false },
      });
    }
    return tx.address.create({
      data: { ...fields, customerUid: user.uid, isDefault: makeDefault },
    });
  });
}

export async function updateAddress(
  user: AuthenticatedUser,
  id: string,
  input: AddressInput,
) {
  const existing = await findOwnedAddress(user, id);
  // The default can be moved to another address but not simply switched off.
  const makeDefault = input.isDefault === true || existing.isDefault;
  const { isDefault: _ignored, ...fields } = input;

  return getPrisma().$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.address.updateMany({
        where: { customerUid: user.uid, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: { ...fields, isDefault: makeDefault },
    });
  });
}

export async function deleteAddress(user: AuthenticatedUser, id: string) {
  const existing = await findOwnedAddress(user, id);
  const prisma = getPrisma();
  await prisma.address.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await prisma.address.findFirst({
      where: { customerUid: user.uid },
      orderBy: { updatedAt: 'desc' },
    });
    if (next) {
      await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  }
}

export async function listWishlist(user: AuthenticatedUser) {
  const items = await getPrisma().wishlistItem.findMany({
    where: { customerUid: user.uid, product: { isArchived: false } },
    include: { product: true },
    orderBy: { createdAt: 'desc' },
  });
  return items.map((item) => item.product);
}

export async function addToWishlist(user: AuthenticatedUser, productIds: number[]) {
  if (productIds.length === 0) {
    return;
  }
  await ensureCustomer(user);
  const prisma = getPrisma();
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isArchived: false },
    select: { id: true },
  });
  await prisma.wishlistItem.createMany({
    data: products.map((product) => ({ customerUid: user.uid, productId: product.id })),
    skipDuplicates: true,
  });
}

export async function removeFromWishlist(user: AuthenticatedUser, productId: number) {
  await getPrisma().wishlistItem.deleteMany({
    where: { customerUid: user.uid, productId },
  });
}
