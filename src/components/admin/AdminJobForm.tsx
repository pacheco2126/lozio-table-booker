import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export type JobPosting = {
  id: string;
  ref: number;
  title: string;
  location: string;
  category: string;
  subcategory: string | null;
  sector: string | null;
  work_schedule: string | null;
  work_mode: string | null;
  professional_level: string | null;
  department: string | null;
  description: string | null;
  is_active: boolean;
};

type FormState = {
  title: string;
  location: string;
  category: string;
  subcategory: string;
  sector: string;
  work_schedule: string;
  work_mode: string;
  professional_level: string;
  department: string;
  description: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  title: "",
  location: "",
  category: "",
  subcategory: "",
  sector: "",
  work_schedule: "",
  work_mode: "",
  professional_level: "",
  department: "",
  description: "",
  is_active: true,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobPosting | null;
  onSaved: () => void;
}

const AdminJobForm = ({ open, onOpenChange, job, onSaved }: Props) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (job) {
      setForm({
        title: job.title,
        location: job.location,
        category: job.category,
        subcategory: job.subcategory ?? "",
        sector: job.sector ?? "",
        work_schedule: job.work_schedule ?? "",
        work_mode: job.work_mode ?? "",
        professional_level: job.professional_level ?? "",
        department: job.department ?? "",
        description: job.description ?? "",
        is_active: job.is_active,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, job]);

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.location.trim() || !form.category.trim()) {
      toast.error(t("jobs.form.requiredError"));
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      location: form.location.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim() || null,
      sector: form.sector.trim() || null,
      work_schedule: form.work_schedule.trim() || null,
      work_mode: form.work_mode.trim() || null,
      professional_level: form.professional_level.trim() || null,
      department: form.department.trim() || null,
      description: form.description.trim() || null,
      is_active: form.is_active,
    };

    const { error } = job
      ? await supabase.from("job_postings").update(payload).eq("id", job.id)
      : await supabase.from("job_postings").insert(payload);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(job ? t("jobs.form.updated") : t("jobs.form.created"));
    onOpenChange(false);
    onSaved();
  };

  const textFields: { key: keyof FormState; label: string; required?: boolean }[] = [
    { key: "title", label: t("jobs.fields.title"), required: true },
    { key: "location", label: t("jobs.fields.location"), required: true },
    { key: "category", label: t("jobs.fields.category"), required: true },
    { key: "subcategory", label: t("jobs.fields.subcategory") },
    { key: "sector", label: t("jobs.fields.sector") },
    { key: "work_schedule", label: t("jobs.fields.schedule") },
    { key: "work_mode", label: t("jobs.fields.mode") },
    { key: "professional_level", label: t("jobs.fields.level") },
    { key: "department", label: t("jobs.fields.department") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {job ? t("jobs.form.editTitle") : t("jobs.form.createTitle")}
          </DialogTitle>
          <DialogDescription className="font-body">{t("jobs.form.description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {textFields.map((field) => (
            <div key={field.key} className={field.key === "title" ? "sm:col-span-2" : ""}>
              <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                {field.label}
                {field.required && " *"}
              </Label>
              <Input
                value={form[field.key] as string}
                onChange={(e) => set(field.key, e.target.value)}
                maxLength={120}
                className="font-body mt-1"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
              {t("jobs.fields.description")}
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={2000}
              rows={4}
              className="font-body mt-1"
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
            <Label className="font-body text-sm">{t("jobs.fields.active")}</Label>
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">
            {t("jobs.form.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="font-body font-bold">
            {saving ? t("jobs.form.saving") : t("jobs.form.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminJobForm;
