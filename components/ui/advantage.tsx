import React from 'react';

interface AdvantageProps {
  icon: React.ReactNode;
  color: string; // cor para o ícone e fundo do quadrado
  title: string;
  text: string;
  bgOpacity?: number; // opacidade do fundo do quadrado
  className?: string;
}

// Função para converter HEX para RGBA
function hexToRgba(hex: string, alpha: number) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function Advantage({ icon, color, title, text, bgOpacity = 0.15, className }: AdvantageProps) {
  return (
    <div className={`${className} flex w-full flex-col p-6 rounded-md border dark:border-[#FFFFFF]/10 dark:bg-[#1A1A1C]/20 gap-2`}>
      <div
        className="flex items-center justify-center w-12 h-12 rounded-lg mb-2"
        style={{ backgroundColor: hexToRgba(color, bgOpacity) }}
      >
        <span style={{ color: color === '#fff' ? '#000' : color, fontSize: 16 }}>{icon}</span>
      </div>
      <h3 className="font-semibold text-lg" style={{ color }}>{title}</h3>
      <p className="text-muted-foreground text-sm max-w-[450px]">{text}</p>
    </div>
  );
}
