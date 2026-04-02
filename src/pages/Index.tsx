import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MenuSection from "@/components/MenuSection";
import ReservationSection from "@/components/ReservationSection";
import FAQSection from "@/components/FAQSection";
import ReviewSection from "@/components/ReviewSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background landscape-compact">
      <Navbar />
      <HeroSection />
      <MenuSection />
      <ReservationSection />
      <FAQSection />
      <ReviewSection />
      <Footer />
    </div>
  );
};

export default Index;
