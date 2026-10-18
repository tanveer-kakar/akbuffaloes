// Gallery assets imports - 17 Unique Images + 25 Unique Videos (Zero Duplicates)

// Unique Gallery Images
import buffalo1 from "@/assets/gallery/gallery-buffalo-1.jpg";
import buffalo2 from "@/assets/gallery/gallery-buffalo-2.jpg";
import gallery3 from "@/assets/gallery/gallery-3.jpg";
import gallery4 from "@/assets/gallery/gallery-4.jpg";
import gallery5 from "@/assets/gallery/gallery-5.jpg";
import gallery6 from "@/assets/gallery/gallery-6.jpg";
import gallery7 from "@/assets/gallery/gallery-7.jpg";
import gallery8 from "@/assets/gallery/gallery-8.jpg";
import gallery9 from "@/assets/gallery/gallery-9.jpg";
import gallery10 from "@/assets/gallery/gallery-10.jpg";
import gallery11 from "@/assets/gallery/gallery-11.jpg";
import gallery12 from "@/assets/gallery/gallery-12.jpg";
import gallery13 from "@/assets/gallery/gallery-13.jpg";
import gallery15 from "@/assets/gallery/gallery-15.jpg";
import gallery16 from "@/assets/gallery/gallery-16.jpg";
import gallery17 from "@/assets/gallery/gallery-17.jpg";
import gallery18 from "@/assets/gallery/gallery-18.jpg";

// Unique Gallery Videos
import galleryVideo from "@/assets/videos/gallery-video.mp4";
import galleryVideo2 from "@/assets/videos/gallery-video2.mp4";
import galleryVideo3 from "@/assets/videos/gallery-video3.mp4";
import galleryVideo4 from "@/assets/videos/gallery-video4.mp4";
import galleryVideo5 from "@/assets/videos/gallery-video5.mp4";
import galleryVideo6 from "@/assets/videos/gallery-video6.mp4";
import galleryVideo7 from "@/assets/videos/gallery-video7.mp4";
import galleryVideo8 from "@/assets/videos/gallery-video8.mp4";
import galleryVideo9 from "@/assets/videos/gallery-video9.mp4";
import galleryVideo10 from "@/assets/videos/gallery-video10.mp4";
import galleryVideo11 from "@/assets/videos/gallery-video11.mp4";
import galleryVideo12 from "@/assets/videos/gallery-video12.mp4";
import galleryVideo13 from "@/assets/videos/gallery-video13.mp4";
import galleryVideo14 from "@/assets/videos/gallery-video14.mp4";
import galleryVideo15 from "@/assets/videos/gallery-video15.mp4";
import galleryVideo16 from "@/assets/videos/gallery-video16.mp4";
import galleryVideo17 from "@/assets/videos/gallery-video17.mp4";
import galleryVideo18 from "@/assets/videos/gallery-video18.mp4";
import galleryVideo19 from "@/assets/videos/gallery-video19.mp4";
import galleryVideo20 from "@/assets/videos/gallery-video20.mp4";
import galleryVideo21 from "@/assets/videos/gallery-video21.mp4";
import galleryVideo22 from "@/assets/videos/gallery-video22.mp4";
import galleryVideo23 from "@/assets/videos/gallery-video23.mp4";
import galleryVideo24 from "@/assets/videos/gallery-video24.mp4";
import galleryVideo25 from "@/assets/videos/gallery-video25.mp4";

export interface GalleryItem {
  id: string;
  type: "image" | "video";
  src: string;
  title: string;
  alt: string;
  description: string;
}

