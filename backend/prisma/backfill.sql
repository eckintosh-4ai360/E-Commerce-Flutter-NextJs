-- Run once after `npm run db:push` on a database that already has orders.
-- Safe to run repeatedly.

-- Tracking codes are the upper-cased last 10 characters of the order id,
-- which is what the app has always shown customers.
UPDATE "Order"
SET "trackingCode" = UPPER(RIGHT("id", 10))
WHERE "trackingCode" IS NULL;

-- Give older orders a timeline: when they were placed...
INSERT INTO "OrderEvent" ("id", "orderId", "status", "note", "createdAt")
SELECT 'bf_placed_' || o."id", o."id", 'PENDING', 'Order placed', o."createdAt"
FROM "Order" o
WHERE NOT EXISTS (SELECT 1 FROM "OrderEvent" e WHERE e."orderId" = o."id");

-- ...and their current status, if it has moved on since.
INSERT INTO "OrderEvent" ("id", "orderId", "status", "note", "createdAt")
SELECT 'bf_current_' || o."id", o."id", o."status", NULL, o."updatedAt"
FROM "Order" o
WHERE o."status" <> 'PENDING'
  AND NOT EXISTS (
    SELECT 1 FROM "OrderEvent" e
    WHERE e."orderId" = o."id" AND e."status" = o."status"
  );
