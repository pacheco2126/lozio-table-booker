import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-foreground py-12 md:py-16 px-4 pb-24 md:pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="font-display text-3xl font-bold text-background mb-4">Lo Zio</h3>
            <p className="text-background/60 font-body leading-relaxed">
              {t("footer.description")}
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-background mb-4">Lo Zio Tarragona</h4>
            <p className="text-background/60 font-body text-sm leading-relaxed">
              Carrer Reding 32, Tarragona<br />
              +34 912 345 678<br />
              {t("reservation.locationTarragona.hours")}
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold text-background mb-4">Lo Zio Arrabassada</h4>
            <p className="text-background/60 font-body text-sm leading-relaxed">
              Carrer Joan Fuster 28, Tarragona<br />
              +34 912 876 543<br />
              {t("reservation.locationArrabassada.hours")}
            </p>
          </div>
        </div>
        <div className="border-t border-background/20 pt-8 text-center">
          <p className="text-background/40 font-body text-sm">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
