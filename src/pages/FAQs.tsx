import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";

const FAQs = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t("faq.seoTitle")}</title>
        <meta name="description" content={t("faq.seoDescription")} />
        <link rel="canonical" href="https://www.pizzeriaslozio.com/faqs" />
      </Helmet>
      <Navbar forceSolid />
      <div className="pt-24">
        <FAQSection />
      </div>
      <Footer />
    </div>
  );
};

export default FAQs;
