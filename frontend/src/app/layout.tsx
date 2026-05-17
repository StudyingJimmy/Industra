import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Industra - AI基建产业地图",
  description: "中国AI基础设施产业地图与知识图谱",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
