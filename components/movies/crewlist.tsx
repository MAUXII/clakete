import { useState } from 'react';
import { Movie } from '@/app/film/[id]/page';

export default function CrewList({ movie }: { movie: Movie }) {
  

    // Agrupar crew por department
    const groupedCrew = movie.crew.reduce((acc, person) => {
      const department = person.department || 'Other';
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(person);
      return acc;
    }, {} as Record<string, typeof movie.crew>);

    return (
      <>
        <div className="flex flex-col gap-6 space-y-6">
          {Object.entries(groupedCrew).map(([department, crew]) => (
            <div  style={{ direction: 'ltr' }} key={department} className="flex justify-between w-full ">
              <h2 className="text-muted-foreground/50 text-sm font-medium">{department}.....</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 items-center gap-2" style={{ direction: 'rtl' }}>
            {crew.map((person, index) => (
              <div
                className="flex flex-col py-2 px-3 w-full h-auto rounded-md border dark:border-white/20 border-black/20 overflow-clip items-center bg-[#FF0048]/10"
                style={{ direction: 'ltr' }} // Reset text direction to left-to-right
              >
                <h3
                  className="text-[#FF0048] truncate font-medium  text-xs w-full text-center"
                  title={`${person.name} - ${person.job}`}
                >
                  {person.name}
                 
                </h3>
                <div title={`${person.job}`} className="text-xs truncate max-w-40 text-[#FF0048]/65">{person.job}</div>
              </div>
            ))}
          </div>
            </div>
          ))}
        </div>
       
      </>
    );
}