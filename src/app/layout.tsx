import type { Metadata } from "next";
import { Fraunces, Inter, Noto_Sans_Arabic } from "next/font/google";
import { ToastContainer } from "react-toastify";
import { ProfileButton } from "@/components/ProfileButton";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Khedma.ai",
  description:
    "A multilingual AI job-search agent — chat in Darija, French, Arabic, or English to find and apply to jobs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${notoSansArabic.variable} h-full antialiased`}
      style={{ backgroundColor: "#0f0f0f" }}
    >
      <body className="min-h-full flex flex-col bg-background">
        {children}
        <ProfileButton />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
          theme="dark"
          toastClassName="khedma-toast"
        />
      </body>
    </html>
  );
}
