interface StatCardProps {
  value: string;
  label: string;
  color: string;
}

export default function StatCard({ value, label, color }: StatCardProps) {
  return (
    <div className="flex-1 bg-bg-secondary border border-border-subtle rounded-[14px] p-3">
      <div className={`font-mono font-extrabold text-[22px] leading-none ${color}`}>{value}</div>
      <div className="font-semibold text-[10px] text-text-secondary mt-1">{label}</div>
    </div>
  );
}