const { google } = require('googleapis');

const API_KEY = 'AIzaSyCUix7tjuXlHuFosBF9zGD4_WFhCF2N0z0';  // Your API key here
const CHANNEL_ID = 'UCAg6aehogJOmW6AORABxmKw';             // Your channel ID here

const youtube = google.youtube({
  version: 'v3',
  auth: API_KEY,
});

let nextPageToken = null;

// Step 1: Get the most recent liveChatId from your live stream
async function getLiveChatId() {
  try {
    const searchResponse = await youtube.search.list({
      part: 'id,snippet',
      channelId: CHANNEL_ID,
      eventType: 'live',
      type: 'video',
      maxResults: 5,
      order: 'date',
    });

    if (searchResponse.data.items.length === 0) {
      console.log("No active live streams found.");
      return null;
    }

    const mostRecentLiveVideo = searchResponse.data.items[0];
    const liveVideoId = mostRecentLiveVideo.id.videoId;

    const videoDetailsResponse = await youtube.videos.list({
      part: 'liveStreamingDetails',
      id: liveVideoId,
    });

    const liveChatId = videoDetailsResponse.data.items[0].liveStreamingDetails.activeLiveChatId;
    console.log(`Found liveChatId: ${liveChatId}`);
    return liveChatId;
  } catch (error) {
    console.error("Error fetching liveChatId:", error);
    return null;
  }
}

// Step 2: Start polling chat messages continuously
async function pollLiveChat(liveChatId) {
  try {
    const response = await youtube.liveChatMessages.list({
      liveChatId,
      part: 'snippet,authorDetails',
      pageToken: nextPageToken,
      maxResults: 200,
    });

    nextPageToken = response.data.nextPageToken;

    const messages = response.data.items;
    messages.forEach(msg => {
      const author = msg.authorDetails.displayName;
      const message = msg.snippet.displayMessage;
      console.log(`${author}: ${message}`);
    });

  } catch (error) {
    console.error('Error fetching live chat messages:', error);
  }
}

// Main function to run
async function main() {
  const liveChatId = await getLiveChatId();
  if (!liveChatId) return;

  setInterval(() => pollLiveChat(liveChatId), 500);
}

main();
