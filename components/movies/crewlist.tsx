
import { Movie } from '@/app/film/[id]/page';

export default function CrewList({ movie }: { movie: Movie }) {
    const groupedCrew = movie.crew.reduce((acc, person) => {
      const department = person.department || 'Other';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(person);
      return acc;
    }, {} as Record<string, typeof movie.crew>);

    return (
        <div className="flex flex-col gap-6">
          {Object.entries(groupedCrew).map(([department, crew]) => (
            <div key={department}>
              <h3 className="text-muted-foreground/70 text-sm font-medium mb-2">{department}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {crew.map((person) => (
                  <div
                    key={person.id || person.name}
                    className="rounded-md border dark:border-white/20 border-black/20 bg-muted-foreground/10 px-3 py-2"
                  >
                    <div className="font-medium text-sm truncate" title={person.name}>
                      {person.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1" title={person.job}>
                      {person.job}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
    );
}