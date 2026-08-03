export default function StoreLoading() {
  return (
    <div className="container" aria-busy="true" aria-label="Loading">
      <div className="skeleton" style={{ height: 34, width: 220, margin: '24px 0 20px' }} />
      <div className="product-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="skeleton" style={{ aspectRatio: '4 / 6' }} />
        ))}
      </div>
    </div>
  );
}
