import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Star, MessageSquareHeart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const categories = ["restaurant", "food", "web"] as const;
type Category = (typeof categories)[number];

const ReviewSection = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState<Category>("restaurant");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: t("reviews.ratingRequired"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews" as any).insert({
      category,
      rating,
      message: message.trim() || null,
    } as any);

    setSubmitting(false);

    if (error) {
      toast({ title: t("reviews.error"), variant: "destructive" });
      return;
    }

    setSubmitted(true);
    toast({ title: t("reviews.success") });
  };

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setCategory("restaurant");
    setMessage("");
    setSubmitted(false);
  };

  return (
    <section id="reviews" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 max-w-xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-body font-medium mb-4">
            <MessageSquareHeart className="h-4 w-4" />
            {t("reviews.badge")}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            {t("reviews.title")}
          </h2>
          <p className="mt-3 font-body text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {t("reviews.subtitle")}
          </p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              {t("reviews.thankYou")}
            </h3>
            <p className="font-body text-muted-foreground text-sm mb-6">
              {t("reviews.thankYouDesc")}
            </p>
            <Button variant="outline" onClick={handleReset}>
              {t("reviews.another")}
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            {/* Category selector */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                {t("reviews.categoryLabel")}
              </label>
              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-all ${
                      category === cat
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t(`reviews.cat_${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Star rating */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                {t("reviews.ratingLabel")}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="font-body text-sm font-medium text-foreground mb-2 block">
                {t("reviews.messageLabel")}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder={t("reviews.messagePlaceholder")}
                rows={3}
                className="resize-none"
              />
              <p className="font-body text-xs text-muted-foreground mt-1 text-right">
                {message.length}/500
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="w-full gap-2"
            >
              <Send className="h-4 w-4" />
              {submitting ? t("reviews.submitting") : t("reviews.submit")}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;
