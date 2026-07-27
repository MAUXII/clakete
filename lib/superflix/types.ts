/** Tipos da SuperFlixAPI (catálogo público / WebTV). */

export type SuperflixCatalogCategory =
  | "filme"
  | "serie"
  | "anime"
  | "dorama";

export type SuperflixIdType = "tmdb" | "imdb";

export type SuperflixGenre = {
  id: number;
  name: string;
  slug: string;
  category: string;
  source: string;
  items_count: number;
  contents_url: string;
};

export type SuperflixChannel = {
  id: string;
  name: string;
  description: string;
  logo_url: string;
  embed_url: string;
  category: string;
  is_active: boolean;
};

export type SuperflixChannelCategory = {
  id: string;
  name: string;
};

export type SuperflixEvent = {
  id: string;
  title: string;
  description?: string;
  page_url?: string;
  play_event_url?: string;
  status?: string;
  sport?: string;
};

export type SuperflixPlayerOptions = {
  /** Oculta lista de episódios */
  noEpList?: boolean;
  /** Remove botão de link externo */
  noLink?: boolean;
  /** Fundo transparente */
  transparent?: boolean;
  /** Cor de destaque sem `#`, ex: `ff0000` */
  color?: string;
};
