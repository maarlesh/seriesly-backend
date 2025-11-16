import fetch from 'node-fetch';

const TVDB_LOGIN_URL = 'https://api4.thetvdb.com/v4/login';
const TVDB_SEARCH_MOVIE_URL = 'https://api4.thetvdb.com/v4/search';

interface LoginResponse {
    data: {
        token: string;
    };
}

interface MovieSearchResponse {
    data: any[];
}

let cachedToken = '';
let tokenExpiry = 0;

/**
 * Logs in to TVDB and returns a bearer token.
 * Caches token for 29 minutes to reduce login calls.
 */
export async function loginToTvdb(apiKey: string): Promise<string> {
    const now = Date.now();
    if (cachedToken && now < tokenExpiry) {
        return cachedToken;
    }

    const response = await fetch(TVDB_LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey: apiKey }),
    });

    if (!response.ok) {
        throw new Error(`TVDB login failed with status ${response.status}`);
    }

    const json = (await response.json()) as LoginResponse;

    if (!json?.data?.token) {
        throw new Error('TVDB authentication failed: no token in response');
    }

    cachedToken = json.data.token;
    // Token valid for 30 days, refresh a bit earlier (29 days)
    tokenExpiry = now + 29 * 24 * 60 * 60 * 1000;

    return cachedToken;
}

/**
 * Search for a movie by title in TVDB.
 * Uses cached token for authorization.
 * Returns the first matching movie or null.
 */
export async function fetchMovieFromTvdb(title: string, tvdbApiKey: string) {
    const token = await loginToTvdb(tvdbApiKey);

    const searchRes = await fetch(`${TVDB_SEARCH_MOVIE_URL}?query=${encodeURIComponent(title)}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    console.log('TVDB search response status:', searchRes.status);

    if (!searchRes.ok) {
        throw new Error(`TVDB movie search failed with status ${searchRes.status}`);
    }

    const searchData = (await searchRes.json()) as MovieSearchResponse;

    if (!searchData?.data || searchData.data.length === 0) {
        return null;
    }

    // Filter results to only movies (exclude series etc.)
    const onlyMovies = searchData.data.filter(item => item.primary_type === 'movie');

    // Return up to 10 movies
    return onlyMovies;
}


interface SeriesSearchResponse {
  data: any[];
}


export async function fetchSeriesFromTvdb(title: string, tvdbApiKey: string) {
  const token = await loginToTvdb(tvdbApiKey);

  const searchRes = await fetch(`${TVDB_SEARCH_MOVIE_URL}?query=${encodeURIComponent(title)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('TVDB series search response status:', searchRes.status);

  if (!searchRes.ok) {
    throw new Error(`TVDB series search failed with status ${searchRes.status}`);
  }

  const searchData = (await searchRes.json()) as SeriesSearchResponse;

  if (!searchData?.data || searchData.data.length === 0) {
    return [];
  }

  // Filter to ensure these are series (not movies etc.) if any unwanted result present
  const onlySeries = searchData.data.filter(item => item.primary_type === 'series');

  // Return up to 10 series
  return onlySeries;
}