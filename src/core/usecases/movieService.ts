import { supabase } from '../../infrastructure/supabaseClient';
import { fetchMovieFromTvdb, fetchSeriesFromTvdb } from '../../infrastructure/external/tvdbService';

interface MovieRecord {
    id: string;
    tvdb_id: string;
    imdb_id: string | null;
    name: string;
    extended_title: string | null;
    year: string | null;
    overview: string | null;
    country: string | null;
    director: string | null;
    poster_url: string | null;
    thumbnail_url: string | null;
    genre: string[] | null;
    first_air_time: string | null;
    language: string | null;
    status: string | null;
    fetched_at: string;
}

export async function getOrCreateMovies(
  title: string,
  tvdbApiKey: string
): Promise<MovieRecord[] | null> {
  // Search locally using fuzzy RPC function
  const { data: localMovies, error: localError } = await supabase
    .rpc('search_movies_fuzzy', { search_term: title.trim() });

  if (localError) throw localError;

  // If local movies found are 5 or more, return them directly
  if (localMovies && localMovies.length >= 5) {
    return localMovies;
  }

  // Fetch movies from TVDB (multiple results)
  const tvdbMovies = await fetchMovieFromTvdb(title, tvdbApiKey);
  if (!tvdbMovies || tvdbMovies.length === 0) {
    return localMovies ?? null;
  }

  // Extract all TVDB IDs from fetched TVDB movies
  const tvdbIdsToCheck = tvdbMovies.map(m => m.id);

  // Query Supabase to find which TVDB IDs already exist
  const { data: existingMoviesByTvdbId, error: existingError } = await supabase
    .from('movies')
    .select('tvdb_id')
    .in('tvdb_id', tvdbIdsToCheck);

  if (existingError) throw existingError;

  const existingTvdbIds = new Set(existingMoviesByTvdbId?.map(m => m.tvdb_id) ?? []);

  // Filter TVDB movies to only those not already in DB
  const moviesToInsert = tvdbMovies
    .filter(m => !existingTvdbIds.has(m.id))
    .map(m => ({
      tvdb_id: m.id,
      imdb_id:
        m.remote_ids?.find((id: any) => id.sourceName === 'IMDB')?.id ?? null,
      name: m.name,
      extended_title: m.extended_title ?? null,
      year: m.year ?? null,
      overview: m.overview ?? null,
      country: m.country ?? null,
      director: m.director ?? null,
      poster_url: m.image_url ?? null,
      thumbnail_url: m.thumbnail ?? null,
      genre: m.genres ?? null,
      first_air_time: m.first_air_time ?? null,
      language: m.primary_language ?? null,
      status: m.status ?? null,
      fetched_at: new Date().toISOString(),
    }));

  let insertedMovies: MovieRecord[] = [];
  if (moviesToInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('movies')
      .insert(moviesToInsert)
      .select('*');

    if (insertError) throw insertError;

    insertedMovies = inserted ?? [];
  }

  return [...(localMovies ?? []), ...insertedMovies];
}



interface SeriesRecord {
  id: string;
  tvdb_id: string;
  imdb_id: string | null;
  name: string;
  extended_title: string | null;
  year: string | null;
  overview: string | null;
  country: string | null;
  director: string | null;
  poster_url: string | null;
  thumbnail_url: string | null;
  genre: string[] | null;
  first_air_time: string | null;
  language: string | null;
  status: string | null;
  network: string | null;
  fetched_at: string;
}

export async function getOrCreateSeries(
  title: string,
  tvdbApiKey: string
): Promise<SeriesRecord[] | null> {
  // Search locally using fuzzy RPC function
  const { data: localSeries, error: localError } = await supabase
    .rpc('search_series_fuzzy', { search_term: title.trim() });

  if (localError) throw localError;

  // Return local if found at least 5 records
  if (localSeries && localSeries.length >= 5) {
    return localSeries;
  }

  // Fetch series from TVDB
  const tvdbSeries = await fetchSeriesFromTvdb(title, tvdbApiKey);
  if (!tvdbSeries || tvdbSeries.length === 0) {
    return localSeries ?? null;
  }

  // Get existing tvdb_ids from local DB
  const tvdbIdsToCheck = tvdbSeries.map(s => s.id);
  const { data: existing, error: errExisting } = await supabase
    .from('series')
    .select('tvdb_id')
    .in('tvdb_id', tvdbIdsToCheck);

  if (errExisting) throw errExisting;

  const existingIds = new Set(existing?.map(s => s.tvdb_id) ?? []);

  // Filter new series not in DB
  const newSeriesToInsert = tvdbSeries
    .filter(s => !existingIds.has(s.id))
    .map(s => ({
      tvdb_id: s.id,
      imdb_id:
        s.remote_ids?.find((id: any) => id.sourceName === 'IMDB')?.id ?? null,
      name: s.name,
      extended_title: s.extended_title ?? null,
      year: s.year ?? null,
      overview: s.overview ?? null,
      country: s.country ?? null,
      director: s.director ?? null,
      poster_url: s.image_url ?? null,
      thumbnail_url: s.thumbnail ?? null,
      genre: s.genres ?? null,
      first_air_time: s.first_air_time ?? null,
      language: s.primary_language ?? null,
      status: s.status ?? null,
      network: s.network ?? null,
      fetched_at: new Date().toISOString(),
    }));

  let inserted: SeriesRecord[] = [];
  if (newSeriesToInsert.length > 0) {
    const { data, error } = await supabase
      .from('series')
      .insert(newSeriesToInsert)
      .select('*');

    if (error) throw error;
    inserted = data ?? [];
  }

  return [...(localSeries ?? []), ...inserted];
}
