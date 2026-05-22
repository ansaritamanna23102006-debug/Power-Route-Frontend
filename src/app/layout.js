import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { VoltDataProvider } from "../context/VoltDataContext";
import Navbar from "../components/Navbar";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "PowerRoute | AI EV Charging Assistant & Smart Planner",
  description: "Experience premium EV routing, real-time station bookings, safety-first location tracking, and intelligent conversational recommendations.",
  keywords: ["EV Charging", "Route Planning", "Electric Vehicle", "Range Predictor", "Women Safety Charging", "Smart Navigation"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-[#0f0720] text-[#f8f8ff]">
        <AuthProvider>
          <VoltDataProvider>
            <Navbar />
            {children}
          </VoltDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
