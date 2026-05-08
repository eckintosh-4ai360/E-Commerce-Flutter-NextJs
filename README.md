# Esiarkomall

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
npm run db:init
npm run db:seed
npm run dev -- --hostname 0.0.0.0
```

The backend runs on `http://localhost:3000`.

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

- `npm run db:init` is included as a SQLite bootstrap step for this Windows setup.
- The backend seed currently loads the same storefront products the Flutter demo used before the API integration.
