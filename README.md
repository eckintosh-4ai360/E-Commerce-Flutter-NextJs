# Eckintoshmall

Flutter storefront with a Next.js backend for catalog data, order creation, and order tracking.

## What changed

- `backend/` now contains a Next.js App Router API workspace.
- Prisma schema and seed data were added for products and orders.
- Flutter now loads catalog data through a shared API layer.
- Checkout now posts orders to the backend.
- Order tracking now looks up real orders by ID.
- If the backend is unavailable, the catalog falls back to the built-in demo products so the app still opens.

## Backend setup

From `backend/`:

```bash
npm install
npm run prisma:generate
npm run db:push
npm run db:seed
npm run dev -- --hostname 0.0.0.0
```

The backend runs on `http://localhost:3000`.

Environment variables:

- `DATABASE_URL`: pooled Neon connection string for the running app
- `DIRECT_URL`: unpooled Neon connection string for Prisma schema commands

Available endpoints:

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/products/:id`
- `POST /api/orders`
- `GET /api/orders/:id`

## Flutter setup

From the repo root:

```bash
flutter pub get
flutter run
```

Default API base URLs:

- Android emulator: `http://10.0.2.2:3000/api`
- Flutter web / desktop: `http://localhost:3000/api`

For a physical device, pass your machine IP:

```bash
flutter run --dart-define=API_BASE_URL=http://YOUR_IP:3000/api
```

## Notes

- The backend now targets Neon Postgres instead of the previous local SQLite setup.
- The backend seed still loads the same storefront products the Flutter demo used before the API integration.
