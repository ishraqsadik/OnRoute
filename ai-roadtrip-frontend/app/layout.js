import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "OnRoute - AI Road Trip Planner",
  description: "Plan your perfect road trip with AI-powered recommendations for restaurants and gas stations",
};

export default function RootLayout({ children }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  return (
    <html lang="en">
      <head>
        {/* Load Google Maps API with Callback */}
        <Script
          id="google-maps-script"
          strategy="beforeInteractive"
          src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
