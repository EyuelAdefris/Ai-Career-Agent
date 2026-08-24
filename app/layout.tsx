import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SessionProvider } from "./context/SessionContext";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Career Coach",
  description: "Your AI-powered career guidance platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        elements: {

          // Card/Container
          card: "shadow-2xl rounded-2xl border border-gray-200",
          cardBox: "space-y-6",

          // Form Elements
          formFieldInput:
            "rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-white text-gray-900 placeholder:text-gray-400",
          formFieldLabel: "text-gray-700 font-semibold text-sm",
          formResendCodeLink: "text-blue-600 hover:text-blue-700 font-medium",

          // Buttons
          button:
            "rounded-lg font-semibold transition-all duration-200 active:scale-95",
          buttonPrimary:
            "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl",
          buttonSecondary:
            "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl",

          // Dividers & Text
          dividerLine: "bg-gray-200",
          dividerText: "text-gray-600 font-medium",

          // Social Buttons
          socialButtonsBlockButton:
            "border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all",
          socialButtonsBlockButtonText: "font-semibold text-gray-700",

          // Links
          linkButton:
            "text-blue-600 hover:text-blue-700 underline font-medium",

          // Headings
          heading: "text-3xl font-bold text-gray-900",
          subtitle: "text-gray-600",

          // Footer
          footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",

          // Error states
          alertText: "text-red-600",
          formFieldErrorText: "text-red-600 text-sm font-medium",

          // Success states
          successIcon: "text-teal-500",
        },
        variables: {
          colorPrimary: "#007bff", // Blue
          colorSuccess: "#14b8a6", // Teal
          colorWarning: "#f59e0b", // Orange
          colorDanger: "#ef4444", // Red
          colorNeutral: "#6b7280", // Gray

          // Sizing
          borderRadius: "0.5rem", // 8px

          // Fonts
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "1rem",
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
        },
      }}
    >
      <html lang="en">
        <body
          className={`${geist.variable} ${geistMono.variable} antialiased`}
        >
          <SessionProvider>
            {children}
          </SessionProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}