"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = 4;

function buildColumnImages(images: string[], colIndex: number): string[] {
  if (images.length === 0) return [];
  const chunkSize = Math.max(6, Math.ceil(images.length / COLUMN_COUNT));
  const column: string[] = [];
  for (let i = 0; i < chunkSize; i++) {
    column.push(images[(colIndex * chunkSize + i) % images.length]!);
  }
  return column;
}

function MarqueePoster({
  src,
  className,
}: {
  src: string;
  className: string;
}) {
  return (
    <div className="relative shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Movie poster"
        className={className}
        width={424}
        height={636}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallback === "1") return;
          img.dataset.fallback = "1";
          img.src = "/placeholder.png";
        }}
      />
    </div>
  );
}

function ContinuousScrollColumn({
  images,
  direction,
  imgClassName,
  duration,
}: {
  images: string[];
  direction: "up" | "down";
  imgClassName: string;
  duration: number;
}) {
  const loop = useMemo(() => [...images, ...images], [images]);
  const isUp = direction === "up";

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <motion.div
        className="flex flex-col items-start gap-8 will-change-transform"
        initial={{ y: isUp ? "0%" : "-50%" }}
        animate={{ y: isUp ? "-50%" : "0%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {loop.map((src, i) => (
          <MarqueePoster key={`${src}-${i}`} src={src} className={imgClassName} />
        ))}
      </motion.div>
    </div>
  );
}

export const ThreeDMarquee = ({
  images,
  className,
  variant = "default",
  showGrid = true,
}: {
  images: string[];
  className?: string;
  variant?: "default" | "poster";
  showGrid?: boolean;
}) => {
  const isPoster = variant === "poster";
  const imgClassName = isPoster
    ? "aspect-[2/3] w-[168px] rounded-md object-cover ring ring-white/10 sm:w-[192px] md:w-[212px]"
    : "aspect-[970/700] rounded-lg object-cover ring ring-gray-950/5 hover:shadow-2xl";

  const chunks = useMemo(
    () =>
      Array.from({ length: COLUMN_COUNT }, (_, colIndex) =>
        buildColumnImages(images, colIndex),
      ),
    [images],
  );

  const scrollDurations = [72, 88, 64, 80];

  const grid = (
    <div
      style={{
        transform: isPoster
          ? "rotateX(50deg) rotateY(0deg) rotateZ(-45deg)"
          : "rotateX(55deg) rotateY(0deg) rotateZ(-45deg)",
      }}
      className={cn(
        "grid grid-cols-4 gap-8 transform-3d",
        isPoster
          ? "h-[min(128vmin,1100px)] w-[min(128vmin,1100px)]"
          : "relative top-96 right-[50%] size-full origin-top-left",
      )}
    >
            {chunks.map((subarray, colIndex) =>
              isPoster ? (
                <ContinuousScrollColumn
                  key={`scroll-${colIndex}`}
                  images={subarray}
                  direction={colIndex % 2 === 0 ? "up" : "down"}
                  imgClassName={imgClassName}
                  duration={scrollDurations[colIndex] ?? 72}
                />
              ) : (
                <motion.div
                  key={colIndex + "marquee"}
                  animate={{ y: colIndex % 2 === 0 ? 100 : -100 }}
                  transition={{
                    duration: colIndex % 2 === 0 ? 10 : 15,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  className="flex flex-col items-start gap-8"
                >
                  {showGrid ? (
                    <GridLineVertical className="-left-4" offset="80px" />
                  ) : null}
                  {subarray.map((image, imageIndex) => (
                    <div className="relative" key={imageIndex + image}>
                      {showGrid ? (
                        <GridLineHorizontal className="-top-4" offset="20px" />
                      ) : null}
                      <motion.img
                        whileHover={{ y: -10 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeInOut",
                        }}
                        src={image}
                        alt={`Image ${imageIndex + 1}`}
                        className={imgClassName}
                        width={970}
                        height={700}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ))}
                </motion.div>
              ),
            )}
    </div>
  );

  if (isPoster) {
    return (
      <div
        className={cn(
          "relative flex h-full min-h-dvh w-full items-center justify-center overflow-hidden",
          className,
        )}
      >
        <div
          className="absolute inset-[-28vmin] flex items-center justify-center"
          style={{ perspective: "1400px" }}
        >
          <div
            className={cn(
              "flex shrink-0 items-center justify-center",
              "scale-[0.58] sm:scale-[0.76] lg:scale-[1.38]",
            )}
          >
            {grid}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto block h-[600px] overflow-hidden rounded-2xl max-sm:h-100",
        className,
      )}
    >
      <div className="flex size-full items-center justify-center">
        <div className="size-[1280px] shrink-0 scale-50 sm:scale-75 lg:scale-100">
          {grid}
        </div>
      </div>
    </div>
  );
};

const GridLineHorizontal = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "1px",
          "--width": "5px",
          "--fade-stop": "90%",
          "--offset": offset || "200px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute left-[calc(var(--offset)/2*-1)] h-[var(--height)] w-[calc(100%+var(--offset))]",
        "bg-[linear-gradient(to_right,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_left,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_right,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_right,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};

const GridLineVertical = ({
  className,
  offset,
}: {
  className?: string;
  offset?: string;
}) => {
  return (
    <div
      style={
        {
          "--background": "#ffffff",
          "--color": "rgba(0, 0, 0, 0.2)",
          "--height": "5px",
          "--width": "1px",
          "--fade-stop": "90%",
          "--offset": offset || "150px", //-100px if you want to keep the line inside
          "--color-dark": "rgba(255, 255, 255, 0.2)",
          maskComposite: "exclude",
        } as React.CSSProperties
      }
      className={cn(
        "absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]",
        "bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]",
        "[background-size:var(--width)_var(--height)]",
        "[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]",
        "[mask-composite:exclude]",
        "z-30",
        "dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]",
        className,
      )}
    ></div>
  );
};
