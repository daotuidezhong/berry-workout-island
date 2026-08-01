import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000").split(",")[0];
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og-v2.png`;

  return {
    title: "莓好运动岛｜像素运动打卡游戏",
    description: "在精美的 2D 小屋中和猫咪自由走动，用运动赚取草莓并布置家具。",
    openGraph: {
      title: "莓好运动岛",
      description: "运动打卡、猫咪陪伴、自由布置。",
      type: "website",
      images: [{ url: image, width: 1730, height: 909, alt: "莓好运动岛 2D 游戏封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "莓好运动岛",
      description: "运动打卡、猫咪陪伴、自由布置。",
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
