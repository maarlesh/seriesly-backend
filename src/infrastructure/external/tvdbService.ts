import fetch from 'node-fetch';

const TVDB_API_URL = 'https://api4.thetvdb.com/v4/login';

interface LoginResponse {
    data: {
        token: string;
    }
}

export async function loginToTvdb(apiKey: string): Promise<string> {
    const response = await fetch(TVDB_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apikey: apiKey }),
    });

    if (!response.ok) {
        throw new Error(`TVDB login failed with status ${response.status}`);
    }

    const json = await response.json() as LoginResponse;
    return json.data.token;
}
