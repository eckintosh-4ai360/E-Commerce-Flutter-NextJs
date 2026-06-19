import Link from 'next/link';

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: '#faf9f7',
        color: '#1a1a1a',
        textAlign: 'center',
      }}
    >
      <div>
        <p style={{ fontSize: 13, letterSpacing: 2, color: '#8a8a8a', margin: 0 }}>404</p>
        <h1 style={{ margin: '8px 0 12px' }}>Page not found</h1>
        <p style={{ color: '#5c5c5c', margin: '0 0 20px' }}>
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 22px',
            borderRadius: 8,
            background: '#1a1a1a',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          Go to the store
        </Link>
      </div>
    </main>
  );
}
