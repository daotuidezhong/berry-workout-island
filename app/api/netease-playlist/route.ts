const PLAYLIST_ID = "17961012548";
const headers = { Referer: "https://music.163.com/", "User-Agent": "Mozilla/5.0" };

type Song = { id: number; name: string; duration?: number; artists?: Array<{ name: string }>; album?: { picUrl?: string } };
type Playback = { id: number; url?: string | null; code?: number; fee?: number };

export async function GET() {
  const playlistResponse = await fetch(`https://music.163.com/api/v6/playlist/detail?id=${PLAYLIST_ID}`, { headers, cache: "no-store" });
  if (!playlistResponse.ok) return Response.json({ error: "暂时无法读取歌单" }, { status: 502 });

  const data = await playlistResponse.json() as {
    code?: number;
    playlist?: { name?: string; trackCount?: number; trackIds?: Array<{ id: number }> };
  };
  if (data.code !== 200 || !data.playlist) return Response.json({ error: "没有找到指定歌单" }, { status: 404 });

  const trackIds = data.playlist.trackIds?.map((track) => track.id) ?? [];
  const songBatches = await Promise.all(Array.from({ length: Math.ceil(trackIds.length / 100) }, async (_, batch) => {
    const ids = trackIds.slice(batch * 100, batch * 100 + 100);
    const response = await fetch(`https://music.163.com/api/song/detail?ids=[${ids.join(",")}]`, { headers, cache: "no-store" });
    if (!response.ok) throw new Error("歌曲详情读取失败");
    return (await response.json() as { songs?: Song[] }).songs ?? [];
  }));
  const songs = new Map(songBatches.flat().map((song) => [song.id, song]));
  const playbackResponse = await fetch(`https://music.163.com/api/song/enhance/player/url?ids=${encodeURIComponent(JSON.stringify(trackIds))}&br=128000`, { headers, cache: "no-store" });
  const playbackData = playbackResponse.ok ? await playbackResponse.json() as { data?: Playback[] } : {};
  const playback = new Map((playbackData.data ?? []).map((item) => [item.id, item]));
  const tracks = trackIds.flatMap((id) => {
    const song = songs.get(id);
    const stream = playback.get(id);
    return song ? [{
      id: song.id,
      name: song.name,
      artist: song.artists?.map((artist) => artist.name).join(" / ") || "未知歌手",
      duration: song.duration ?? 0,
      cover: song.album?.picUrl ?? "",
      playbackUrl: stream?.url?.replace(/^http:/, "https:") ?? null,
      playbackCode: stream?.code ?? null,
      playbackFee: stream?.fee ?? null,
    }] : [];
  });

  return Response.json({
    id: PLAYLIST_ID,
    name: data.playlist.name ?? "网易云歌单",
    trackCount: tracks.length,
    tracks,
  });
}
