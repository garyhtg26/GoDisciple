/**
 * YouTube Data API v3 service
 *
 * Setup:
 * 1. Go to https://console.cloud.google.com
 * 2. Enable "YouTube Data API v3"
 * 3. Create an API key (restrict to your app's bundle ID for production)
 * 4. Add to .env: EXPO_PUBLIC_YOUTUBE_API_KEY=your_key_here
 */

const API_KEY = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_HANDLE = 'GKDIOfficial';

// Cache to avoid hitting quota repeatedly
let cachedChannelId = null;
let cachedVideos = null;
let cacheTimestamp = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function getChannelId() {
  if (cachedChannelId) return cachedChannelId;
  if (!API_KEY) return null;

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`,
  );
  const data = await res.json();
  if (data.items && data.items.length > 0) {
    cachedChannelId = data.items[0].id;
    return cachedChannelId;
  }
  return null;
}

export async function getLatestVideos(maxResults = 4) {
  if (!API_KEY) return [];

  // Return cached if fresh
  if (cachedVideos && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedVideos;
  }

  try {
    const channelId = await getChannelId();
    if (!channelId) return [];

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=${maxResults}&type=video`,
    );
    const data = await res.json();

    if (!data.items) return [];

    const videos = data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));

    cachedVideos = videos;
    cacheTimestamp = Date.now();
    return videos;
  } catch (e) {
    console.warn('YouTube API error:', e);
    return [];
  }
}