export const galleryItems: GalleryItem[] = [
  // --- 18 PREVIOUS GALLERY IMAGES ONLY ---
  {
    id: "img-1",
    type: "image",
    src: buffalo1,
    title: "Premium Buffalo Front View",
    alt: "Premium buffalo front view",
    description: "Strong front profile showcasing clear eyes, broad forehead and pristine dairy features.",
  },
  {
    id: "img-2",
    type: "image",
    src: buffalo2,
    title: "Premium Buffalo Rear View",
    alt: "Premium buffalo rear view",
    description: "Well-attached dairy udder with broad pelvic structure and functional teat placement.",
  },
  {
    id: "img-3",
    type: "image",
    src: gallery3,
    title: "Buffalo Muscular Build",
    alt: "Buffalo rear muscular build",
    description: "Deep rib cage and powerful rump showing prime health and vigorous constitution.",
  },
  {
    id: "img-4",
    type: "image",
    src: gallery4,
    title: "Buffalo with Red Harness",
    alt: "Buffalo with red harness",
    description: "Ceremonial presentation highlighting docile handling and championship stance.",
  },
  {
    id: "img-5",
    type: "image",
    src: gallery5,
    title: "Buffaloes Feeding in Row",
    alt: "Buffaloes feeding in row",
    description: "Clean manger feeding with high-protein green fodder and balanced daily rations.",
  },
  {
    id: "img-6",
    type: "image",
    src: gallery6,
    title: "Buffaloes with Orange Harness",
    alt: "Buffaloes with orange harness",
    description: "Pairs presented in traditional cattle fair lineup with groomed glossy coats.",
  },
  {
    id: "img-7",
    type: "image",
    src: gallery7,
    title: "Buffalo Pair at Market",
    alt: "Buffalo pair at market",
    description: "High-grade dairy pair vetted for lactation capability and disease resistance.",
  },
  {
    id: "img-8",
    type: "image",
    src: gallery8,
    title: "Buffaloes at Cattle Fair",
    alt: "Buffaloes at cattle fair",
    description: "Competitive exhibition lineup judged on body symmetry and milk potential.",
  },
  {
    id: "img-9",
    type: "image",
    src: gallery9,
    title: "Buffalo Herd at Market",
    alt: "Buffalo herd at market",
    description: "Direct breeder selection with verified health clearances and ancestry records.",
  },
  {
    id: "img-10",
    type: "image",
    src: gallery10,
    title: "Young Buffalo Calf",
    alt: "Young buffalo calf",
    description: "Healthy active young calf with bright eyes and strong growth milestones.",
  },
  {
    id: "img-11",
    type: "image",
    src: gallery11,
    title: "Strong Buffalo Rear View",
    alt: "Strong buffalo rear view",
    description: "Solid pelvic width and straight dorsal topline indicating reproductive soundness.",
  },
  {
    id: "img-12",
    type: "image",
    src: gallery12,
    title: "Buffalo Side Profile",
    alt: "Buffalo side profile",
    description: "Balanced wedge-shaped dairy conformation with clean neck and shoulder blend.",
  },
  {
    id: "img-13",
    type: "image",
    src: gallery13,
    title: "Buffalo Muscular Rear Build",
    alt: "Buffalo muscular rear view",
    description: "Symmetrical udder quarters and robust thighs demonstrating pure dairy pedigree.",
  },
  {
    id: "img-14",
    type: "image",
    src: gallery15,
    title: "Cattle Fair Discussion",
    alt: "Cattle fair discussion",
    description: "Consultation on breed adaptation, feeding schedules and farm management.",
  },
  {
    id: "img-15",
    type: "image",
    src: gallery16,
    title: "Buffalo Market Interaction",
    alt: "Buffalo market interaction",
    description: "Physical inspection of teeth, udder palpation and temperament check.",
  },
  {
    id: "img-16",
    type: "image",
    src: gallery17,
    title: "Farmers at Cattle Market",
    alt: "Farmers at cattle market",
    description: "Engaged community of dairy enthusiasts discussing commercial dairy scaling.",
  },
  {
    id: "img-17",
    type: "image",
    src: gallery18,
    title: "Buffalo Market Gathering",
    alt: "Buffalo market gathering",
    description: "Fair day gathering connecting verified breeders with commercial dairy farmers.",
  },

  // --- 25 UNIQUE VIDEOS ONLY (ZERO DUPLICATES) ---
  {
    id: "vid-1",
    type: "video",
    src: galleryVideo,
    title: "Buffalo Video 1",
    alt: "Buffalo video 1",
    description: "Live movement and gait evaluation showing sound legs and calm behavior.",
  },
  {
    id: "vid-2",
    type: "video",
    src: galleryVideo2,
    title: "Buffalo Video 2",
    alt: "Buffalo video 2",
    description: "Milking readiness assessment, teat structure and handling temperament.",
  },
  {
    id: "vid-3",
    type: "video",
    src: galleryVideo3,
    title: "Buffalo Video 3",
    alt: "Buffalo video 3",
    description: "Cattle ring walk demonstrating classic dairy characteristics and alertness.",
  },
  {
    id: "vid-4",
    type: "video",
    src: galleryVideo4,
    title: "Buffalo Video 4",
    alt: "Buffalo video 4",
    description: "Barn feeding routine with nutritious green fodder and clean water.",
  },
  {
    id: "vid-5",
    type: "video",
    src: galleryVideo5,
    title: "Buffalo Video 5",
    alt: "Buffalo video 5",
    description: "Young stock activity, energetic movement and social herd behavior.",
  },
  {
    id: "vid-6",
    type: "video",
    src: galleryVideo6,
    title: "Buffalo Video 6",
    alt: "Buffalo video 6",
    description: "Close examination of skin luster, horn structure and leg soundness.",
  },
  {
    id: "vid-7",
    type: "video",
    src: galleryVideo7,
    title: "Buffalo Video 7",
    alt: "Buffalo video 7",
    description: "Heavyweight buffalo walk displaying broad pelvic frame and strength.",
  },
  {
    id: "vid-8",
    type: "video",
    src: galleryVideo8,
    title: "Buffalo Video 8",
    alt: "Buffalo video 8",
    description: "Fairground inspection with udder assessment and breed verification.",
  },
  {
    id: "vid-9",
    type: "video",
    src: galleryVideo9,
    title: "Buffalo Video 9",
    alt: "Buffalo video 9",
    description: "High lactation milking demonstration highlighting fast, smooth letdown.",
  },
  {
    id: "vid-10",
    type: "video",
    src: galleryVideo10,
    title: "Buffalo Video 10",
    alt: "Buffalo video 10",
    description: "Exhibition parade showing steady cadence and peaceful disposition.",
  },
  {
    id: "vid-11",
    type: "video",
    src: galleryVideo11,
    title: "Buffalo Video 11",
    alt: "Buffalo video 11",
    description: "Hygienic barn shed routine with comfortable rubber bedding.",
  },
  {
    id: "vid-12",
    type: "video",
    src: galleryVideo12,
    title: "Buffalo Video 12",
    alt: "Buffalo video 12",
    description: "Facial conformation, horn curvature and alert sensory posture.",
  },
  {
    id: "vid-13",
    type: "video",
    src: galleryVideo13,
    title: "Buffalo Video 13",
    alt: "Buffalo video 13",
    description: "Herd movement to feeding mangers for morning nutrition intake.",
  },
  {
    id: "vid-14",
    type: "video",
    src: galleryVideo14,
    title: "Buffalo Video 14",
    alt: "Buffalo video 14",
    description: "Standing ring conformation showing symmetrical legs and posture.",
  },
  {
    id: "vid-15",
    type: "video",
    src: galleryVideo15,
    title: "Buffalo Video 15",
    alt: "Buffalo video 15",
    description: "Fair day presentation attracting progressive dairy farmers.",
  },
  {
    id: "vid-16",
    type: "video",
    src: galleryVideo16,
    title: "Buffalo Video 16",
    alt: "Buffalo video 16",
    description: "Grooming and brushing routine ensuring healthy, clean coat.",
  },
  {
    id: "vid-17",
    type: "video",
    src: galleryVideo17,
    title: "Buffalo Video 17",
    alt: "Buffalo video 17",
    description: "Breeder-buyer consultation on past lactation records and care.",
  },
  {
    id: "vid-18",
    type: "video",
    src: galleryVideo18,
    title: "Buffalo Video 18",
    alt: "Buffalo video 18",
    description: "Pasture exercise and natural sunlight absorption in paddock.",
  },
  {
    id: "vid-19",
    type: "video",
    src: galleryVideo19,
    title: "Buffalo Video 19",
    alt: "Buffalo video 19",
    description: "Trot and agility display verifying robust joint flexibility.",
  },
  {
    id: "vid-20",
    type: "video",
    src: galleryVideo20,
    title: "Buffalo Video 20",
    alt: "Buffalo video 20",
    description: "Hydro-cooling and water wallowing for optimal thermal balance.",
  },
  {
    id: "vid-21",
    type: "video",
    src: galleryVideo21,
    title: "Buffalo Video 21",
    alt: "Buffalo video 21",
    description: "Traditional halter showcase reflecting agricultural heritage.",
  },
  {
    id: "vid-22",
    type: "video",
    src: galleryVideo22,
    title: "Buffalo Video 22",
    alt: "Buffalo video 22",
    description: "Pre-milking sanitation and teat dipping for hygienic milk quality.",
  },
  {
    id: "vid-23",
    type: "video",
    src: galleryVideo23,
    title: "Buffalo Video 23",
    alt: "Buffalo video 23",
    description: "360-degree phenotypic walkthrough detailing skin texture and depth.",
  },
  {
    id: "vid-24",
    type: "video",
    src: galleryVideo24,
    title: "Buffalo Video 24",
    alt: "Buffalo video 24",
    description: "Healthy rumination and feed chewing indicating active digestion.",
  },
  {
    id: "vid-25",
    type: "video",
    src: galleryVideo25,
    title: "Buffalo Video 25",
    alt: "Buffalo video 25",
    description: "Ventilated vehicle loading preparation for safe Pan-India transit.",
  },
];

