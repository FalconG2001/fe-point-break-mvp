import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";
import Link from "next/link";

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
      <body className="min-h-screen flex flex-col">
        <Providers>
          <main className="grow">{children}</main>
          <footer className="py-6 px-4 border-t border-gray-200 dark:border-zinc-800">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
              <p>&copy; {new Date().getFullYear()} Point Break Game Centre</p>
              <div className="flex gap-6">
                <Link
                  href="/privacy-policy"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-and-conditions"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Terms and Conditions
                </Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
