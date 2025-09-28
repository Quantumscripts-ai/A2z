import HeroSection from "./components/HeroSection";
import HowItWorksSection from "./components/HowItWorksSection";
import BentoSection from "./components/BentoSection";
import TestimonialsSection from "./components/TestimonialsSection";
import PricingSection from "./components/PricingSection";
import Footer from "./components/Footer";
import FloatingNavbar from "./components/FloatingNavbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Floating Navbar - Only on Home Page */}
      <FloatingNavbar />

      {/* Hero Section */}
      <HeroSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Bento Section */}
      <BentoSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}