export interface GalleryItemDbRecord {
  id: string;
  type?: "image" | "video";
  src?: string;
  title?: string;
  alt?: string;
  description?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const isDefaultGalleryItem = (id: string): boolean => {
  return galleryItems.some((item) => item.id === id);
};

export const mergeGalleryWithDb = (
  dbRecords?: GalleryItemDbRecord[] | null
): GalleryItem[] => {
  if (!dbRecords || !Array.isArray(dbRecords) || dbRecords.length === 0) {
    return [...galleryItems];
  }

  const dbMap = new Map<string, GalleryItemDbRecord>();
  for (const record of dbRecords) {
    if (record && record.id) {
      dbMap.set(record.id, record);
    }
  }

  const isCustomMediaUrl = (url?: string): boolean => {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    return (
      trimmed.startsWith("/api/storage/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("/assets/") ||
      trimmed.startsWith("/src/")
    );
  };

  const mergedDefaults: GalleryItem[] = [];
  for (const defItem of galleryItems) {
    const override = dbMap.get(defItem.id);
    if (override) {
      dbMap.delete(defItem.id);
      if (override.is_deleted === true) {
        continue;
      }
      mergedDefaults.push({
        id: defItem.id,
        type: override.type === "video" || override.type === "image" ? override.type : defItem.type,
        src: isCustomMediaUrl(override.src) ? override.src! : defItem.src,
        title: override.title && override.title.trim() ? override.title : defItem.title,
        alt: override.alt && override.alt.trim() ? override.alt : (override.title || defItem.alt),
        description:
          override.description !== undefined && override.description !== null
            ? override.description
            : defItem.description,
      });
    } else {
      mergedDefaults.push(defItem);
    }
  }

  // Remaining items in dbMap are custom added items
  const customAdded: (GalleryItem & { created_at?: string })[] = [];
  for (const record of dbMap.values()) {
    if (record.is_deleted === true) continue;
    if (!record.src || !record.src.trim()) continue;
    const itemType = record.type === "video" ? "video" : "image";
    customAdded.push({
      id: record.id,
      type: itemType,
      src: record.src.trim(),
      title: record.title?.trim() || (itemType === "video" ? "Buffalo Farm Video" : "Buffalo Farm Photo"),
      alt: record.alt?.trim() || record.title?.trim() || "AK Buffaloes gallery media",
      description: record.description?.trim() || "Official media from AK Buffaloes farm showcase.",
      created_at: record.created_at,
    });
  }

  customAdded.sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tB - tA;
  });

  const rawList = [...customAdded, ...mergedDefaults];
  const seenIds = new Set<string>();
  const seenSrcs = new Set<string>();
  const deduplicated: GalleryItem[] = [];

  for (const item of rawList) {
    if (!item || !item.id || !item.src) continue;
    if (seenIds.has(item.id)) continue;

    // Normalize media src (strip cache-busting query params like ?t=... and lowercase)
    const normalizedSrc = item.src.split("?")[0].trim().toLowerCase();
    if (seenSrcs.has(normalizedSrc)) {
      continue; // Skip duplicate media
    }

    seenIds.add(item.id);
    seenSrcs.add(normalizedSrc);
    deduplicated.push(item);
  }

  return deduplicated;
};

