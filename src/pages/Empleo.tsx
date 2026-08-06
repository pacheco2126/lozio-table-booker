import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, MapPin, Plus, Clock, Pencil } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import AdminJobForm, { type JobPosting } from "@/components/admin/AdminJobForm";

const JobCard = ({
  job,
  isAdmin,
  onEdit,
}: {
  job: JobPosting;
  isAdmin: boolean;
  onEdit: (job: JobPosting) => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
      <Link to={`/empleo/${job.ref}`} className="group block p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="font-display text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
            {job.title}
          </h2>
          <Badge variant="secondary" className="font-body shrink-0">
            #{job.ref}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground font-body">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0" />
            {job.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 shrink-0" />
            {job.category}
          </span>
          {job.work_schedule && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 shrink-0" />
              {job.work_schedule}
            </span>
          )}
        </div>
        <p className="mt-4 font-body text-sm font-bold text-primary uppercase tracking-widest">
          {t("jobs.viewDetail")} →
        </p>
      </Link>
      {isAdmin && (
        <div className="border-t border-border px-5 py-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onEdit(job)} className="font-body gap-2">
            <Pencil className="w-4 h-4" />
            {t("jobs.form.editTitle")}
          </Button>
        </div>
      )}
    </div>
  );
};

const Empleo = () => {
  const { t } = useTranslation();
  const { isAdmin } = useIsAdmin();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);

  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ["job-postings", isAdmin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as JobPosting[];
    },
  });

  const active = useMemo(() => jobs.filter((j) => j.is_active), [jobs]);
  const inactive = useMemo(() => jobs.filter((j) => !j.is_active), [jobs]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (job: JobPosting) => {
    setEditing(job);
    setFormOpen(true);
  };

  const renderList = (list: JobPosting[]) => {
    if (isLoading) {
      return (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-40 rounded-xl border border-border bg-muted/40 animate-pulse" />
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-border py-14 text-center">
          <Briefcase className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <p className="font-body text-muted-foreground">{t("jobs.empty")}</p>
        </div>
      );
    }
    return (
      <div className="grid gap-5 md:grid-cols-2">
        {list.map((job) => (
          <JobCard key={job.id} job={job} isAdmin={isAdmin} onEdit={openEdit} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t("jobs.seoTitle")}</title>
        <meta name="description" content={t("jobs.seoDescription")} />
        <link rel="canonical" href="https://www.pizzeriaslozio.com/empleo" />
      </Helmet>
      <Navbar forceSolid />
      <div className="pt-24 pb-16 max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary">
            {t("footer.corporate")}
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            {t("jobs.title")}
          </h1>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
            {t("jobs.subtitle")}
          </p>
        </div>

        {isAdmin ? (
          <>
            <div className="flex justify-end mb-5">
              <Button onClick={openCreate} className="font-body font-bold gap-2">
                <Plus className="w-4 h-4" />
                {t("jobs.addVacancy")}
              </Button>
            </div>
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList className="font-body">
                <TabsTrigger value="active" className="font-bold">
                  {t("jobs.activeTab")} ({active.length})
                </TabsTrigger>
                <TabsTrigger value="inactive" className="font-bold">
                  {t("jobs.inactiveTab")} ({inactive.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active">{renderList(active)}</TabsContent>
              <TabsContent value="inactive">{renderList(inactive)}</TabsContent>
            </Tabs>
            <AdminJobForm
              open={formOpen}
              onOpenChange={setFormOpen}
              job={editing}
              onSaved={refetch}
            />
          </>
        ) : (
          renderList(active)
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Empleo;
