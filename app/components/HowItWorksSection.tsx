"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

const HowItWorksSection = () => {
  const { isDark } = useTheme();
  const steps = [
    {
      number: "01",
      title: "Upload Video",
      description:
        "Simply drag and drop your video file. Our AI instantly begins analyzing your audio content.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      ),
    },
    {
      number: "02",
      title: "AI Processing",
      description:
        "Advanced neural networks transcribe speech, understand context, and generate accurate subtitle timing.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Quality Check",
      description:
        "Real-time validation ensures accuracy, proper timing, and maintains your original speech patterns.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      number: "04",
      title: "Download SRT",
      description:
        "Get your subtitle file immediately. Download SRT format or integrate directly into your workflow.",
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
  ];

  return (
    <section
      className={`relative min-h-screen flex items-center py-20 px-6 overflow-hidden transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-b from-black via-gray-900 to-purple-900/20"
          : "bg-gradient-to-b from-gray-50 via-white to-purple-50/50"
      }`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
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
        <div
          className={`absolute bottom-20 right-10 w-28 h-28 rounded-full blur-2xl animate-pulse ${
            isDark ? "bg-blue-500/10" : "bg-blue-300/20"
          }`}
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-5xl md:text-6xl font-bold mb-6 font-heading transition-colors duration-500 ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            How It
            <span
              className={`bg-gradient-to-t bg-clip-text text-transparent ${
                isDark
                  ? "from-purple-500 to-white"
                  : "from-purple-600 to-gray-900"
              }`}
            >
              {" "}
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto font-body">
            Experience the magic of AI-powered subtitle generation in four
            simple steps
          </p>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Curved Timeline Path */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1">
            <svg
              className="w-full h-24"
              viewBox="0 0 1200 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient
                  id="timelineGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="33%" stopColor="#3B82F6" />
                  <stop offset="66%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <path
                d="M0,50 Q300,20 600,50 T1200,50"
                stroke="url(#timelineGradient)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="10,5"
                className="animate-pulse"
              />
            </svg>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 items-stretch">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Timeline Dot */}
                {/* <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full shadow-lg shadow-purple-500/50 z-10"></div> */}

                {/* Step Card */}
                <div className="group relative mt-16 md:mt-20">
                  {/* Hover Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>

                  {/* Main Card */}
                  <div className="relative bg-transparent backdrop-blur-sm border border-purple-500/50 rounded-3xl h-[400px] w-full transition-all duration-500 group-hover:border-transparent overflow-hidden shadow-lg shadow-purple-500/20">
                    {/* Animated Outline on Hover */}
                    <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out p-[2px] bg-gradient-to-r from-purple-500 via-blue-500 via-purple-400 to-purple-500 bg-[length:300%_100%] animate-[borderSlide_3s_ease-in-out_infinite]">
                      <div className="bg-transparent backdrop-blur-sm rounded-3xl w-full h-full"></div>
                    </div>

                    {/* Content Container */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-6">
                      {/* Header Section - Fixed Height */}
                      <div className="text-center h-[100px] flex flex-col items-center justify-start">
                        {/* Step Number Badge */}
                        <div className="inline-flex w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full items-center justify-center text-white font-bold text-xl font-heading shadow-lg shadow-purple-500/30 mb-3">
                          {step.number}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-white font-heading group-hover:text-purple-300 transition-colors leading-tight">
                          {step.title}
                        </h3>
                      </div>

                      {/* Icon Section - Fixed Height */}
                      <div className="h-[80px] flex justify-center items-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:text-purple-300 transition-all duration-300 border border-purple-500/10">
                          <div className="text-2xl">{step.icon}</div>
                        </div>
                      </div>

                      {/* Description Section - Flexible Height */}
                      <div className="flex-1 flex items-center justify-center py-4">
                        <p className="text-gray-300 text-sm leading-relaxed font-body text-justify hyphens-auto">
                          {step.description}
                        </p>
                      </div>

                      {/* Footer Section - Fixed Height */}
                      <div className="h-[40px] flex items-center justify-center">
                        {/* Progress Indicator */}
                        <div className="flex space-x-2">
                          {steps.map((_, i) => (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                i <= index
                                  ? "bg-gradient-to-r from-purple-500 to-blue-500 shadow-sm shadow-purple-500/50"
                                  : "bg-gray-600/50"
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Connection Line */}
                {index < steps.length - 1 && (
                  <div className="md:hidden flex justify-center mt-8">
                    <div className="w-1 h-12 bg-gradient-to-b from-purple-500/50 to-blue-500/50"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="text-center mt-16">
          <div className="mb-8">
            <p className="text-gray-400 text-lg font-body mb-4">
              Ready to experience the future of subtitle generation?
            </p>
          </div>

          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-10 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg shadow-purple-600/30 hover:shadow-purple-500/50 hover:scale-105 font-body">
            Generate Subtitles Now - Free!
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
