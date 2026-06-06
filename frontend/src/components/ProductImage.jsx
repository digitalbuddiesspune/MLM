const VARIANTS = {
  card: {
    wrap: 'aspect-[4/3] w-full rounded-xl bg-slate-50',
    img: 'h-full w-full object-contain p-4',
  },
  cardMuted: {
    wrap: 'aspect-[4/3] w-full rounded-xl bg-[#dfe4e8]',
    img: 'h-full w-full object-contain p-4',
  },
  thumb: {
    wrap: 'h-20 w-20 shrink-0 rounded-lg bg-slate-50',
    img: 'h-full w-full object-contain p-1.5',
  },
  thumbSm: {
    wrap: 'h-12 w-12 shrink-0 rounded-lg bg-slate-50',
    img: 'h-full w-full object-contain p-1',
  },
  thumbXs: {
    wrap: 'h-10 w-10 shrink-0 rounded-lg bg-slate-50',
    img: 'h-full w-full object-contain p-0.5',
  },
  admin: {
    wrap: 'h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-slate-50',
    img: 'h-full w-full object-contain p-1',
  },
  preview: {
    wrap: 'aspect-[4/3] w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50',
    img: 'h-full w-full object-contain p-4',
  },
  banner: {
    wrap: 'w-full overflow-hidden rounded-2xl bg-[#dfe4e8]',
    img: 'h-auto w-full object-cover object-center',
  },
};

export default function ProductImage({
  src,
  alt = 'Product',
  variant = 'card',
  className = '',
  emptyLabel = 'No image',
}) {
  const styles = VARIANTS[variant] ?? VARIANTS.card;

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center text-xs font-medium text-slate-400 ${styles.wrap} ${className}`}
      >
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden ${styles.wrap} ${className}`}>
      <img src={src} alt={alt} loading="lazy" decoding="async" className={styles.img} />
    </div>
  );
}
