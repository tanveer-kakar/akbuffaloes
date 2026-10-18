import heroBuffalo from "@/assets/breeds/hero-buffalo.jpg";
import ceremonialBuffalo from "@/assets/gallery/gallery-4.jpg";
import farmHerd from "@/assets/gallery/gallery-herd.jpg";
import farmCalves from "@/assets/gallery/gallery-calves.jpg";
import farmOverview1 from "@/assets/farm/gallery-farm.jpg";
import farmOverview2 from "@/assets/farm/gallery-farm-2.jpg";
import galleryBuffalo1 from "@/assets/gallery/gallery-buffalo-1.jpg";
import galleryBuffalo2 from "@/assets/gallery/gallery-buffalo-2.jpg";
import gallery3 from "@/assets/gallery/gallery-3.jpg";
import gallery5 from "@/assets/gallery/gallery-5.jpg";
import gallery6 from "@/assets/gallery/gallery-6.jpg";
import gallery7 from "@/assets/gallery/gallery-7.jpg";
import gallery8 from "@/assets/gallery/gallery-8.jpg";
import gallery9 from "@/assets/gallery/gallery-9.jpg";
import gallery10 from "@/assets/gallery/gallery-10.jpg";
import gallery11 from "@/assets/gallery/gallery-11.jpg";
import gallery12 from "@/assets/gallery/gallery-12.jpg";
import gallery15 from "@/assets/gallery/gallery-15.jpg";
import murrah1 from "@/assets/breeds/murrah1.jpg";
import jaffarabadi1 from "@/assets/breeds/Jaffarabadi1.jpg";
import niliRavi1 from "@/assets/breeds/Nili-Ravi1.jpg";
import surti1 from "@/assets/breeds/surti1.jpg";
import mehsana1 from "@/assets/breeds/mahesana1.jpg";
import banni1 from "@/assets/breeds/breed-banni.jpg";
import pandharpuri1 from "@/assets/gallery/gallery-7.jpg";
import nagpuri1 from "@/assets/gallery/gallery-3.jpg";
import bhadawari1 from "@/assets/breeds/buffalo-surti.jpg";
import toda1 from "@/assets/breeds/buffalo-murrah.jpg";

export interface FestivalImagePreset {
  label: string;
  url: string;
  tag: string;
}

export const FESTIVAL_IMAGE_PRESETS: FestivalImagePreset[] = [
  { label: "Ceremonial Red Harness Buffalo (Festive Special)", url: ceremonialBuffalo, tag: "Festive" },
  { label: "Majestic Hero Champion Buffalo", url: heroBuffalo, tag: "Flagship" },
  { label: "AK Buffaloes Green Dairy Farm Overview", url: farmOverview1, tag: "Farm" },
  { label: "AK Buffaloes Modern Livestock Shed", url: farmOverview2, tag: "Farm" },
  { label: "Royal Herd Showcase", url: farmHerd, tag: "Herd" },
  { label: "Healthy Calves & Next Generation", url: farmCalves, tag: "Calves" },
  { label: "Champion Murrah Breed", url: murrah1, tag: "Breed" },
  { label: "Royal Jaffarabadi Breed", url: jaffarabadi1, tag: "Breed" },
  { label: "Pure Nili-Ravi Breed", url: niliRavi1, tag: "Breed" },
  { label: "Maharashtra Pandharpuri Pride", url: pandharpuri1, tag: "Regional" },
  { label: "Vidarbha Nagpuri Heritage", url: nagpuri1, tag: "Regional" },
  { label: "Gujarat Surti Dairy Star", url: surti1, tag: "Breed" },
  { label: "High-Yield Mehsana Buffalo", url: mehsana1, tag: "Breed" },
  { label: "Kutch Banni Champion", url: banni1, tag: "Breed" },
  { label: "A2 Ghee Bhadawari Pride", url: bhadawari1, tag: "Breed" },
  { label: "Godavari / Heritage Buffalo", url: toda1, tag: "Breed" },
];

