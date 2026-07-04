"use client";

interface SegmentedFilterProps {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}

export default function SegmentedFilter({ options, selected, onSelect }: SegmentedFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {options.map((option) => {
        const active = selected === option;
        return (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-[9px] font-archivo font-extrabold text-[11px] ${
              active ? "bg-accent-lime text-bg-primary" : "bg-bg-secondary border border-border-subtle text-text-secondary"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}