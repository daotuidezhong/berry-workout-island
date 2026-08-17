export const PLAYLIST_ID = "17961012548";

export type PlaylistTrack = { id: number; name: string; artist: string; duration: number; cover: string; playbackUrl: string | null; playbackCode: number | null; playbackFee: number | null };
export type Playlist = { id: string; name: string; trackCount: number; tracks: PlaylistTrack[] };

export const LOCAL_PLAYBACK_PATHS: Record<number, string> = {
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

export function resolvePlaybackUrl(id: number, remoteUrl?: string | null) {
  return LOCAL_PLAYBACK_PATHS[id] ?? remoteUrl?.replace(/^http:/, "https:") ?? null;
}

export function isRemotePlaybackUrl(url: string | null) {
  return Boolean(url?.startsWith("https://"));
}

export async function fetchPlaylist(fetchImpl: typeof fetch = fetch) {
  const response = await fetchImpl(`/api/netease-playlist?refresh=${Date.now()}`, { cache: "no-store" });
  const data = await response.json() as Playlist & { error?: string };
  if (!response.ok) throw new Error(data.error || "歌单载入失败");
  return data;
}
