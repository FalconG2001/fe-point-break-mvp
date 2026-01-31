import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

export const metadata: Metadata = {
  title: "Point Break Booking",
  description: "Book consoles at Point Break game centre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
