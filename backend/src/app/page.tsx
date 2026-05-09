const endpoints = [
  'GET /api/health',
  'GET /api/catalog',
  'GET /api/products/:id',
  'POST /api/orders',
  'GET /api/orders/:id',
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '48px 24px',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(248,243,236,1) 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          background: '#ffffff',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.08)',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 12,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            color: '#8b6914',
          }}
        >
          Next.js Backend
        </p>
        <h1 style={{ marginBottom: 12 }}>Esiarkomall API</h1>
        <p style={{ marginTop: 0, lineHeight: 1.7, color: '#555' }}>
          This service owns the product catalog, order creation, and order
          tracking endpoints used by the Flutter storefront.
        </p>
        <div
          style={{
            marginTop: 28,
            padding: 20,
            borderRadius: 10,
            background: '#f7f0e4',
          }}
        >
          {endpoints.map((endpoint) => (
            <div
              key={endpoint}
              style={{
                padding: '8px 0',
                borderBottom: '1px solid rgba(21, 21, 21, 0.08)',
                fontFamily: 'monospace',
              }}
            >
              {endpoint}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
