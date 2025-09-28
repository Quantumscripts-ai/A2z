"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const TestimonialsSection = () => {
  const { isDark } = useTheme();
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const testimonials = [
    // Left Column
    [
      {
        id: 1,
        name: "Sarah Chen",
        company: "YouTube Creator",
        avatar: "/api/placeholder/40/40",
        text: "TranslateA2Z completely transformed our video accessibility. The AI understands speech patterns and timing better than any tool we've used before.",
      },
      {
        id: 2,
        name: "Marcus Rodriguez",
        company: "Video Studio",
        avatar: "/api/placeholder/40/40",
        text: "Best subtitle generator I've ever used. The speed and accuracy are incredible - it's like having a team of professional transcribers at your fingertips.",
      },
      {
        id: 3,
        name: "Elena Popov",
        company: "Online Courses",
        avatar: "/api/placeholder/40/40",
        text: "Started using TranslateA2Z for our educational content and I'm blown away. It perfectly captures technical terminology while maintaining natural timing.",
      },
      {
        id: 4,
        name: "David Kim",
        company: "Media Agency",
        avatar: "/api/placeholder/40/40",
        text: "TranslateA2Z is the best subtitle platform I've used in years. It helped us make content accessible globally. Our engagement rates increased by 40%.",
      },
    ],
    // Center Column
    [
      {
        id: 5,
        name: "Lisa Thompson",
        company: "Video Producer",
        avatar: "/api/placeholder/40/40",
        text: "I tried TranslateA2Z and... wow! 🚀",
      },
      {
        id: 6,
        name: "Ahmed Hassan",
        company: "Film Studio",
        avatar: "/api/placeholder/40/40",
        text: "After trying dozens of subtitle tools, I finally found TranslateA2Z and it's absolutely incredible. The AI maintains speech timing perfectly. There's no going back to manual transcription. 🤯",
      },
      {
        id: 7,
        name: "Sophie Laurent",
        company: "Podcast Network",
        avatar: "/api/placeholder/40/40",
        text: "TranslateA2Z is 🔥 for video content",
      },
      {
        id: 8,
        name: "Ryan Mitchell",
        company: "Content Team",
        avatar: "/api/placeholder/40/40",
        text: "TranslateA2Z is hands down my biggest productivity improvement this year",
      },
    ],
    // Right Column
    [
      {
        id: 9,
        name: "Priya Sharma",
        company: "Video Platform",
        avatar: "/api/placeholder/40/40",
        text: "TranslateA2Z is at least 5x faster than our previous subtitle process. The AI accuracy is amazing and it's an incredible accelerator for our content team.",
      },
      {
        id: 10,
        name: "James Wilson",
        company: "Broadcasting",
        avatar: "/api/placeholder/40/40",
        text: "The TranslateA2Z AI is occasionally so accurate it defies reality - about 95% of the time it captures exactly what speakers say. It makes accessible content creation effortless.",
      },
      {
        id: 11,
        name: "Maria Garcia",
        company: "E-learning",
        avatar: "/api/placeholder/40/40",
        text: "TranslateA2Z revolutionized how we create accessible educational content",
      },
      {
        id: 12,
        name: "Alex Johnson",
        company: "Creative Agency",
        avatar: "/api/placeholder/40/40",
        text: "Best subtitle tool for video professionals",
      },
    ],
  ];

  // Get columns to display based on screen size
  const getColumnsToDisplay = () => {
    if (isMobile) {
      // Show only the center column on mobile (index 1) as it has good variety
      return [testimonials[1]];
    }
    return testimonials;
  };

  const columnsToDisplay = getColumnsToDisplay();

  return (
    <section
      className={`relative min-h-screen py-20 px-6 overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-black" : "bg-white"
      }`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div
          className={`absolute top-20 left-10 w-32 h-32 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-purple-600/5" : "bg-purple-400/10"
          }`}
        ></div>
        <div
          className={`absolute top-40 right-20 w-24 h-24 rounded-full blur-2xl animate-pulse ${
            isDark ? "bg-blue-600/5" : "bg-blue-400/10"
          }`}
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className={`absolute bottom-32 left-20 w-40 h-40 rounded-full blur-3xl animate-pulse ${
            isDark ? "bg-purple-500/5" : "bg-purple-300/10"
          }`}
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-heading">
            Loved by content creators
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto font-body">
            Creators worldwide trust TranslateA2Z for their video accessibility
            needs.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div
          className={`grid gap-6 max-w-6xl mx-auto ${
            isMobile
              ? "grid-cols-1 justify-center"
              : "grid-cols-1 md:grid-cols-3"
          }`}
        >
          {columnsToDisplay.map((column, columnIndex) => {
            // Adjust column index for animation when mobile
            const actualColumnIndex = isMobile ? 1 : columnIndex;

            return (
              <div
                key={isMobile ? "mobile-column" : columnIndex}
                className={`relative h-[600px] overflow-hidden ${
                  isMobile ? "max-w-md mx-auto" : ""
                }`}
                onMouseEnter={() => setHoveredColumn(actualColumnIndex)}
                onMouseLeave={() => setHoveredColumn(null)}
              >
                {/* Testimonials Column */}
                <div
                  className={`flex flex-col gap-6 ${
                    actualColumnIndex === 1
                      ? "animate-[scrollDown_30s_linear_infinite]"
                      : "animate-[scrollUp_30s_linear_infinite]"
                  }`}
                  style={{
                    transform:
                      actualColumnIndex === 1
                        ? "translateY(-50%)"
                        : "translateY(0%)",
                    animationPlayState:
                      hoveredColumn === actualColumnIndex
                        ? "paused"
                        : "running",
                  }}
                >
                  {/* Duplicate testimonials for seamless loop */}
                  {[...column, ...column, ...column].map(
                    (testimonial, index) => (
                      <div
                        key={`${testimonial.id}-${index}`}
                        className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 transition-all duration-300 hover:bg-gray-800/60 hover:border-gray-600/50 group"
                      >
                        {/* User Info */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                              {testimonial.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-white font-semibold text-sm font-heading">
                              {testimonial.name}
                            </h4>
                            <p className="text-gray-400 text-xs font-body">
                              {testimonial.company}
                            </p>
                          </div>
                        </div>

                        {/* Testimonial Text */}
                        <p className="text-gray-300 text-sm leading-relaxed font-body group-hover:text-gray-200 transition-colors">
                          &ldquo;{testimonial.text}&rdquo;
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* Gradient Overlays */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent pointer-events-none z-10"></div>
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none z-10"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
