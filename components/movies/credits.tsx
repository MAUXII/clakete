"use client";

import Image from "next/image";
import { useDesignMode } from "@/hooks/use-design-mode";
import { cn } from "@/lib/utils";

interface CreditPerson {
  id: number;
  name: string;
  profile_path: string | null;
}

interface CastPerson extends CreditPerson {
  character: string;
}

interface CrewPerson extends CreditPerson {
  job: string;
}

function PersonRow({
  person,
  role,
  isGlass,
}: {
  person: CreditPerson;
  role: string;
  isGlass: boolean;
}) {
  const initial = (person.name?.[0] || "?").toUpperCase();

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0",
        isGlass
          ? "border-white/10"
          : "border-black/10 dark:border-border",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "relative h-9 w-9 shrink-0 overflow-hidden rounded-full",
            isGlass ? "bg-white/[0.06]" : "bg-muted",
          )}
        >
          {person.profile_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
              alt={person.name}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center text-xs font-semibold",
                isGlass ? "text-white/40" : "text-muted-foreground",
              )}
            >
              {initial}
            </div>
          )}
        </div>
        <p
          className={cn(
            "truncate text-sm font-medium",
            isGlass && "text-white/90",
          )}
        >
          {person.name}
        </p>
      </div>
      <p
        className={cn(
          "truncate text-right text-xs",
          isGlass ? "text-white/40" : "text-muted-foreground",
        )}
      >
        {role}
      </p>
    </div>
  );
}

export default function CreditsList({
  cast,
  crew,
}: {
  cast: CastPerson[];
  crew: CrewPerson[];
}) {
  const isGlass = useDesignMode() === "glass";
  const castRows = cast.slice(0, 18);
  const crewRows = crew.slice(0, 18);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div>
        <h3
          className={cn(
            "mb-2 text-sm font-medium uppercase",
            isGlass ? "text-white/40" : "text-muted-foreground/50",
          )}
        >
          Cast
        </h3>
        <div
          className={cn(
            "mb-1 h-px w-full",
            isGlass ? "bg-white/15" : "bg-muted-foreground/10",
          )}
        />
        <div className="flex flex-col">
          {castRows.map((person) => (
            <PersonRow
              key={`cast-${person.id}-${person.character}`}
              person={person}
              role={person.character}
              isGlass={isGlass}
            />
          ))}
        </div>
      </div>
      <div>
        <h3
          className={cn(
            "mb-2 text-sm font-medium uppercase",
            isGlass ? "text-white/40" : "text-muted-foreground/50",
          )}
        >
          Crew
        </h3>
        <div
          className={cn(
            "mb-1 h-px w-full",
            isGlass ? "bg-white/15" : "bg-muted-foreground/10",
          )}
        />
        <div className="flex flex-col">
          {crewRows.map((person) => (
            <PersonRow
              key={`crew-${person.id}-${person.job}`}
              person={person}
              role={person.job}
              isGlass={isGlass}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
