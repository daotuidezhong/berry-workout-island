import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = (incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "localhost:3000").split(",")[0];
  const protocol = incoming.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;

  return {
    title: "莓好运动岛｜像素运动打卡游戏",
    description: "每天运动收集草莓，和猫咪伙伴一起布置温暖小屋。",
    openGraph: {
      title: "莓好运动岛",
      description: "每天动一动，草莓带回家。",
      type: "website",
      images: [{ url: image, width: 1731, height: 909, alt: "莓好运动岛像素游戏封面" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "莓好运动岛",
      description: "每天动一动，草莓带回家。",
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
