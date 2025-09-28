"use client";

import FloatingNavbar from "@/app/components/FloatingNavbar";
import Footer from "@/app/components/Footer";
import ContactForm from "@/app/components/ContactForm";
import ContactInfoCard from "@/app/components/ContactInfoCard";
import { useTheme } from "@/contexts/ThemeContext";

export default function ContactPage() {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen relative">
      <FloatingNavbar />

      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-32 left-10 w-40 h-40 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-purple-600/10" : "bg-purple-600/5"
          }`}
        />
        <div
          className={`absolute top-64 right-16 w-24 h-24 rounded-full blur-2xl animate-pulse ${
            isDark ? "bg-blue-600/10" : "bg-blue-600/5"
          }`}
          style={{ animationDelay: "2s" }}
        />
        <div
          className={`absolute bottom-24 left-1/3 w-48 h-48 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-purple-500/10" : "bg-purple-500/5"
          }`}
          style={{ animationDelay: "4s" }}
        />
      </div>

      <main className="relative z-10 pt-28 md:pt-32 pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-14">
            <h1
              className={`text-4xl md:text-5xl font-bold mb-3 ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              Contact Us
            </h1>
            <p
              className={`${
                isDark ? "text-gray-400" : "text-gray-600"
              } text-base md:text-lg max-w-2xl mx-auto`}
            >
              We’re here to help. Send us a message and our team will get back
              to you shortly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2">
              <ContactForm
                onSubmit={async () => {
                  await new Promise((r) => setTimeout(r, 800));
                }}
              />
            </div>
            <div className="lg:col-span-1">
              <ContactInfoCard />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
