const fs = require("node:fs");
const path = require("node:path");

const PLAYLIST_ID = "17961012548";
const LOCAL_PLAYBACK_PATHS = {
  1352585027: "/music/tracks/1352585027.mp3",
  1457681678: "/music/tracks/1457681678.mp3",
  492390949: "/music/tracks/492390949.mp3",
  3370310523: "/music/tracks/3370310523.mp3",
  507585639: "/music/tracks/507585639.mp3",
  536243681: "/music/tracks/536243681.mp3",
  1399531193: "/music/tracks/1399531193.mp3",
  461864023: "/music/tracks/461864023.mp3",
  19579127: "/music/tracks/19579127.mp3",
  1811909303: "/music/tracks/1811909303.mp3",
  3357805007: "/music/tracks/3357805007.mp3",
  28191836: "/music/tracks/28191836.mp3",
  528284: "/music/tracks/528284.mp3",
  20744076: "/music/tracks/20744076.mp3",
  19934757: "/music/tracks/19934757.mp3",
  28445796: "/music/tracks/28445796.mp3",
  32211882: "/music/tracks/32211882.mp3",
  419681630: "/music/tracks/419681630.mp3",
  528864987: "/music/tracks/528864987.mp3",
  514416800: "/music/tracks/514416800.mp3",
  559676730: "/music/tracks/559676730.mp3",
  578090: "/music/tracks/578090.mp3",
};
const headers = { Referer: "https://music.163.com/", "User-Agent": "Mozilla/5.0" };

function readBundledPlaylist(root) {
  return JSON.parse(fs.readFileSync(path.join(root, "music", `playlist-${PLAYLIST_ID}.json`), "utf8"));
}

function withPlayback(track, playback) {
  return {
    ...track,
    playbackUrl: LOCAL_PLAYBACK_PATHS[track.id] ?? playback?.url?.replace(/^http:/, "https:") ?? null,
    playbackCode: playback?.code ?? null,
    playbackFee: playback?.fee ?? null,
  };
}

async function loadDesktopPlaylist(root, fetchImpl) {
  const bundled = readBundledPlaylist(root);
  try {
    const playlistResponse = await fetchImpl(`https://music.163.com/api/v6/playlist/detail?id=${PLAYLIST_ID}`, { headers });
    if (!playlistResponse.ok) throw new Error("playlist request failed");
    const playlistData = await playlistResponse.json();
    const trackIds = playlistData.playlist?.trackIds?.map((track) => track.id) ?? [];
    if (!trackIds.length) throw new Error("playlist is empty");

    const songBatches = await Promise.all(Array.from({ length: Math.ceil(trackIds.length / 100) }, async (_, batch) => {
      const ids = trackIds.slice(batch * 100, batch * 100 + 100);
      const response = await fetchImpl(`https://music.163.com/api/song/detail?ids=[${ids.join(",")}]`, { headers });
      if (!response.ok) throw new Error("song request failed");
      return (await response.json()).songs ?? [];
    }));
    const songs = new Map(songBatches.flat().map((song) => [song.id, song]));
    const playbackResponse = await fetchImpl(`https://music.163.com/api/song/enhance/player/url?ids=${encodeURIComponent(JSON.stringify(trackIds))}&br=128000`, { headers });
    const playbackData = playbackResponse.ok ? await playbackResponse.json() : {};
    const playback = new Map((playbackData.data ?? []).map((item) => [item.id, item]));
    const tracks = trackIds.flatMap((id) => {
      const song = songs.get(id);
      return song ? [withPlayback({
        id: song.id,
        name: song.name,
        artist: song.artists?.map((artist) => artist.name).join(" / ") || "未知歌手",
        duration: song.duration ?? 0,
        cover: song.album?.picUrl ?? "",
      }, playback.get(id))] : [];
    });
    if (!tracks.length) throw new Error("song details are empty");
    return { id: PLAYLIST_ID, name: playlistData.playlist.name ?? bundled.name, trackCount: tracks.length, tracks };
  } catch {
    return { ...bundled, tracks: bundled.tracks.map((track) => withPlayback(track)) };
  }
}

module.exports = { LOCAL_PLAYBACK_PATHS, PLAYLIST_ID, loadDesktopPlaylist };
