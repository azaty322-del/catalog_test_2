interface MetadataItem {
  label: string;
  value: string;
}

export function MetadataTable({ items }: { items: MetadataItem[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-start justify-between gap-4 border-b border-line py-2.5 last:border-b-0"
        >
          <dt className="text-body-sm text-ink-muted">{item.label}</dt>
          <dd className="text-right text-body-sm font-semibold text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
