import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ReservationSection from "@/components/ReservationSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ReservationSection />
      <Footer />
    </div>
  );
};

export default Index;
