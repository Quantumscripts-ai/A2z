"use client";

import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

const BentoSection = () => {
  const { isDark } = useTheme();
  return (
    <section
      className={`relative min-h-screen flex items-center py-20 px-6 overflow-hidden transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-b from-purple-900/20 via-black to-black"
          : "bg-gradient-to-b from-purple-50/50 via-white to-gray-50"
      }`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div
          className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-purple-600/10" : "bg-purple-400/20"
          }`}
        ></div>
        <div
          className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-2xl animate-pulse ${
            isDark ? "bg-blue-600/10" : "bg-blue-400/20"
          }`}
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className={`absolute bottom-32 left-20 w-40 h-40 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-purple-500/8" : "bg-purple-300/15"
          }`}
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2
            className={`text-4xl md:text-5xl font-bold mb-6 font-heading leading-tight max-w-4xl mx-auto transition-colors duration-500 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Harness the power of AI, making
            <br />
            video subtitle generation intuitive
            <br />
            and effective for all skill levels.
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Bento 1 - SEO Goal Setting (Top Left) */}
          <div className="lg:col-span-1 lg:row-span-1 group">
            <div className="relative bg-black border border-gray-400/30 rounded-3xl p-8 h-[380px] transition-all duration-500 hover:border-gray-300/50 overflow-hidden">
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

              <div className="relative z-10 h-full flex flex-col">
                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    <Image
                      src="/bento1.png"
                      alt="Video Upload Interface"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white font-heading group-hover:text-purple-300 transition-colors">
                    Easy video upload
                  </h3>
                  <p className="text-gray-300 text-sm font-body leading-relaxed">
                    Drag and drop any video format with guided upload
                    assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bento 2 - User-friendly Dashboard (Top Right) */}
          <div className="lg:col-span-3 lg:row-span-1 group">
            <div className="relative bg-gradient-to-b from-transparent to-purple-900/80 backdrop-blur-md border border-purple-500/20 rounded-3xl p-8 h-[380px] transition-all duration-500 hover:border-purple-400/40 overflow-hidden">
              {/* Background Image */}
              <div className="absolute right-4 top-4 bottom-4 w-3/5 opacity-80">
                <Image
                  src="/bento2.png"
                  alt="Subtitle Editor Dashboard"
                  fill
                  className="object-contain object-right"
                />
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

              <div className="relative z-10 h-full flex flex-col justify-end pb-4">
                {/* Content */}
                <div className="max-w-md space-y-4">
                  <h3 className="text-2xl font-bold text-white font-heading group-hover:text-purple-300 transition-colors">
                    Subtitle editor dashboard
                  </h3>
                  <p className="text-gray-300 text-base font-body leading-relaxed">
                    Edit timestamps and text with precision using a single
                    interface.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bento 3 - Visual Reports (Bottom Left) */}
          <div className="lg:col-span-3 lg:row-span-1 group">
            <div className="relative bg-gradient-to-b from-transparent to-purple-900/80 backdrop-blur-md border border-purple-500/20 rounded-3xl p-8 h-[380px] transition-all duration-500 hover:border-purple-400/40 overflow-hidden">
              {/* Background Image */}
              <div className="absolute left-4 top-4 bottom-4 w-3/5 opacity-80">
                <Image
                  src="/bento3.png"
                  alt="Export Options"
                  fill
                  className="object-contain object-left"
                />
              </div>

              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

              <div className="relative z-10 h-full flex flex-col justify-end items-end pb-4">
                {/* Content */}
                <div className="max-w-md space-y-4 text-right">
                  <h3 className="text-2xl font-bold text-white font-heading group-hover:text-purple-300 transition-colors">
                    Multiple formats
                  </h3>
                  <p className="text-gray-300 text-base font-body leading-relaxed">
                    Export in SRT, VTT, and other popular subtitle formats.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bento 4 - Smart Keyword Generator (Bottom Right) */}
          <div className="lg:col-span-1 lg:row-span-1 group">
            <div className="relative bg-black border border-gray-400/30 rounded-3xl p-8 h-[380px] transition-all duration-500 hover:border-gray-300/50 overflow-hidden">
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

              <div className="relative z-10 h-full flex flex-col">
                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center mb-4">
                  <div className="relative w-40 h-40">
                    <Image
                      src="/bento4.png"
                      alt="AI Accuracy Features"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-white font-heading group-hover:text-purple-300 transition-colors">
                    AI accuracy detection
                  </h3>
                  <p className="text-gray-300 text-sm font-body leading-relaxed">
                    Advanced algorithms ensure the highest transcription
                    quality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoSection;