const FESTIVAL_SLUG_IMAGE_MAP: Record<string, string> = {
  // January
  "new-year-day": heroBuffalo,
  "savitribai-phule-jayanti": pandharpuri1,
  "makar-sankranti": farmOverview1,
  "pongal": toda1,
  "republic-day": heroBuffalo,
  // February
  "chhatrapati-shivaji-maharaj-jayanti": pandharpuri1,
  "maha-shivaratri": jaffarabadi1,
  "ramadan-begins": niliRavi1,
  // March
  "holi": ceremonialBuffalo,
  "gudi-padwa": ceremonialBuffalo,
  "ugadi": surti1,
  "eid-ul-fitr": murrah1,
  "ram-navami": bhadawari1,
  // April
  "mahavir-jayanti": mehsana1,
  "good-friday": farmOverview2,
  "easter-sunday": farmCalves,
  "ambedkar-jayanti": nagpuri1,
  "baisakhi": niliRavi1,
  "hanuman-jayanti": jaffarabadi1,
  // May
  "maharashtra-day": pandharpuri1,
  "buddha-purnima": farmOverview1,
  "eid-ul-adha": murrah1,
  // June
  "world-milk-day": galleryBuffalo1,
  "muharram": gallery9,
  // August
  "independence-day": heroBuffalo,
  "raksha-bandhan": ceremonialBuffalo,
  "eid-e-milad-un-nabi": niliRavi1,
  "krishna-janmashtami": farmCalves,
  // September
  "pola-bail-pola": ceremonialBuffalo,
  "ganesh-chaturthi": ceremonialBuffalo,
  "onam": toda1,
  // October
  "gandhi-jayanti": farmOverview1,
  "sharad-navratri": banni1,
  "dussehra-vijayadashami": ceremonialBuffalo,
  // November
  "diwali-deepawali": ceremonialBuffalo,
  "govardhan-puja-balipratipada": farmHerd,
  "bhai-dooj": gallery6,
  "chhath-puja": gallery10,
  "guru-nanak-jayanti": niliRavi1,
  "constitution-day": heroBuffalo,
  // December
  "kisan-diwas-farmers-day": farmOverview2,
  "christmas-day": gallery15,
};

/**
 * Resolves a rich, authentic AK Buffaloes image for any festival or special day.
 * Always returns a valid image URL even if the occasion has no custom uploaded banner.
 */
export function getDefaultFestivalImage(
  occasionIdOrSlug?: string | null,
  category?: string | null
): string {
  if (occasionIdOrSlug) {
    const clean = occasionIdOrSlug
      .toLowerCase()
      .replace(/^occ-/, "")
      .replace(/^festival-popup-/, "");

    if (FESTIVAL_SLUG_IMAGE_MAP[clean]) {
      return FESTIVAL_SLUG_IMAGE_MAP[clean];
    }

    for (const [key, img] of Object.entries(FESTIVAL_SLUG_IMAGE_MAP)) {
      if (clean.includes(key) || key.includes(clean)) {
        return img;
      }
    }
  }

  switch (category) {
    case "hindu_festival":
      return ceremonialBuffalo;
    case "muslim_festival":
      return murrah1;
    case "national_day":
      return heroBuffalo;
    case "regional_day":
      return pandharpuri1;
    case "jayanti_anniversary":
      return nagpuri1;
    case "international_day":
      return farmOverview1;
    case "other_religious":
      return niliRavi1;
    default:
      return ceremonialBuffalo;
  }
}

export const EXTRA_FESTIVAL_GALLERY_IMAGES = [
  galleryBuffalo1,
  galleryBuffalo2,
  gallery3,
  gallery5,
  gallery6,
  gallery7,
  gallery8,
  gallery9,
  gallery10,
  gallery11,
  gallery12,
  gallery15,
];
