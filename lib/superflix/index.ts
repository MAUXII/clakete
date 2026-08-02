export {
  SUPERFLIX_BASE_URL,
  SuperflixApiError,
  buildMoviePlayerUrl,
  buildSeriesPlayerUrl,
  buildChannelPlayerUrl,
  listGenres,
  listCatalogIds,
  getMovieCatalogSet,
  getMovieImdbCatalogSet,
  isMovieInCatalog,
  getSeriesCatalogSet,
  isSeriesInCatalog,
  listChannelCategories,
  listChannels,
  listEvents,
} from "./client";

export type {
  SuperflixCatalogCategory,
  SuperflixIdType,
  SuperflixGenre,
  SuperflixChannel,
  SuperflixChannelCategory,
  SuperflixEvent,
  SuperflixPlayerOptions,
} from "./types";
