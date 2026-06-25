import ProductImage from './ProductImage.jsx';

export default function ProductCard({
  imageUrl,
  imageAlt = 'Product',
  imageVariant = 'cardCover',
  className = '',
  contentClassName = '',
  children,
}) {
  return (
    <article
      className={`m-0 flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <div className="m-0 p-0">
        <ProductImage src={imageUrl} alt={imageAlt} variant={imageVariant} />
      </div>
      <div className={`flex flex-1 flex-col p-2 sm:p-5 ${contentClassName}`}>
        {children}
      </div>
    </article>
  );
}
