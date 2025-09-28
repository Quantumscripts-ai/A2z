"use client";

import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

const HeroSection = () => {
  const { isDark } = useTheme();
  return (
    <section
      className={`relative min-h-screen pt-32 pb-20 px-6 overflow-x-hidden transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-black to-purple-900"
          : "bg-gradient-to-br from-blue-50 via-white to-purple-50"
      }`}
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl ${
            isDark ? "bg-purple-600/20" : "bg-purple-400/30"
          }`}
        ></div>
        <div
          className={`absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl ${
            isDark ? "bg-blue-600/15" : "bg-blue-400/25"
          }`}
        ></div>
        <div
          className={`absolute bottom-1/4 left-1/3 w-64 h-64 rounded-full blur-3xl ${
            isDark ? "bg-purple-500/10" : "bg-purple-300/20"
          }`}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Content Container */}
        <div className="text-center mb-6">
          {/* NEW Badge */}
          <div
            className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 mb-2 ${
              isDark
                ? "bg-purple-600/20 border-purple-500/30"
                : "bg-purple-100/50 border-purple-300/40"
            }`}
          >
            <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full font-body">
              NEW
            </span>
            <span
              className={`text-sm font-medium font-body ${
                isDark ? "text-purple-300" : "text-purple-700"
              }`}
            >
              Latest AI model just released
            </span>
          </div>

          {/* Main Heading */}
          <h1
            className={`text-6xl md:text-8xl font-bold font-heading leading-tight transition-colors duration-500 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Generate
            <br />
            <span
              className={`bg-gradient-to-t bg-clip-text text-transparent ${
                isDark
                  ? "from-purple-500 to-white"
                  : "from-purple-600 to-gray-900"
              }`}
            >
              subtitles with AI.
            </span>
          </h1>

          {/* Description */}
          <p
            className={`text-xl md:text-2xl mb-4 max-w-3xl mx-auto font-body leading-relaxed transition-colors duration-500 ${
              isDark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Transform your videos into accessible content effortlessly with AI,
            where
            <br />
            smart technology meets user-friendly subtitle generation.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => {
              const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
              window.location.href = isLoggedIn ? "/workspace" : "/auth";
            }}
            className={`px-6 py-2 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg border font-body ${
              isDark
                ? "bg-white text-black shadow-black/20 hover:shadow-black/30 border-gray-200 hover:bg-transparent hover:text-white"
                : "bg-gray-900 text-white shadow-gray-900/20 hover:shadow-gray-900/30 border-gray-700 hover:bg-transparent hover:text-gray-900"
            }`}
          >
            Get Started
          </button>
        </div>

        {/* Dashboard Mockup */}
        <div className="relative">
          {/* Glow effect behind the dashboard */}
          <div
            className={`absolute inset-0 bg-gradient-to-t rounded-3xl blur-2xl scale-105 ${
              isDark
                ? "from-purple-600/30 via-purple-500/20 to-transparent"
                : "from-purple-400/40 via-purple-300/30 to-transparent"
            }`}
          ></div>

          {/* Dashboard Image Container */}
          <div className="relative bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-4 shadow-2xl shadow-purple-900/30">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/hero.png"
                alt="AI-powered SEO Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto object-cover"
                priority
              />

              {/* Overlay gradient for better integration */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Additional glow effects */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-purple-600/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl"></div>
        </div>
      </div>

      {/* Black gradient at bottom - covers 40% */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none z-20"></div>

      {/* Custom styles for enhanced glow */}
      <style jsx>{`
        .glow-border {
          box-shadow:
            0 0 20px rgba(147, 51, 234, 0.3),
            0 0 40px rgba(147, 51, 234, 0.2),
            0 0 80px rgba(147, 51, 234, 0.1),
            inset 0 0 20px rgba(147, 51, 234, 0.1);
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
