import Image from "next/image";

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
}: {
  person: CreditPerson;
  role: string;
}) {
  const initial = (person.name?.[0] || "?").toUpperCase();

  return (
    <div className="group flex items-center justify-between gap-3 py-2.5 border-b border-black/10 dark:border-white/10 last:border-b-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative h-9 w-9 shrink-0 rounded-full overflow-hidden bg-muted">
          {person.profile_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${person.profile_path}`}
              alt={person.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center font-semibold text-xs text-muted-foreground">
              {initial}
            </div>
          )}
        </div>
        <p className="font-medium truncate text-sm">{person.name}</p>
      </div>
      <p className="text-xs text-muted-foreground truncate text-right">{role}</p>
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
  const castRows = cast.slice(0, 18);
  const crewRows = crew.slice(0, 18);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h3 className="font-medium text-muted-foreground/50 text-sm uppercase mb-2">Cast</h3>
        <div className="w-full h-[0.3px] bg-muted-foreground/10 mb-1"></div>
        <div className="flex flex-col">
          {castRows.map((person) => (
            <PersonRow key={`cast-${person.id}-${person.character}`} person={person} role={person.character} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-medium text-muted-foreground/50 text-sm uppercase mb-2">Crew</h3>
        <div className="w-full h-[0.3px] bg-muted-foreground/10 mb-1"></div>
        <div className="flex flex-col">
          {crewRows.map((person) => (
            <PersonRow key={`crew-${person.id}-${person.job}`} person={person} role={person.job} />
          ))}
        </div>
      </div>
    </div>
  );
}
