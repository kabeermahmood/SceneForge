import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SceneForge",
  description: "AI-Powered Script to Scene Generator",
  openGraph: {
    title: "SceneForge — AI Script to Scene Generator",
    description:
      "Turn your video script into consistent 2D illustrated scenes using AI",
  },
  other: {
    "theme-color": "#E8A838",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
