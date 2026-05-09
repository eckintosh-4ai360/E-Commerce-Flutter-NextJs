import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !databaseUrl.startsWith('file:')) {
  throw new Error(
    'DATABASE_URL must be set to a file:... SQLite path before running db:init.',
  );
}

const databasePath = databaseUrl
  .replace(/^file:\/\//, '')
  .replace(/^file:\//, '')
  .replace(/^file:/, '');
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS "Product" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "originalPrice" REAL,
    "imagePath" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "rating" REAL NOT NULL DEFAULT 4.5,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "inStock" INTEGER NOT NULL DEFAULT 1,
    "sizes" TEXT NOT NULL DEFAULT '[]',
    "colors" TEXT NOT NULL DEFAULT '[]',
    "isNew" INTEGER NOT NULL DEFAULT 0,
    "isBestSeller" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "deliveryAddress" TEXT,
    "notes" TEXT,
    "subtotal" REAL NOT NULL,
    "shippingFee" REAL NOT NULL,
    "total" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "quantity" INTEGER NOT NULL,
    "selectedColor" TEXT,
    "selectedSize" TEXT,
    CONSTRAINT "OrderItem_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );

  CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem" ("orderId");
  CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem" ("productId");
`);

db.close();
console.log(`SQLite schema initialised at ${databasePath}`);
