import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Briefcase } from "lucide-react";
import type { JobPosting } from "@/components/admin/AdminJobForm";

const EmpleoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: job, isLoading } = useQuery({
    queryKey: ["job-posting", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("ref", Number(id))
        .maybeSingle();
      if (error) throw error;
      return data as JobPosting | null;
    },
    enabled: !!id,
  });

  const rows: { label: string; value?: string | null }[] = job
    ? [
        { label: t("jobs.fields.location"), value: job.location },
        { label: t("jobs.fields.category"), value: job.category },
        { label: t("jobs.fields.subcategory"), value: job.subcategory },
        { label: t("jobs.fields.sector"), value: job.sector },
        { label: t("jobs.fields.schedule"), value: job.work_schedule },
        { label: t("jobs.fields.mode"), value: job.work_mode },
        { label: t("jobs.fields.level"), value: job.professional_level },
        { label: t("jobs.fields.department"), value: job.department },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{job ? `${job.title} | Lo Zio` : t("jobs.seoTitle")}</title>
        <meta name="description" content={job?.description || t("jobs.seoDescription")} />
      </Helmet>
      <Navbar forceSolid />
      <div className="pt-24 pb-16 max-w-3xl mx-auto px-4">
        <Link to="/empleo">
          <Button variant="ghost" size="sm" className="font-body gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {t("jobs.back")}
          </Button>
        </Link>

        {isLoading ? (
          <div className="h-64 rounded-xl border border-border bg-muted/40 animate-pulse" />
        ) : !job ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Briefcase className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-body text-muted-foreground">{t("jobs.notFound")}</p>
          </div>
        ) : (
          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                {job.title}
              </h1>
              <Badge variant="secondary" className="font-body shrink-0">
                #{job.ref}
              </Badge>
            </div>
            {!job.is_active && (
              <p className="mt-3 font-body text-sm text-muted-foreground">{t("jobs.closed")}</p>
            )}

            <dl className="mt-7 grid gap-5 sm:grid-cols-2">
              {rows.map((row) => (
                <div key={row.label}>
                  <dt className="font-body text-xs uppercase tracking-widest text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="font-body text-foreground mt-1">{row.value || "—"}</dd>
                </div>
              ))}
            </dl>

            {job.description && (
              <div className="mt-8 border-t border-border pt-6">
                <h2 className="font-display text-xl font-bold text-foreground mb-3">
                  {t("jobs.fields.description")}
                </h2>
                <p className="font-body text-muted-foreground leading-relaxed whitespace-pre-line">
                  {job.description}
                </p>
              </div>
            )}

            {job.is_active && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="font-body text-sm text-muted-foreground mb-4">{t("jobs.applyText")}</p>
                <a href="mailto:info@pizzeriaslozio.com?subject=Vacante%20%23{job.ref}">
                  <Button className="font-body font-bold">{t("jobs.apply")}</Button>
                </a>
              </div>
            )}
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default EmpleoDetail;
