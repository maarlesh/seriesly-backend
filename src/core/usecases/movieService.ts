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
  // Step 1: Search locally using fuzzy RPC
  const { data: localMovies, error: localError } = await supabase
    .rpc('search_movies_fuzzy', { search_term: title.trim() });

  if (localError) throw localError;

  // Step 2: Always fetch from TVDB for comprehensive results
  const tvdbMovies = await fetchMovieFromTvdb(title, tvdbApiKey);
  
  if (!tvdbMovies || tvdbMovies.length === 0) {
    // No TVDB results, return local only
    return localMovies && localMovies.length > 0 ? localMovies : null;
  }

  // Step 3: Check which TVDB movies already exist in our DB
  const tvdbIdsToCheck = tvdbMovies.map(m => m.id);
  const { data: existingMoviesByTvdbId, error: existingError } = await supabase
    .from('movies')
    .select('tvdb_id')
    .in('tvdb_id', tvdbIdsToCheck);

  if (existingError) throw existingError;

  const existingTvdbIds = new Set(existingMoviesByTvdbId?.map(m => m.tvdb_id) ?? []);

  // Step 4: Insert only new movies from TVDB
  const moviesToInsert = tvdbMovies
    .filter(m => !existingTvdbIds.has(m.id))
    .map(m => ({
      tvdb_id: m.id,
      imdb_id: m.remote_ids?.find((id: any) => id.sourceName === 'IMDB')?.id ?? null,
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

  // Step 5: Merge and deduplicate results
  const allMovies = [...(localMovies ?? []), ...insertedMovies];
  
  // Deduplicate by tvdb_id (keep first occurrence)
  const uniqueMovies = Array.from(
    new Map(allMovies.map(m => [m.tvdb_id, m])).values()
  );

  // Return ALL results (removed slice limit)
  return uniqueMovies.length > 0 ? uniqueMovies : null;
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
  aliases: string[] | null;
  fetched_at: string;
}

export async function getOrCreateSeries(
  title: string,
  tvdbApiKey: string
): Promise<SeriesRecord[] | null> {
  // Step 1: Search locally using fuzzy RPC
  const { data: localSeries, error: localError } = await supabase
    .rpc('search_series_fuzzy', { search_term: title.trim() });

  if (localError) throw localError;

  // Step 2: Always fetch from TVDB
  const tvdbSeries = await fetchSeriesFromTvdb(title, tvdbApiKey);
  
  if (!tvdbSeries || tvdbSeries.length === 0) {
    return localSeries && localSeries.length > 0 ? localSeries : null;
  }

  // Step 3: Check existing tvdb_ids
  const tvdbIdsToCheck = tvdbSeries.map(s => s.id);
  const { data: existing, error: errExisting } = await supabase
    .from('series')
    .select('tvdb_id')
    .in('tvdb_id', tvdbIdsToCheck);

  if (errExisting) throw errExisting;

  const existingIds = new Set(existing?.map(s => s.tvdb_id) ?? []);

  // Step 4: Insert new series
  const newSeriesToInsert = tvdbSeries
    .filter(s => !existingIds.has(s.id))
    .map(s => ({
      tvdb_id: s.id,
      imdb_id: s.remote_ids?.find((id: any) => id.sourceName === 'IMDB')?.id ?? null,
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
      aliases: s.aliases ?? [],
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

  // Step 5: Merge and deduplicate
  const allSeries = [...(localSeries ?? []), ...inserted];
  
  const uniqueSeries = Array.from(
    new Map(allSeries.map(s => [s.tvdb_id, s])).values()
  );

  // Return ALL results (removed slice limit)
  return uniqueSeries.length > 0 ? uniqueSeries : null;
}
