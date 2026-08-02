import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000").split(",")[0];
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og-v4.png`;

  return {
    title: "莓好运动岛｜像素运动打卡游戏",
    description: "在全屏 2D 小屋里自由记录运动、布置家具，用背包选择食物喂猫，并欣赏更自然的多帧猫咪动画。",
    openGraph: {
      title: "莓好运动岛",
      description: "全屏小屋、多帧猫咪、背包喂食、自由装扮。",
      type: "website",
      images: [{ url: image, width: 1730, height: 909, alt: "莓好运动岛 2D 游戏封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "莓好运动岛",
      description: "全屏小屋、多帧猫咪、背包喂食、自由装扮。",
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
