interface FormBadgeProps {
  letter: string;
  variant: "win" | "loss" | "draw";
}

export default function FormBadge({ letter, variant }: FormBadgeProps) {
  const colors = {
    win: "bg-[rgba(52,224,138,0.14)] text-accent-green",
    loss: "bg-[rgba(255,77,77,0.13)] text-accent-red",
    draw: "bg-[rgba(245,196,81,0.16)] text-accent-gold",
  };
  return (
    <div className={`flex-1 aspect-square flex items-center justify-center rounded-[9px] font-archivo font-extrabold text-[13px] ${colors[variant]}`}>
      {letter}
    </div>
  );
}