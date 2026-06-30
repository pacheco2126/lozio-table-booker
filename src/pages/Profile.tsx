import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { EU_ALLERGENS } from "@/lib/allergens";
import { MyDiscountsSection } from "@/components/MyDiscountsSection";
import UserPushNotificationToggle from "@/components/UserPushNotificationToggle";
import { Settings, Lock, Bell, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";


const Profile = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [settingsPanel, setSettingsPanel] = useState<null | "password" | "notifications">(null);
  const [profile, setProfile] = useState({
    full_name: "",

    phone: "",
    address: "",
    city: "",
    postal_code: "",
    allergies: [] as string[],
    food_preferences: "",
    favorite_table_area: "",
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone, address, city, postal_code, allergies, food_preferences, favorite_table_area")
      .eq("user_id", user!.id)
      .single();
    if (data && !error) {
      setProfile({
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        city: data.city || "",
        postal_code: data.postal_code || "",
        allergies: (data.allergies as string[]) || [],
        food_preferences: data.food_preferences || "",
        favorite_table_area: data.favorite_table_area || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postal_code,
        allergies: profile.allergies,
        food_preferences: profile.food_preferences,
        favorite_table_area: profile.favorite_table_area,
      })
      .eq("user_id", user!.id);
    if (error) {
      toast.error(t("profile.saveError"));
    } else {
      toast.success(t("profile.saveSuccess"));
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("profile.passwordTooShort"));
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(t("profile.passwordChangeError"));
    } else {
      toast.success(t("profile.passwordChanged"));
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="font-body text-muted-foreground">{t("profile.loadingText")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar forceSolid />
      <div className="pt-24 md:pt-32 pb-16 px-3 md:px-4">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            {/* Mobile: stacked card */}
            <div className="md:hidden bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="font-display text-xl font-bold text-primary">
                    {(profile.full_name || user?.email || "?").trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-xl font-bold text-foreground truncate">
                    {profile.full_name || t("profile.title")}
                  </h1>
                  <p className="text-muted-foreground font-body text-xs mt-0.5 truncate">{user?.email}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={t("profile.title")}
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-popover">
                      <DropdownMenuLabel>{t("profile.title")}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setSettingsPanel("notifications")}>
                        <Bell className="w-4 h-4 mr-2" />
                        {t("profile.notificationsLabel", "Notificaciones")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSettingsPanel("password")}>
                        <Lock className="w-4 h-4 mr-2" />
                        {t("profile.changePassword")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <button
                    onClick={handleSignOut}
                    aria-label={t("profile.signOut")}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop: original row */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">{t("profile.title")}</h1>
                <p className="text-muted-foreground font-body text-sm mt-1">{user?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={t("profile.title")}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-border bg-card text-foreground text-sm font-body font-medium hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      {t("profile.notificationsLabel", "Ajustes")}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover">
                    <DropdownMenuLabel>{t("profile.title")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSettingsPanel("notifications")}>
                      <Bell className="w-4 h-4 mr-2" />
                      {t("profile.notificationsLabel", "Notificaciones")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSettingsPanel("password")}>
                      <Lock className="w-4 h-4 mr-2" />
                      {t("profile.changePassword")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button onClick={handleSignOut} className="text-destructive font-body text-sm font-bold hover:underline">
                  {t("profile.signOut")}
                </button>
              </div>
            </div>
          </div>


          {/* Points Section */}
          <div className="bg-card rounded-lg p-6 shadow-lg border border-border mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🏆</span>
              <h2 className="font-display text-lg font-bold text-foreground">{t("profile.pointsTitle")}</h2>
            </div>
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-5 text-center">
              <span className="inline-block bg-primary/20 text-primary font-display text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                {t("profile.pointsComingSoon")}
              </span>
              <p className="text-muted-foreground font-body text-sm leading-relaxed">
                {t("profile.pointsComingSoonDesc")}
              </p>
            </div>
          </div>





          <div className="bg-card rounded-lg p-8 shadow-lg border border-border">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                  {t("profile.fullName")}
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("profile.fullNamePlaceholder")}
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">{t("profile.phone")}</label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("profile.phonePlaceholder")}
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                  {t("profile.address")}
                </label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder={t("profile.addressPlaceholder")}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                    {t("profile.city")}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={profile.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 min-h-[44px] rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("profile.cityPlaceholder")}
                  />
                </div>
                <div>
                  <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                    {t("profile.postalCode")}
                  </label>
                  <input
                    type="text"
                    name="postal_code"
                    value={profile.postal_code}
                    onChange={handleChange}
                    className="w-full px-4 py-3 min-h-[44px] rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("profile.postalCodePlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-2">
                  {t("profile.allergies")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {EU_ALLERGENS.map((allergen) => {
                    const isSelected = profile.allergies.includes(allergen.id);
                    return (
                      <button
                        key={allergen.id}
                        type="button"
                        onClick={() => {
                          setProfile((prev) => ({
                            ...prev,
                            allergies: isSelected
                              ? prev.allergies.filter((a) => a !== allergen.id)
                              : [...prev.allergies, allergen.id],
                          }));
                        }}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-body font-bold transition-all ${
                          isSelected
                            ? "bg-destructive/15 border-destructive text-destructive ring-1 ring-destructive/30"
                            : "bg-card border-border text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <span className="text-base">{allergen.emoji}</span>
                        <span>{t(`allergens.${allergen.id}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                  {t("profile.foodPreferences")}
                </label>
                <textarea
                  name="food_preferences"
                  value={profile.food_preferences}
                  onChange={(e) => setProfile((prev) => ({ ...prev, food_preferences: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder={t("profile.foodPreferencesPlaceholder")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 min-h-[48px] rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? t("profile.saving") : t("profile.save")}
              </button>
            </form>

            <MyDiscountsSection />
          </div>
        </div>
      </div>

      <Dialog open={settingsPanel !== null} onOpenChange={(open) => !open && setSettingsPanel(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              {settingsPanel === "password" ? (
                <>
                  <Lock className="w-5 h-5" />
                  {t("profile.changePassword")}
                </>
              ) : (
                <>
                  <Bell className="w-5 h-5" />
                  {t("profile.notificationsLabel", "Notificaciones")}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {settingsPanel === "password" && (
            <form onSubmit={handlePasswordChange} className="space-y-4 pt-2">
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                  {t("profile.newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block font-body text-sm font-bold text-foreground mb-1.5">
                  {t("profile.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-sm bg-background border border-input font-body text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-foreground text-background py-3 min-h-[48px] rounded-sm font-body font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {passwordLoading ? t("profile.changingPassword") : t("profile.changePassword")}
              </button>
            </form>
          )}

          {settingsPanel === "notifications" && (
            <div className="pt-2">
              <UserPushNotificationToggle />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

};

export default Profile;
