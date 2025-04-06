import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "OnRoute - AI Road Trip Planner",
  description: "Plan your perfect road trip with AI-powered recommendations for restaurants and gas stations",
};

export default function RootLayout({ children }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  
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
        className={`${inter.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
