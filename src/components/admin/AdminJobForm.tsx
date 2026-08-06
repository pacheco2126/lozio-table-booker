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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";


const OPTIONS: Record<string, string[]> = {
  location: ["Tarragona", "Arrabassada", "El Rincón"],
  category: [
    "Turismo y restauración",
    "Atención al cliente",
    "Comercial y ventas",
    "Administración y oficina",
    "Logística y almacén",
    "Limpieza y mantenimiento",
  ],
  subcategory: [
    "Restauración",
    "Cocina",
    "Sala y barra",
    "Reparto a domicilio",
    "Hoteles y alojamiento",
    "Atención telefónica",
  ],
  sector: [
    "Hostelería y restaurantes",
    "Alimentación y bebidas",
    "Comercio y retail",
    "Transporte y reparto",
    "Servicios a empresas",
  ],
  work_schedule: [
    "Completa",
    "Parcial (Mañana)",
    "Parcial (Tarde)",
    "Parcial (Noche)",
    "Fines de semana",
    "Por horas",
    "Turnos rotativos",
  ],
  work_mode: ["Presencial", "Teletrabajo", "Híbrido"],
  professional_level: [
    "Empleado",
    "Especialista",
    "Mando intermedio",
    "Responsable de equipo",
    "Dirección",
    "Prácticas / Becario",
  ],
  department: [
    "Cocina",
    "Sala",
    "Reparto",
    "Administración",
    "Marketing",
    "Recursos Humanos",
    "Dirección",
  ],
};

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
  const { isAdmin } = useIsAdmin();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!job) return;
    setDeleting(true);
    const { error } = await supabase.from("job_postings").delete().eq("id", job.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("jobs.form.deleted"));
    onOpenChange(false);
    onSaved();
  };


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

  const fields: { key: keyof FormState; label: string; required?: boolean }[] = [
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
          <div className="sm:col-span-2">
            <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
              {t("jobs.fields.title")} *
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={120}
              className="font-body mt-1"
            />
          </div>
          {fields.map((field) => (
            <div key={field.key}>
              <Label className="font-body text-xs uppercase tracking-wider text-muted-foreground">
                {field.label}
                {field.required && " *"}
              </Label>
              <Select
                value={(form[field.key] as string) || undefined}
                onValueChange={(v) => set(field.key, v)}
              >
                <SelectTrigger className="font-body mt-1">
                  <SelectValue placeholder={t("jobs.form.selectPlaceholder")} />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {OPTIONS[field.key as string].map((opt) => (
                    <SelectItem key={opt} value={opt} className="font-body">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        <DialogFooter className="gap-2 sm:justify-between">
          {job && isAdmin ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting} className="font-body gap-2">
                  <Trash2 className="w-4 h-4" />
                  {deleting ? t("jobs.form.deleting") : t("jobs.form.delete")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">
                    {t("jobs.form.deleteConfirmTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="font-body">
                    {t("jobs.form.deleteConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-body">
                    {t("jobs.form.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="font-body font-bold">
                    {t("jobs.form.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <span />
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">
              {t("jobs.form.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="font-body font-bold">
              {saving ? t("jobs.form.saving") : t("jobs.form.save")}
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};

export default AdminJobForm;
