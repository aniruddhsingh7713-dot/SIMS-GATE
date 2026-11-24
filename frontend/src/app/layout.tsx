import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import "./faculty-batches.css";
import "./auth.css";
import { AdvisorProvider } from "@/context/AdvisorContext";
import { AuthProvider } from "@/context/AuthContext";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIMS GATE — Premier GATE Coaching | Raipur, Chhattisgarh",
  description:
    "Comprehensive and concept-driven GATE coaching platform by SIMS GATE, Raipur. Located at 3rd Floor, SBI Building, Choubey Colony. Explore courses, classroom batches, and direct faculty mentorship.",
  icons: {
    icon: "/sims-logo.png",
    shortcut: "/sims-logo.png",
    apple: "/sims-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  for (var i = 0; i < registrations.length; i++) {
                    registrations[i].unregister();
                  }
                });
                if ('caches' in window) {
                  caches.keys().then(function(names) {
                    for (var i = 0; i < names.length; i++) {
                      caches.delete(names[i]);
                    }
                  });
                }
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <AdvisorProvider>
            {children}
          </AdvisorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
