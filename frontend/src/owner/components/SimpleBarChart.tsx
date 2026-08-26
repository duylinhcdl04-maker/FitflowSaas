export default function SimpleBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {data.map((d, i) => (
        <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-1">
          <div
            className="w-full rounded-t-md bg-emerald-500/80 transition-colors group-hover:bg-emerald-600 dark:bg-emerald-500/60 dark:group-hover:bg-emerald-400"
            style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
            title={`${d.label}: ${d.value.toLocaleString('vi-VN')}đ`}
          />
        </div>
      ))}
    </div>
  );
}
