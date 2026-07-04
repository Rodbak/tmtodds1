"use client";

interface LeagueFilterProps {
  selected: string;
  onSelect: (league: string) => void;
  leagues: string[];
}

export default function LeagueFilter({ selected, onSelect, leagues }: LeagueFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {leagues.map((league) => {
        const active = selected === league;
        return (
          <button
            key={league}
            onClick={() => onSelect(league)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-[9px] font-archivo font-extrabold text-[11px] ${
              active ? "bg-accent-lime text-bg-primary" : "bg-bg-secondary border border-border-subtle text-text-secondary"
            }`}
          >
            {league}
          </button>
        );
      })}
    </div>
  );
}