import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000").split(",")[0];
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og-v4.png`;

  return {
    title: "OH｜像素生活日记小屋",
    description: "在温暖的像素小屋里记录每日生活、照顾猫咪、布置房间，在院子种植并为伙伴烹饪食物。",
    openGraph: {
      title: "OH 像素生活日记小屋",
      description: "每日生活日记、猫咪陪伴、院子种植、厨房烹饪与自由装扮。",
      type: "website",
      images: [{ url: image, width: 1730, height: 909, alt: "OH 像素生活日记小屋封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "OH 像素生活日记小屋",
      description: "每日生活日记、猫咪陪伴、院子种植、厨房烹饪与自由装扮。",
      images: [image],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
