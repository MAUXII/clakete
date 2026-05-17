import { readFileSync, writeFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
const key = env.match(/NEXT_TMDB_API_KEY\s*=\s*(\S+)/)?.[1];
if (!key) throw new Error("No TMDB key");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

const endpoints = [
  "https://api.themoviedb.org/3/trending/movie/week?language=en-US",
  "https://api.themoviedb.org/3/trending/tv/week?language=en-US",
  "https://api.themoviedb.org/3/movie/popular?language=en-US&page=1",
  "https://api.themoviedb.org/3/movie/popular?language=en-US&page=2",
  "https://api.themoviedb.org/3/tv/popular?language=en-US&page=1",
  "https://api.themoviedb.org/3/tv/popular?language=en-US&page=2",
];

const paths = new Set();
for (const ep of endpoints) {
  const data = await fetchJson(`${ep}&api_key=${key}`);
  for (const item of data.results ?? []) {
    if (item.poster_path) paths.add(item.poster_path);
  }
}

const list = [...paths].slice(0, 48);
console.log("count", list.length);
for (const p of list) console.log(p);

const out = `const TMDB_W500 = "https://image.tmdb.org/t/p/w500"

/** TMDB poster paths — fetched from trending/popular (films + series). */
const SPLASH_POSTER_PATHS = [
${list.map((p) => `  "${p}",`).join("\n")}
] as const

export const SPLASH_POSTER_URLS: string[] = SPLASH_POSTER_PATHS.map(
  (path) => \`\${TMDB_W500}\${path}\`,
)
`;

writeFileSync("lib/splash-poster-urls.ts", out);
console.log("wrote lib/splash-poster-urls.ts");
