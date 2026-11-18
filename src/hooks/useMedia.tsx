import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllResult } from "@/lib/pagination";

interface MediaItem {
  id: string;
  file_url: string;
  file_type: string;
  media_category: string;
  reference_key: string | null;
}

export const useMedia = (category?: string) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await fetchAllResult((from, to) => {
      let query = supabase
        .from("media")
        .select("id, file_url, file_type, media_category, reference_key")
        .order("sort_order");

      if (category) {
        query = query.eq("media_category", category);
      }

      return query.order("id").range(from, to);
      });
      if (error) console.error("Error loading media", error);
      setMedia((data as MediaItem[]) || []);
      setLoading(false);
    };
    fetch();
  }, [category]);

  const getImageForItem = (referenceKey: string): string | null => {
    const item = media.find(
      (m) => m.reference_key === referenceKey && m.file_type === "image"
    );
    return item?.file_url || null;
  };

  const getVideoForItem = (referenceKey: string): string | null => {
    const item = media.find(
      (m) => m.reference_key === referenceKey && m.file_type === "video"
    );
    return item?.file_url || null;
  };

  const getBackgroundVideos = (): string[] => {
    return media
      .filter((m) => m.media_category === "background_video" && m.file_type === "video")
      .map((m) => m.file_url);
  };

  return { media, loading, getImageForItem, getVideoForItem, getBackgroundVideos };
};
