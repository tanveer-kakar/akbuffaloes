import murrah1 from "@/assets/breeds/murrah1.jpg";
import murrah2 from "@/assets/breeds/murrah2.jpg";

import niliRavi1 from "@/assets/breeds/Nili-Ravi1.jpg";
import niliRavi2 from "@/assets/breeds/Nili-Ravi2.jpg";

import jaffarabadi1 from "@/assets/breeds/Jaffarabadi1.jpg";
import jaffarabadi2 from "@/assets/breeds/Jaffarabadi2.jpg";

import surti1 from "@/assets/breeds/surti1.jpg";
import surti2 from "@/assets/breeds/surti2.jpg";

import mahesana1 from "@/assets/breeds/mahesana1.jpg";
import mahesana2 from "@/assets/breeds/mahesana2.jpg";

// Assets for the 5 additional Indian Buffalo Breeds (Banni, Pandharpuri, Nagpuri, Bhadawari, Godavari)
// All 100% genuine buffalo photos from src/assets
import breedBanni1 from "@/assets/breeds/breed-banni.jpg";
import banni2 from "@/assets/gallery/gallery-buffalo-1.jpg";
import banni3 from "@/assets/gallery/gallery-4.jpg";
import banni4 from "@/assets/gallery/gallery-6.jpg";
import banni5 from "@/assets/gallery/gallery-12.jpg";

import pandharpuri1 from "@/assets/gallery/gallery-7.jpg";
import pandharpuri2 from "@/assets/gallery/gallery-8.jpg";
import pandharpuri3 from "@/assets/gallery/gallery-9.jpg";
import pandharpuri4 from "@/assets/gallery/gallery-11.jpg";
import pandharpuri5 from "@/assets/gallery/gallery-13.jpg";

import nagpuri1 from "@/assets/gallery/gallery-3.jpg";
import nagpuri2 from "@/assets/gallery/gallery-5.jpg";
import nagpuri3 from "@/assets/gallery/gallery-15.jpg";
import nagpuri4 from "@/assets/breeds/hero-buffalo.jpg";
import nagpuri5 from "@/assets/gallery/gallery-herd.jpg";

import bhadawari1 from "@/assets/breeds/buffalo-surti.jpg";
import bhadawari2 from "@/assets/gallery/gallery-buffalo-2.jpg";
import bhadawari3 from "@/assets/gallery/gallery-10.jpg";

import godavari1 from "@/assets/breeds/buffalo-murrah.jpg";
import godavari2 from "@/assets/breeds/buffalo-nili.jpg";
import godavari4 from "@/assets/breeds/breed-murrah.jpg";
import godavari5 from "@/assets/breeds/breed-mehsana.jpg";

import galleryCalves from "@/assets/gallery/gallery-calves.jpg";
import galleryVideo from "@/assets/videos/gallery-video.mp4";
import galleryVideo2 from "@/assets/videos/gallery-video2.mp4";
import galleryVideo3 from "@/assets/videos/gallery-video3.mp4";
import galleryVideo4 from "@/assets/videos/gallery-video4.mp4";
import galleryVideo5 from "@/assets/videos/gallery-video5.mp4";
import galleryVideo6 from "@/assets/videos/gallery-video6.mp4";
import galleryVideo7 from "@/assets/videos/gallery-video7.mp4";
import galleryVideo8 from "@/assets/videos/gallery-video8.mp4";
import videoV1 from "@/assets/videos/v1.mp4";
import videoV2 from "@/assets/videos/v2.mp4";

// Pool of additional genuine farm/breed buffalo photos used to give every sample 5 distinct genuine photos in its slider
const EXTRA_GENUINE_BUFFALO_POOL: string[] = [
  godavari1,
  banni2,
  bhadawari2,
  nagpuri1,
  banni3,
  nagpuri2,
  banni4,
  pandharpuri1,
  pandharpuri2,
  pandharpuri3,
  bhadawari3,
  pandharpuri4,
  banni5,
  pandharpuri5,
  nagpuri3,
  godavari4,
  godavari5,
  breedBanni1,
  nagpuri4,
  nagpuri5,
  galleryCalves,
];

export interface BuffaloBreedMeta {
  slug: string;
  name: string;
  desc: string;
  color: string;
  image: string;
  priceRange: string;
  shortPriceRange: string;
  defaultImagePath: string;
  photoPaths: string[];
  photoAssets: string[];
  sampleProfiles: [number, string, string, string][];
}

export const BUFFALO_BREEDS: BuffaloBreedMeta[] = [
  {
    slug: "murrah",
    name: "Murrah",
    desc: "Known for highest milk yield among all buffalo breeds",
    color: "from-green-dark to-green-medium",
    image: murrah1,
    priceRange: "₹80,000 – ₹1,60,000",
    shortPriceRange: "₹80K – ₹160K",
    defaultImagePath: "/murrah1.jpg",
    photoPaths: ["/murrah1.jpg", "/murrah2.jpg"],
    photoAssets: [murrah1, murrah2],
    sampleProfiles: [
      [80000, "3 years", "450 kg", "8 L/day"],
      [100000, "4 years", "500 kg", "10 L/day"],
      [120000, "5 years", "550 kg", "12 L/day"],
      [140000, "4 years", "575 kg", "14 L/day"],
      [160000, "6 years", "600 kg", "11 L/day"],
    ],
  },
  {
    slug: "nili-ravi",
    name: "Nili-Ravi",
    desc: "Popular breed with good milk production and docile nature",
    color: "from-blue-700 to-blue-500",
    image: niliRavi1,
    priceRange: "₹75,000 – ₹1,50,000",
    shortPriceRange: "₹75K – ₹150K",
    defaultImagePath: "/Nili-Ravi1.jpg",
    photoPaths: ["/Nili-Ravi1.jpg", "/Nili-Ravi2.jpg"],
    photoAssets: [niliRavi1, niliRavi2],
    sampleProfiles: [
      [75000, "3 years", "450 kg", "7 L/day"],
      [95000, "4 years", "500 kg", "9 L/day"],
      [115000, "5 years", "550 kg", "10 L/day"],
      [135000, "4 years", "575 kg", "12 L/day"],
      [150000, "6 years", "600 kg", "11 L/day"],
    ],
  },
  {
    slug: "jaffarabadi",
    name: "Jaffarabadi",
    desc: "Heaviest Indian breed with massive body and high yield",
    color: "from-purple-700 to-purple-500",
    image: jaffarabadi1,
    priceRange: "₹1,00,000 – ₹2,00,000",
    shortPriceRange: "₹100K – ₹200K",
    defaultImagePath: "/Jaffarabadi1.jpg",
    photoPaths: ["/Jaffarabadi1.jpg", "/Jaffarabadi2.jpg"],
    photoAssets: [jaffarabadi1, jaffarabadi2],
    sampleProfiles: [
      [100000, "3 years", "550 kg", "8 L/day"],
      [125000, "4 years", "600 kg", "9 L/day"],
      [150000, "5 years", "650 kg", "10 L/day"],
      [175000, "5 years", "700 kg", "12 L/day"],
      [200000, "6 years", "750 kg", "11 L/day"],
    ],
  },
  {
    slug: "surti",
    name: "Surti",
    desc: "Medium-sized breed known for rich, high-fat milk",
    color: "from-amber-700 to-amber-500",
    image: surti1,
    priceRange: "₹70,000 – ₹1,40,000",
    shortPriceRange: "₹70K – ₹140K",
    defaultImagePath: "/surti1.jpg",
    photoPaths: ["/surti1.jpg", "/surti2.jpg"],
    photoAssets: [surti1, surti2],
    sampleProfiles: [
      [70000, "3 years", "400 kg", "6 L/day"],
      [85000, "4 years", "425 kg", "7 L/day"],
      [100000, "5 years", "450 kg", "8 L/day"],
      [120000, "4 years", "500 kg", "9 L/day"],
      [140000, "6 years", "550 kg", "8 L/day"],
    ],
  },
  {
    slug: "mehsana",
    name: "Mehsana",
    desc: "Cross between Murrah and Surti with excellent traits",
    color: "from-teal-700 to-teal-500",
    image: mahesana1,
    priceRange: "₹75,000 – ₹1,50,000",
    shortPriceRange: "₹75K – ₹150K",
    defaultImagePath: "/mahesana1.jpg",
    photoPaths: ["/mahesana1.jpg", "/mahesana2.jpg"],
    photoAssets: [mahesana1, mahesana2],
    sampleProfiles: [
      [75000, "3 years", "450 kg", "7 L/day"],
      [95000, "4 years", "475 kg", "8 L/day"],
      [115000, "5 years", "500 kg", "9 L/day"],
      [135000, "4 years", "550 kg", "11 L/day"],
      [150000, "6 years", "600 kg", "10 L/day"],
    ],
  },
  // --- 5 ADDITIONAL PREMIUM BUFFALO BREEDS ---
  {
    slug: "banni",
    name: "Banni",
    desc: "Famous Kutch breed prized for high milk yield, night-grazing resilience, and disease resistance",
    color: "from-emerald-700 to-emerald-500",
    image: breedBanni1,
    priceRange: "₹85,000 – ₹1,65,000",
    shortPriceRange: "₹85K – ₹165K",
    defaultImagePath: "/banni1.jpg",
    photoPaths: ["/banni1.jpg", "/banni2.jpg"],
    photoAssets: [breedBanni1, banni2],
    sampleProfiles: [
      [85000, "3 years", "460 kg", "9 L/day"],
      [105000, "4 years", "500 kg", "10 L/day"],
      [125000, "4.5 years", "530 kg", "12 L/day"],
      [145000, "5 years", "560 kg", "13 L/day"],
      [165000, "6 years", "590 kg", "14 L/day"],
    ],
  },
  {
    slug: "pandharpuri",
    name: "Pandharpuri",
    desc: "Pride of Maharashtra with signature long curved horns, hardy build, and rich A2 dairy milk",
    color: "from-indigo-700 to-indigo-500",
    image: pandharpuri1,
    priceRange: "₹70,000 – ₹1,45,000",
    shortPriceRange: "₹70K – ₹145K",
    defaultImagePath: "/pandharpuri1.jpg",
    photoPaths: ["/pandharpuri1.jpg", "/pandharpuri2.jpg"],
    photoAssets: [pandharpuri1, pandharpuri2],
    sampleProfiles: [
      [70000, "3 years", "420 kg", "7 L/day"],
      [88000, "4 years", "450 kg", "8 L/day"],
      [105000, "4.5 years", "480 kg", "9 L/day"],
      [125000, "5 years", "510 kg", "10 L/day"],
      [145000, "6 years", "540 kg", "11 L/day"],
    ],
  },
  {
    slug: "nagpuri",
    name: "Nagpuri",
    desc: "Traditional Vidarbha & Maharashtra breed known for heat tolerance, low maintenance, and creamy milk",
    color: "from-rose-700 to-rose-500",
    image: nagpuri1,
    priceRange: "₹65,000 – ₹1,35,000",
    shortPriceRange: "₹65K – ₹135K",
    defaultImagePath: "/nagpuri1.jpg",
    photoPaths: ["/nagpuri1.jpg", "/nagpuri2.jpg"],
    photoAssets: [nagpuri1, nagpuri2],
    sampleProfiles: [
      [65000, "3 years", "400 kg", "6 L/day"],
      [82000, "3.5 years", "430 kg", "7 L/day"],
      [98000, "4 years", "460 kg", "8 L/day"],
      [115000, "5 years", "490 kg", "9 L/day"],
      [135000, "6 years", "520 kg", "10 L/day"],
    ],
  },
  {
    slug: "bhadawari",
    name: "Bhadawari",
    desc: "Copper-toned breed famous across India for highest butterfat content (up to 12.5% fat for pure ghee)",
    color: "from-orange-700 to-orange-500",
    image: bhadawari1,
    priceRange: "₹70,000 – ₹1,40,000",
    shortPriceRange: "₹70K – ₹140K",
    defaultImagePath: "/bhadawari1.jpg",
    photoPaths: ["/bhadawari1.jpg", "/bhadawari2.jpg"],
    photoAssets: [bhadawari1, bhadawari2],
    sampleProfiles: [
      [70000, "3 years", "400 kg", "6 L/day"],
      [85000, "4 years", "425 kg", "7 L/day"],
      [102000, "4.5 years", "450 kg", "8 L/day"],
      [120000, "5 years", "475 kg", "9 L/day"],
      [140000, "6 years", "500 kg", "9.5 L/day"],
    ],
  },
  {
    slug: "godavari",
    name: "Godavari",
    desc: "High-yielding Murrah-cross delta breed prized for long lactation cycles and calm temperament",
    color: "from-cyan-700 to-cyan-500",
    image: godavari1,
    priceRange: "₹75,000 – ₹1,50,000",
    shortPriceRange: "₹75K – ₹150K",
    defaultImagePath: "/godavari1.jpg",
    photoPaths: ["/godavari1.jpg", "/godavari2.jpg"],
    photoAssets: [godavari1, godavari2],
    sampleProfiles: [
      [75000, "3 years", "440 kg", "8 L/day"],
      [92000, "4 years", "475 kg", "9 L/day"],
      [110000, "4.5 years", "500 kg", "10 L/day"],
      [130000, "5 years", "535 kg", "11 L/day"],
      [150000, "6 years", "565 kg", "12 L/day"],
    ],
  },
];

// Slug -> Display Name map
export const BREED_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(
  BUFFALO_BREEDS.map((b) => [b.slug, b.name])
);

// Slug -> Default Cover Image map
export const BREED_SLUG_TO_IMAGE: Record<string, string> = Object.fromEntries(
  BUFFALO_BREEDS.map((b) => [b.slug, b.image])
);

// Build unified map of virtual paths (/murrah1.jpg, /banni1.jpg, sample-banni-1, default-banni-1, etc.) to resolved Vite asset URLs
export const ALL_BREED_IMAGES_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const breed of BUFFALO_BREEDS) {
    breed.photoPaths.forEach((p, idx) => {
      const asset = breed.photoAssets[idx];
      map[p] = asset;
      map[p.toLowerCase()] = asset;
      const stripped = p.replace(/^\/+/, "");
      map[stripped] = asset;
      map[stripped.toLowerCase()] = asset;
      map[`/${breed.slug}${idx + 1}.jpg`] = asset;
      map[`/${breed.slug}${idx + 1}`] = asset;
      map[`${breed.slug}${idx + 1}.jpg`] = asset;
      map[`${breed.slug}${idx + 1}`] = asset;
      map[`default-${breed.slug}-${idx + 1}`] = asset;
      map[`sample-${breed.slug}-${idx + 1}`] = asset;
    });
  }

  // Canonical IDs & Stock Codes for All 10 Buffalo Breeds Catalog
  map["BRD-001"] = murrah1;
  map["brd-001"] = murrah1;
  map["breed-catalog-murrah"] = murrah1;
  map["BRD-002"] = niliRavi1;
  map["brd-002"] = niliRavi1;
  map["breed-catalog-nili-ravi"] = niliRavi1;
  map["BRD-003"] = jaffarabadi1;
  map["brd-003"] = jaffarabadi1;
  map["breed-catalog-jaffarabadi"] = jaffarabadi1;
  map["BRD-004"] = surti1;
  map["brd-004"] = surti1;
  map["breed-catalog-surti"] = surti1;
  map["BRD-005"] = mahesana1;
  map["brd-005"] = mahesana1;
  map["breed-catalog-mehsana"] = mahesana1;
  map["BRD-006"] = breedBanni1;
  map["brd-006"] = breedBanni1;
  map["breed-catalog-banni"] = breedBanni1;
  map["BRD-007"] = pandharpuri1;
  map["brd-007"] = pandharpuri1;
  map["breed-catalog-pandharpuri"] = pandharpuri1;
  map["BRD-008"] = nagpuri1;
  map["brd-008"] = nagpuri1;
  map["breed-catalog-nagpuri"] = nagpuri1;
  map["BRD-009"] = bhadawari1;
  map["brd-009"] = bhadawari1;
  map["breed-catalog-bhadawari"] = bhadawari1;
  map["BRD-010"] = godavari1;
  map["brd-010"] = godavari1;
  map["breed-catalog-godavari"] = godavari1;

  // Canonical IDs & Stock Codes for Curated New Stocks (AKB-001 to AKB-008)
  map["AKB-001"] = jaffarabadi1;
  map["akb-001"] = jaffarabadi1;
  map["new-stock-akb-001"] = jaffarabadi1;
  map["AKB-002"] = jaffarabadi2;
  map["akb-002"] = jaffarabadi2;
  map["new-stock-akb-002"] = jaffarabadi2;
  map["AKB-003"] = jaffarabadi1;
  map["akb-003"] = jaffarabadi1;
  map["new-stock-akb-003"] = jaffarabadi1;
  map["AKB-004"] = jaffarabadi2;
  map["akb-004"] = jaffarabadi2;
  map["new-stock-akb-004"] = jaffarabadi2;
  map["AKB-005"] = niliRavi1;
  map["akb-005"] = niliRavi1;
  map["new-stock-akb-005"] = niliRavi1;
  map["AKB-006"] = breedBanni1;
  map["akb-006"] = breedBanni1;
  map["new-stock-akb-006"] = breedBanni1;
  map["AKB-007"] = mahesana1;
  map["akb-007"] = mahesana1;
  map["new-stock-akb-007"] = mahesana1;
  map["AKB-008"] = pandharpuri1;
  map["akb-008"] = pandharpuri1;
  map["new-stock-akb-008"] = pandharpuri1;

  // Common aliases and virtual paths to guarantee 100% valid Vite assets
  map["/Jaffarabadi1.jpg"] = jaffarabadi1;
  map["/Jaffarabadi2.jpg"] = jaffarabadi2;
  map["/Jaffarabadi3.jpg"] = jaffarabadi1;
  map["/Jaffarabadi4.jpg"] = jaffarabadi2;
  map["/Jaffarabadi5.jpg"] = jaffarabadi1;
  map["/jaffarabadi1.jpg"] = jaffarabadi1;
  map["/jaffarabadi2.jpg"] = jaffarabadi2;
  map["/jaffarabadi3.jpg"] = jaffarabadi1;
  map["/jaffarabadi4.jpg"] = jaffarabadi2;
  map["/jaffarabadi5.jpg"] = jaffarabadi1;
  map["jaffarabadi1.jpg"] = jaffarabadi1;
  map["jaffarabadi2.jpg"] = jaffarabadi2;
  map["jaffarabadi3.jpg"] = jaffarabadi1;
  map["jaffarabadi4.jpg"] = jaffarabadi2;
  map["/jaffarabadi.jpg"] = jaffarabadi1;
  map["jaffarabadi.jpg"] = jaffarabadi1;

  map["/murrah1.jpg"] = murrah1;
  map["/murrah2.jpg"] = murrah2;
  map["/murrah3.jpg"] = murrah1;
  map["/murrah4.jpg"] = murrah2;
  map["murrah1.jpg"] = murrah1;
  map["murrah2.jpg"] = murrah2;
  map["/murrah.jpg"] = murrah1;
  map["murrah.jpg"] = murrah1;

  map["/Nili-Ravi1.jpg"] = niliRavi1;
  map["/Nili-Ravi2.jpg"] = niliRavi2;
  map["/nili-ravi1.jpg"] = niliRavi1;
  map["/nili-ravi2.jpg"] = niliRavi2;
  map["/nili-ravi3.jpg"] = niliRavi1;
  map["/nili-ravi4.jpg"] = niliRavi2;
  map["/niliravi1.jpg"] = niliRavi1;
  map["/niliravi2.jpg"] = niliRavi2;
  map["nili-ravi1.jpg"] = niliRavi1;
  map["nili-ravi2.jpg"] = niliRavi2;
  map["niliravi1.jpg"] = niliRavi1;
  map["niliravi2.jpg"] = niliRavi2;
  map["/nili-ravi.jpg"] = niliRavi1;
  map["nili-ravi.jpg"] = niliRavi1;

  map["/mehsana1.jpg"] = mahesana1;
  map["/mehsana2.jpg"] = mahesana2;
  map["/mahesana1.jpg"] = mahesana1;
  map["/mahesana2.jpg"] = mahesana2;
  map["mehsana1.jpg"] = mahesana1;
  map["mehsana2.jpg"] = mahesana2;
  map["mahesana1.jpg"] = mahesana1;
  map["mahesana2.jpg"] = mahesana2;
  map["/mehsana.jpg"] = mahesana1;
  map["/mahesana.jpg"] = mahesana1;
  map["mehsana.jpg"] = mahesana1;
  map["mahesana.jpg"] = mahesana1;

  map["/surti1.jpg"] = surti1;
  map["/surti2.jpg"] = surti2;
  map["surti1.jpg"] = surti1;
  map["surti2.jpg"] = surti2;
  map["/surti.jpg"] = surti1;
  map["surti.jpg"] = surti1;

  map["/banni1.jpg"] = breedBanni1;
  map["/banni2.jpg"] = banni2;
  map["banni1.jpg"] = breedBanni1;
  map["banni2.jpg"] = banni2;
  map["/banni.jpg"] = breedBanni1;
  map["banni.jpg"] = breedBanni1;

  map["/pandharpuri1.jpg"] = pandharpuri1;
  map["/pandharpuri2.jpg"] = pandharpuri2;
  map["pandharpuri1.jpg"] = pandharpuri1;
  map["pandharpuri2.jpg"] = pandharpuri2;
  map["/pandharpuri.jpg"] = pandharpuri1;
  map["pandharpuri.jpg"] = pandharpuri1;

  map["/nagpuri1.jpg"] = nagpuri1;
  map["/nagpuri2.jpg"] = nagpuri2;
  map["nagpuri1.jpg"] = nagpuri1;
  map["nagpuri2.jpg"] = nagpuri2;
  map["/nagpuri.jpg"] = nagpuri1;
  map["nagpuri.jpg"] = nagpuri1;

  map["/bhadawari1.jpg"] = bhadawari1;
  map["/bhadawari2.jpg"] = bhadawari2;
  map["bhadawari1.jpg"] = bhadawari1;
  map["bhadawari2.jpg"] = bhadawari2;
  map["/bhadawari.jpg"] = bhadawari1;
  map["bhadawari.jpg"] = bhadawari1;

  map["/godavari1.jpg"] = godavari1;
  map["/godavari2.jpg"] = godavari2;
  map["godavari1.jpg"] = godavari1;
  map["godavari2.jpg"] = godavari2;
  map["/godavari.jpg"] = godavari1;
  map["godavari.jpg"] = godavari1;

  return map;
})();

// Preset photo options per breed for Admin Panel Add/Edit modal
export const BREED_PRESET_OPTIONS: Record<string, { label: string; value: string; preview: string }[]> =
  Object.fromEntries(
    BUFFALO_BREEDS.map((b) => [
      b.name,
      b.photoPaths.map((val, idx) => ({
        label: `${b.name} Photo ${idx + 1}`,
        value: val,
        preview: b.photoAssets[idx],
      })),
    ])
  );

export function getBreedMetaByNameOrSlug(breedOrSlug?: string | null): BuffaloBreedMeta {
  const normalized = (breedOrSlug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normalized) return BUFFALO_BREEDS[0];
  const found = BUFFALO_BREEDS.find((b) => {
    const bNorm = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const sNorm = b.slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (
      bNorm === normalized ||
      sNorm === normalized ||
      normalized.includes(bNorm) ||
      (normalized.includes("mahesana") && b.slug === "mehsana")
    );
  });
  return found || BUFFALO_BREEDS[0];
}

export function getDefaultBreedImagePath(breedName?: string | null): string {
  return getBreedMetaByNameOrSlug(breedName).defaultImagePath;
}

/**
 * Universal media asset resolver for buffalo photos.
 * Guarantees a genuine Vite asset URL across dev, production, Netlify, and offline modes.
 */
export function resolveBuffaloMediaAsset(
  rawUrl?: string | null,
  breedName?: string | null,
  photoIndex = 0
): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "none" || trimmed === "__none__") return null;

  // 1. Custom runtime uploads & remote URLs (Data URIs, blob URLs, live web/CDN URLs, storage URLs)
  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/api/storage/") ||
    trimmed.startsWith("/.netlify/") ||
    ((trimmed.startsWith("http://") || trimmed.startsWith("https://")) &&
      !trimmed.includes("/src/assets/breeds/"))
  ) {
    return trimmed;
  }

  // Strip query strings (e.g. cache-busters like ?t=1729609...) before asset mapping
  const cleanUrl = trimmed.split("?")[0].trim();

  // 2. Direct or lowercase lookup in ALL_BREED_IMAGES_MAP
  if (ALL_BREED_IMAGES_MAP[cleanUrl]) return ALL_BREED_IMAGES_MAP[cleanUrl];
  if (ALL_BREED_IMAGES_MAP[cleanUrl.toLowerCase()]) return ALL_BREED_IMAGES_MAP[cleanUrl.toLowerCase()];

  // 3. Normalized with/without leading slash
  const withoutSlash = cleanUrl.replace(/^\/+/, "");
  if (ALL_BREED_IMAGES_MAP[withoutSlash]) return ALL_BREED_IMAGES_MAP[withoutSlash];
  if (ALL_BREED_IMAGES_MAP[withoutSlash.toLowerCase()]) return ALL_BREED_IMAGES_MAP[withoutSlash.toLowerCase()];

  const withSlash = `/${withoutSlash}`;
  if (ALL_BREED_IMAGES_MAP[withSlash]) return ALL_BREED_IMAGES_MAP[withSlash];
  if (ALL_BREED_IMAGES_MAP[withSlash.toLowerCase()]) return ALL_BREED_IMAGES_MAP[withSlash.toLowerCase()];

  // 4. Keyword/token fallback ONLY for local bundled asset paths or build hashes
  const cleanLower = cleanUrl.toLowerCase();
  if (cleanLower.includes("jaffarabadi2") || cleanLower.includes("jaffarabadi4")) return jaffarabadi2;
  if (cleanLower.includes("jaffarabadi")) return jaffarabadi1;
  if (cleanLower.includes("nili") && (cleanLower.includes("2") || cleanLower.includes("4"))) return niliRavi2;
  if (cleanLower.includes("nili")) return niliRavi1;
  if (cleanLower.includes("murrah") && (cleanLower.includes("2") || cleanLower.includes("4"))) return murrah2;
  if (cleanLower.includes("murrah")) return murrah1;
  if (cleanLower.includes("surti") && cleanLower.includes("2")) return surti2;
  if (cleanLower.includes("surti")) return surti1;
  if ((cleanLower.includes("mehsana") || cleanLower.includes("mahesana")) && cleanLower.includes("2")) return mahesana2;
  if (cleanLower.includes("mehsana") || cleanLower.includes("mahesana")) return mahesana1;
  if (cleanLower.includes("banni") && cleanLower.includes("2")) return banni2;
  if (cleanLower.includes("banni") || cleanLower.includes("breed-banni")) return breedBanni1;
  if (cleanLower.includes("pandharpuri") && cleanLower.includes("2")) return pandharpuri2;
  if (cleanLower.includes("pandharpuri")) return pandharpuri1;
  if (cleanLower.includes("nagpuri") && cleanLower.includes("2")) return nagpuri2;
  if (cleanLower.includes("nagpuri")) return nagpuri1;
  if (cleanLower.includes("bhadawari") && cleanLower.includes("2")) return bhadawari2;
  if (cleanLower.includes("bhadawari")) return bhadawari1;
  if (cleanLower.includes("godavari") && cleanLower.includes("2")) return godavari2;
  if (cleanLower.includes("godavari")) return godavari1;

  // 5. Fallback to breed meta
  const meta = getBreedMetaByNameOrSlug(breedName);
  return meta.photoAssets[photoIndex % meta.photoAssets.length] || meta.image;
}

export function resolveBuffaloImage(
  buffalo: {
    id?: string;
    stock_code?: string;
    name?: string;
    breed?: string;
    image_url?: string | null;
    extra_images?: string[] | null;
  },
  index = 0,
  fallbackBreedSlugOrName?: string
): string {
  const meta = getBreedMetaByNameOrSlug(buffalo.breed || fallbackBreedSlugOrName);

  // 1. Try resolving primary image_url if not explicitly removed
  if (buffalo.image_url) {
    const resolved = resolveBuffaloMediaAsset(buffalo.image_url, buffalo.breed || fallbackBreedSlugOrName, index);
    if (resolved) return resolved;
  }

  // 2. If main photo was removed or not set, but Photo 2 exists, show Photo 2 on the card
  if (Array.isArray(buffalo.extra_images) && buffalo.extra_images.length > 0 && buffalo.extra_images[0]) {
    const resolvedExtra = resolveBuffaloMediaAsset(buffalo.extra_images[0], buffalo.breed || fallbackBreedSlugOrName, 1);
    if (resolvedExtra) return resolvedExtra;
  }

  // 3. Stock code or ID lookup in ALL_BREED_IMAGES_MAP (e.g. AKB-001, new-stock-akb-001, BRD-001)
  if (buffalo.stock_code && ALL_BREED_IMAGES_MAP[buffalo.stock_code.toUpperCase()]) {
    return ALL_BREED_IMAGES_MAP[buffalo.stock_code.toUpperCase()];
  }
  if (buffalo.id && ALL_BREED_IMAGES_MAP[buffalo.id]) {
    return ALL_BREED_IMAGES_MAP[buffalo.id];
  }

  // 4. Numbered name fallback
  const match = (buffalo.name || "").match(/\d+/);
  if (match) {
    const idx = parseInt(match[0], 10) - 1;
    if (idx >= 0 && idx < meta.photoAssets.length) {
      return meta.photoAssets[idx];
    }
  }

  return meta.photoAssets[index % meta.photoAssets.length] || meta.image;
}

export function resolveAdminBuffaloThumb(
  breed: string,
  imageUrl?: string | null,
  id?: string
): string {
  return resolveBuffaloImage({ id, breed, image_url: imageUrl }, 0, breed);
}

/**
 * Returns genuine buffalo images for any buffalo listing (strictly 1 or 2 photos max).
 * - If only 1 image was selected or Photo 2 was removed, returns exactly that 1 photo.
 * - If Photo 2 is present, returns exactly 2 photos.
 * - Respects canonical stock profiles (AKB-001 to AKB-008) so New Stocks always have genuine photos.
 */
export function getBuffaloSliderImages(
  buffaloOrBreed:
    | {
        id?: string;
        stock_code?: string;
        name?: string;
        breed?: string;
        image_url?: string | null;
        extra_images?: string[] | null;
      }
    | string,
  indexOrId: number | string = 0,
  fallbackBreedOrImageUrl?: string | null
): string[] {
  if (typeof buffaloOrBreed === "string") {
    const meta = getBreedMetaByNameOrSlug(buffaloOrBreed);
    const result: string[] = [];
    if (meta.photoAssets[0]) result.push(meta.photoAssets[0]);
    if (meta.photoAssets[1]) result.push(meta.photoAssets[1]);
    return result.slice(0, 2);
  }

  const buffalo = buffaloOrBreed;
  const index = typeof indexOrId === "number" ? indexOrId : 0;
  const fallbackBreedSlugOrName =
    typeof buffaloOrBreed === "string" ? buffaloOrBreed : fallbackBreedOrImageUrl || undefined;
  const meta = getBreedMetaByNameOrSlug(buffalo.breed || fallbackBreedSlugOrName);

  const isPhoto1ExplicitlyRemoved =
    buffalo.image_url === "" ||
    buffalo.image_url === null ||
    buffalo.image_url === "none" ||
    buffalo.image_url === "__none__";

  const isPhoto2ExplicitlyRemoved =
    Array.isArray(buffalo.extra_images) && buffalo.extra_images.length === 0;

  const result: string[] = [];

  // 1. Resolve Photo 1 if not explicitly removed
  if (!isPhoto1ExplicitlyRemoved) {
    if (buffalo.image_url) {
      const resolved = resolveBuffaloMediaAsset(buffalo.image_url, buffalo.breed || fallbackBreedSlugOrName, index);
      if (resolved && !result.includes(resolved)) {
        result.push(resolved);
      }
    } else if (buffalo.image_url === undefined) {
      const fallback = meta.photoAssets[index % meta.photoAssets.length] || meta.image;
      if (fallback && !result.includes(fallback)) {
        result.push(fallback);
      }
    }
  }

  // 2. Resolve Photo 2 from extra_images if present
  if (Array.isArray(buffalo.extra_images) && buffalo.extra_images.length > 0) {
    for (const extra of buffalo.extra_images) {
      const resolved = resolveBuffaloMediaAsset(extra, buffalo.breed || fallbackBreedSlugOrName, 1);
      if (resolved && !result.includes(resolved)) {
        result.push(resolved);
      }
      if (result.length >= 2) break;
    }
    // Explicit array was passed; strictly respect it and do NOT auto-fill extra pool photos
    return result.slice(0, 2);
  }

  // 3. If Photo 2 was explicitly removed (extra_images === []), do NOT add any extra photos
  if (isPhoto2ExplicitlyRemoved) {
    return result.slice(0, 2);
  }

  // 4. Default seed fallback if extra_images is undefined: provide breed second photo
  if (buffalo.extra_images === undefined && result.length < 2) {
    // If stock_code matches AKB, provide alternating photo
    const code = (buffalo.stock_code || "").toUpperCase();
    if (code === "AKB-001" || code === "AKB-003") {
      if (!result.includes(jaffarabadi2)) result.push(jaffarabadi2);
    } else if (code === "AKB-002" || code === "AKB-004") {
      if (!result.includes(jaffarabadi1)) result.push(jaffarabadi1);
    } else if (code === "AKB-005") {
      if (!result.includes(niliRavi2)) result.push(niliRavi2);
    } else if (code === "AKB-006") {
      if (!result.includes(banni2)) result.push(banni2);
    } else if (code === "AKB-007") {
      if (!result.includes(mahesana2)) result.push(mahesana2);
    } else if (code === "AKB-008") {
      if (!result.includes(pandharpuri2)) result.push(pandharpuri2);
    }

    if (result.length < 2) {
      for (const asset of meta.photoAssets) {
        if (asset && !result.includes(asset)) {
          result.push(asset);
          if (result.length >= 2) break;
        }
      }
    }
    if (result.length < 2) {
      for (const poolAsset of EXTRA_GENUINE_BUFFALO_POOL) {
        if (poolAsset && !result.includes(poolAsset)) {
          result.push(poolAsset);
          if (result.length >= 2) break;
        }
      }
    }
  }

  return result.slice(0, 2);
}

// ─── New Stocks (New Arrivals) Metadata & Enrichment ────────────────────────

export interface NewStockBuffaloRecord {
  id: string;
  stock_code: string;
  name: string;
  breed: string;
  subtitle_label: string;
  price: number;
  is_negotiable: boolean;
  age: string;
  weight: string;
  milk_yield: string;
  lactation: string;
  location: string;
  pregnancy_status: string;
  calf_details: string;
  health_records: string;
  description: string | null;
  image_url: string | null;
  extra_images?: string[] | null;
  video_url?: string | null;
  is_available: boolean;
  status: string;
  is_new_stock: boolean;
  created_at: string;
}

export const BUFFALO_VIDEO_PRESETS: { label: string; value: string }[] = [
  { label: "AK Buffaloes Live Video #1 (v1)", value: videoV1 },
  { label: "AK Buffaloes Live Video #2 (v2)", value: videoV2 },
  { label: "Farm Showcase Video #1 (Murrah Milking & Herd)", value: galleryVideo },
  { label: "Farm Showcase Video #2 (Prime Dairy Inspection)", value: galleryVideo2 },
  { label: "Farm Showcase Video #3 (Jaffarabadi & Murrah Lineup)", value: galleryVideo3 },
  { label: "Farm Showcase Video #4 (Live Shed Walkaround)", value: galleryVideo4 },
  { label: "Farm Showcase Video #5 (New Arrival Herd Selection)", value: galleryVideo5 },
  { label: "Farm Showcase Video #6 (Healthy Calves & Mothers)", value: galleryVideo6 },
  { label: "Farm Showcase Video #7 (Evening Milking Session)", value: galleryVideo7 },
  { label: "Farm Showcase Video #8 (Dispatch & Vet Check)", value: galleryVideo8 },
];

export const DEFAULT_NEW_STOCK_PROFILES: NewStockBuffaloRecord[] = [
  {
    id: "new-stock-akb-001",
    stock_code: "AKB-001",
    name: "Jaffarabadi Buffalo",
    breed: "Jaffarabadi",
    subtitle_label: "Jaffarabadi Buffalo",
    price: 155000,
    is_negotiable: true,
    age: "4.5 Years",
    weight: "680 kg",
    milk_yield: "15 L/day",
    lactation: "2nd Lactation",
    location: "Lohari, Jalgaon, Maharashtra",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated & Certified",
    description:
      "Heavy Gir-lineage 2nd lactation Jaffarabadi buffalo yielding 15 L/day with healthy active calf, drooping horns, broad prominent forehead, and high 8.5% butterfat milk.",
    image_url: jaffarabadi1,
    extra_images: [jaffarabadi2],
    video_url: galleryVideo,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T08:00:00.000Z",
  },
  {
    id: "new-stock-akb-002",
    stock_code: "AKB-002",
    name: "Jaffarabadi Buffalo",
    breed: "Jaffarabadi",
    subtitle_label: "Jaffarabadi Buffalo",
    price: 135000,
    is_negotiable: true,
    age: "3.5 Years",
    weight: "620 kg",
    milk_yield: "12 L/day",
    lactation: "1st Lactation",
    location: "Pune, Maharashtra",
    pregnancy_status: "Milking (Freshly Calved)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Freshly calved 1st lactation Jaffarabadi dairy buffalo with strong maternal build, calm milking temperament, and steady 12 L/day rich A2 milk yield.",
    image_url: jaffarabadi2,
    extra_images: [jaffarabadi1],
    video_url: galleryVideo2,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T09:00:00.000Z",
  },
  {
    id: "new-stock-akb-003",
    stock_code: "AKB-003",
    name: "Jaffarabadi Buffalo",
    breed: "Jaffarabadi",
    subtitle_label: "Jaffarabadi Buffalo",
    price: 125000,
    is_negotiable: true,
    age: "3 Years",
    weight: "580 kg",
    milk_yield: "10 L/day",
    lactation: "1st Lactation",
    location: "Nashik, Maharashtra",
    pregnancy_status: "Pregnant (5 Months)",
    calf_details: "Pregnant",
    health_records: "Vaccinated & Dewormed",
    description:
      "Purebred heavy Saurashtra-lineage Jaffarabadi buffalo in 5 months confirmed pregnancy, broad bone frame, thick skin coat, and verified vet clearance.",
    image_url: jaffarabadi1,
    extra_images: [jaffarabadi2],
    video_url: galleryVideo3,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T10:00:00.000Z",
  },
  {
    id: "new-stock-akb-004",
    stock_code: "AKB-004",
    name: "Jaffarabadi Buffalo",
    breed: "Jaffarabadi",
    subtitle_label: "Jaffarabadi Buffalo",
    price: 170000,
    is_negotiable: true,
    age: "5 Years",
    weight: "720 kg",
    milk_yield: "16 L/day",
    lactation: "3rd Lactation",
    location: "Ahmednagar, Maharashtra",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Grand champion 3rd lactation Jaffarabadi buffalo yielding 16 L/day high butterfat milk, magnificent downward curved horns, massive dairy frame, and healthy calf.",
    image_url: jaffarabadi2,
    extra_images: [jaffarabadi1],
    video_url: galleryVideo4,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T11:00:00.000Z",
  },
  {
    id: "new-stock-akb-005",
    stock_code: "AKB-005",
    name: "Nili-Ravi Buffalo (With Calf)",
    breed: "Nili-Ravi",
    subtitle_label: "Nili-Ravi Buffalo (With Calf)",
    price: 115000,
    is_negotiable: true,
    age: "4 Years",
    weight: "540 kg",
    milk_yield: "12 L/day",
    lactation: "2nd Lactation",
    location: "Pachora, Jalgaon, Maharashtra",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Authentic Panch Kalyani Nili-Ravi buffalo with all 5 white markings, gentle milking nature, and steady 12 L/day yield.",
    image_url: niliRavi1,
    extra_images: [niliRavi2],
    video_url: galleryVideo4,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T12:00:00.000Z",
  },
  {
    id: "new-stock-akb-006",
    stock_code: "AKB-006",
    name: "Banni Buffalo",
    breed: "Banni",
    subtitle_label: "Banni Buffalo",
    price: 125000,
    is_negotiable: true,
    age: "4.5 Years",
    weight: "530 kg",
    milk_yield: "13 L/day",
    lactation: "2nd Lactation",
    location: "Solapur, Maharashtra",
    pregnancy_status: "Pregnant (5 Months)",
    calf_details: "With Calf",
    health_records: "Vaccinated",
    description:
      "Resilient Kutch-lineage Banni dairy buffalo producing 13 L/day with high disease resistance and rich SNF milk.",
    image_url: breedBanni1,
    extra_images: [banni2],
    video_url: galleryVideo5,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T13:00:00.000Z",
  },
  {
    id: "new-stock-akb-007",
    stock_code: "AKB-007",
    name: "Mehsana Buffalo",
    breed: "Mehsana",
    subtitle_label: "Mehsana Buffalo",
    price: 95000,
    is_negotiable: true,
    age: "3.5 Years",
    weight: "485 kg",
    milk_yield: "10 L/day",
    lactation: "1st Lactation",
    location: "Dhule, Maharashtra",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated",
    description:
      "High-efficiency Mehsana crossbreed buffalo with long lactation persistence and calm shed behavior.",
    image_url: mahesana1,
    extra_images: [mahesana2],
    video_url: galleryVideo6,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T14:00:00.000Z",
  },
  {
    id: "new-stock-akb-008",
    stock_code: "AKB-008",
    name: "Pandharpuri Buffalo",
    breed: "Pandharpuri",
    subtitle_label: "Pandharpuri Buffalo",
    price: 88000,
    is_negotiable: true,
    age: "4 Years",
    weight: "460 kg",
    milk_yield: "9 L/day",
    lactation: "2nd Lactation",
    location: "Kolhapur, Maharashtra",
    pregnancy_status: "Pregnant (3 Months)",
    calf_details: "Pregnant",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Traditional Maharashtra Pandharpuri buffalo prized for rich A2 milk, heat tolerance, and economical feed requirement.",
    image_url: pandharpuri1,
    extra_images: [pandharpuri2],
    video_url: galleryVideo7,
    is_available: true,
    status: "available",
    is_new_stock: true,
    created_at: "2026-10-10T15:00:00.000Z",
  },
];

export const DEFAULT_BREED_CATALOG_PROFILES: NewStockBuffaloRecord[] = [
  {
    id: "breed-catalog-murrah",
    stock_code: "BRD-001",
    name: "Murrah Buffalo",
    breed: "Murrah",
    subtitle_label: "Murrah Buffalo (With Calf)",
    price: 125000,
    is_negotiable: true,
    age: "4 Years",
    weight: "550 kg",
    milk_yield: "14 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Pregnant (3 Months)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Purebred Haryana-lineage Murrah buffalo known for the highest milk yield among all Indian buffalo breeds, jet-black coat, tightly curled horns, and 14 L/day verified production.",
    image_url: murrah1,
    extra_images: [murrah2],
    video_url: galleryVideo,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T08:00:00.000Z",
  },
  {
    id: "breed-catalog-nili-ravi",
    stock_code: "BRD-002",
    name: "Nili-Ravi Buffalo",
    breed: "Nili-Ravi",
    subtitle_label: "Nili-Ravi Buffalo (With Calf)",
    price: 115000,
    is_negotiable: true,
    age: "4 Years",
    weight: "535 kg",
    milk_yield: "12 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Milking (Freshly Calved)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Authentic Panch Kalyani Nili-Ravi breed with characteristic white markings, docile temperament, and consistent 12 L/day high-SNF milk production.",
    image_url: niliRavi1,
    extra_images: [niliRavi2],
    video_url: galleryVideo4,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T09:00:00.000Z",
  },
  {
    id: "breed-catalog-jaffarabadi",
    stock_code: "BRD-003",
    name: "Jaffarabadi Buffalo",
    breed: "Jaffarabadi",
    subtitle_label: "Jaffarabadi Buffalo (With Calf)",
    price: 145000,
    is_negotiable: true,
    age: "4.5 Years",
    weight: "650 kg",
    milk_yield: "12 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Pregnant (4 Months)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Dewormed",
    description:
      "Heaviest purebred Gir-region Jaffarabadi buffalo featuring a massive body frame, distinctive drooping horn crown, and rich 8.5%+ butterfat milk.",
    image_url: jaffarabadi1,
    extra_images: [jaffarabadi2],
    video_url: galleryVideo2,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T10:00:00.000Z",
  },
  {
    id: "breed-catalog-surti",
    stock_code: "BRD-004",
    name: "Surti Buffalo",
    breed: "Surti",
    subtitle_label: "Surti Buffalo (With Calf)",
    price: 95000,
    is_negotiable: true,
    age: "3.5 Years",
    weight: "450 kg",
    milk_yield: "9 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated",
    description:
      "Compact, economical Surti dairy breed with sickle-shaped horns, low feed maintenance cost, and high-fat creamy milk ideal for dairy farmers.",
    image_url: surti1,
    extra_images: [surti2],
    video_url: galleryVideo3,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T11:00:00.000Z",
  },
  {
    id: "breed-catalog-mehsana",
    stock_code: "BRD-005",
    name: "Mehsana Buffalo",
    breed: "Mehsana",
    subtitle_label: "Mehsana Buffalo (With Calf)",
    price: 105000,
    is_negotiable: true,
    age: "4 Years",
    weight: "500 kg",
    milk_yield: "11 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Milking (Freshly Calved)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Superior cross of Murrah and Surti breeds prized for long lactation persistence, regular breeding cycle, and 11 L/day steady milk yield.",
    image_url: mahesana1,
    extra_images: [mahesana2],
    video_url: galleryVideo4,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T12:00:00.000Z",
  },
  {
    id: "breed-catalog-banni",
    stock_code: "BRD-006",
    name: "Banni Buffalo",
    breed: "Banni",
    subtitle_label: "Banni Buffalo (With Calf)",
    price: 130000,
    is_negotiable: true,
    age: "4.5 Years",
    weight: "540 kg",
    milk_yield: "13 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Pregnant (5 Months)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Famous Kutch-origin Banni buffalo breed prized for 13 L/day high milk yield, climate resilience, strong immunity, and superior genetic vigour.",
    image_url: breedBanni1,
    extra_images: [banni2],
    video_url: galleryVideo5,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T13:00:00.000Z",
  },
  {
    id: "breed-catalog-pandharpuri",
    stock_code: "BRD-007",
    name: "Pandharpuri Buffalo",
    breed: "Pandharpuri",
    subtitle_label: "Pandharpuri Buffalo (Pregnant)",
    price: 92000,
    is_negotiable: true,
    age: "4 Years",
    weight: "480 kg",
    milk_yield: "10 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Pregnant (3 Months)",
    calf_details: "Pregnant",
    health_records: "Vaccinated & Vet Certified",
    description:
      "Pride of Maharashtra with signature long curved horns, hardy constitution, and rich A2 dairy milk suited for commercial and family farms.",
    image_url: pandharpuri1,
    extra_images: [pandharpuri2],
    video_url: galleryVideo6,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T14:00:00.000Z",
  },
  {
    id: "breed-catalog-nagpuri",
    stock_code: "BRD-008",
    name: "Nagpuri Buffalo",
    breed: "Nagpuri",
    subtitle_label: "Nagpuri Buffalo (With Calf)",
    price: 85000,
    is_negotiable: true,
    age: "3.5 Years",
    weight: "460 kg",
    milk_yield: "9 L/day",
    lactation: "1st Lactation",
    location: "",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated",
    description:
      "Traditional Vidarbha & Maharashtra Nagpuri breed known for exceptional heat tolerance, low maintenance, and sweet, thick creamy milk.",
    image_url: nagpuri1,
    extra_images: [nagpuri2],
    video_url: galleryVideo7,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T15:00:00.000Z",
  },
  {
    id: "breed-catalog-bhadawari",
    stock_code: "BRD-009",
    name: "Bhadawari Buffalo",
    breed: "Bhadawari",
    subtitle_label: "Bhadawari Buffalo (With Calf)",
    price: 90000,
    is_negotiable: true,
    age: "4 Years",
    weight: "450 kg",
    milk_yield: "9.5 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Milking",
    calf_details: "With Calf",
    health_records: "Vaccinated & Dewormed",
    description:
      "Copper-toned Bhadawari breed famous across India for the highest butterfat content (up to 12.5% fat), making it the #1 choice for pure ghee production.",
    image_url: bhadawari1,
    extra_images: [bhadawari2],
    video_url: galleryVideo,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T16:00:00.000Z",
  },
  {
    id: "breed-catalog-godavari",
    stock_code: "BRD-010",
    name: "Godavari Buffalo",
    breed: "Godavari",
    subtitle_label: "Godavari Buffalo (With Calf)",
    price: 110000,
    is_negotiable: true,
    age: "4 Years",
    weight: "510 kg",
    milk_yield: "11 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Pregnant (4 Months)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    description:
      "High-yielding Murrah-cross delta Godavari breed prized for long lactation cycles, high disease resistance, and calm milking temperament.",
    image_url: godavari1,
    extra_images: [godavari2],
    video_url: galleryVideo6,
    is_available: true,
    status: "available",
    is_new_stock: false,
    created_at: "2026-10-09T17:00:00.000Z",
  },
];

export function isLegacySampleRecord(item?: {
  id?: string | null;
  name?: string | null;
  description?: string | null;
} | null): boolean {
  if (!item) return false;
  const id = String(item.id || "").toLowerCase();
  const name = String(item.name || "").toLowerCase();
  const desc = String(item.description || "").toLowerCase();
  return (
    id.startsWith("sample-") ||
    /^default-[a-z-]+-\d+$/.test(id) ||
    /\bsample\s*\d+\b/i.test(name) ||
    desc.startsWith("sample listing")
  );
}

const DEFAULT_LACTATIONS_POOL = [
  "2nd Lactation",
  "1st Lactation",
  "2nd Lactation",
  "3rd Lactation",
  "2nd Lactation",
];

const DEFAULT_PREGNANCY_POOL = [
  "Pregnant (3 Months)",
  "Milking (Freshly Calved)",
  "Pregnant (4 Months)",
  "Milking",
  "Pregnant (5 Months)",
];

const DEFAULT_CALF_POOL = [
  "With Calf",
  "With Calf",
  "Pregnant",
  "With Calf",
  "With Female Calf",
];

/**
 * Enriches any database buffalo listing with full Stock / Breed Detail attributes
 * so it can be displayed in both All 10 Buffalo Breeds and New Stocks card grids & detail panels.
 */
export function enrichBuffaloToNewStock(
  raw: Partial<NewStockBuffaloRecord> & { id: string; name?: string; breed?: string; price?: number },
  index = 0
): NewStockBuffaloRecord {
  const defaultNewMatch = DEFAULT_NEW_STOCK_PROFILES.find(
    (d) => d.id === raw.id || (raw.stock_code && d.stock_code === raw.stock_code)
  );
  const defaultBreedMatch = DEFAULT_BREED_CATALOG_PROFILES.find(
    (d) => d.id === raw.id || (raw.stock_code && d.stock_code === raw.stock_code)
  );
  const defaultMatch = defaultNewMatch || defaultBreedMatch;

  const breedName = raw.breed || defaultMatch?.breed || "Murrah";
  const isNewStockItem =
    typeof raw.is_new_stock === "boolean"
      ? raw.is_new_stock
      : Boolean(defaultNewMatch) || String(raw.id || "").startsWith("new-stock-");

  const codePrefix = isNewStockItem ? "AKB" : "BRD";
  const formattedCode =
    raw.stock_code?.trim() ||
    defaultMatch?.stock_code ||
    `${codePrefix}-${String(index + 1).padStart(3, "0")}`;

  // Explicit removal checks (null, "", "none", "__none__")
  const hasExplicitNoVideo =
    raw.video_url === null ||
    raw.video_url === "" ||
    raw.video_url === "none" ||
    raw.video_url === "__none__";

  const videoAsset = hasExplicitNoVideo
    ? null
    : raw.video_url !== undefined
    ? raw.video_url
    : defaultMatch?.video_url !== undefined
    ? defaultMatch.video_url
    : BUFFALO_VIDEO_PRESETS[index % BUFFALO_VIDEO_PRESETS.length].value;

  const hasExplicitNoPhoto1 =
    raw.image_url === "" || raw.image_url === null || raw.image_url === "none";
  const resolvedPhoto1 = hasExplicitNoPhoto1
    ? ""
    : raw.image_url !== undefined
    ? resolveBuffaloImage(
        { id: raw.id, stock_code: formattedCode, breed: breedName, image_url: raw.image_url },
        index,
        breedName
      )
    : defaultMatch?.image_url || getDefaultBreedImagePath(breedName);

  const hasExplicitNoExtraImages =
    (Array.isArray(raw.extra_images) && raw.extra_images.length === 0) ||
    raw.extra_images === null ||
    (raw.extra_images as unknown) === "" ||
    (raw.extra_images as unknown) === "none";
  const resolvedExtraImages = hasExplicitNoExtraImages
    ? []
    : Array.isArray(raw.extra_images) && raw.extra_images.length > 0
    ? raw.extra_images
        .map((img) => resolveBuffaloMediaAsset(img, breedName, 1))
        .filter((x): x is string => Boolean(x))
    : defaultMatch?.extra_images || [];

  return {
    id: raw.id,
    stock_code: formattedCode,
    name:
      raw.name && !isLegacySampleRecord(raw)
        ? raw.name
        : defaultMatch?.name || `${breedName} Buffalo`,
    breed: breedName,
    subtitle_label:
      raw.subtitle_label ||
      defaultMatch?.subtitle_label ||
      (raw.name && !isLegacySampleRecord(raw)
        ? raw.name
        : `${breedName} Buffalo (With Calf)`),
    price: Number(raw.price ?? defaultMatch?.price ?? 105000),
    is_negotiable: raw.is_negotiable ?? defaultMatch?.is_negotiable ?? true,
    age: raw.age || defaultMatch?.age || "4 Years",
    weight: raw.weight || defaultMatch?.weight || "520 kg",
    milk_yield: raw.milk_yield || defaultMatch?.milk_yield || "12 L/day",
    lactation:
      raw.lactation ||
      defaultMatch?.lactation ||
      DEFAULT_LACTATIONS_POOL[index % DEFAULT_LACTATIONS_POOL.length],
    location: "",
    pregnancy_status:
      raw.pregnancy_status ||
      defaultMatch?.pregnancy_status ||
      DEFAULT_PREGNANCY_POOL[index % DEFAULT_PREGNANCY_POOL.length],
    calf_details:
      raw.calf_details ||
      defaultMatch?.calf_details ||
      DEFAULT_CALF_POOL[index % DEFAULT_CALF_POOL.length],
    health_records: raw.health_records || defaultMatch?.health_records || "Vaccinated & Vet Certified",
    description:
      raw.description && !isLegacySampleRecord(raw)
        ? raw.description
        : defaultMatch?.description ??
          "Verified healthy purebred dairy buffalo available at AK Buffaloes Farm with complete health and vaccination records.",
    image_url: resolvedPhoto1,
    extra_images: resolvedExtraImages,
    video_url: videoAsset,
    is_available:
      raw.status === "out_of_stock"
        ? false
        : raw.status === "available" || raw.status === "limited_stock"
        ? true
        : raw.is_available !== false,
    status:
      raw.status ||
      (raw.is_available === false ? "out_of_stock" : "available"),
    is_new_stock: isNewStockItem,
    created_at: raw.created_at || defaultMatch?.created_at || new Date().toISOString(),
  };
}

// ─── Real-Time Cross-Tab & LocalStorage Sync for Buffalo Status & Edits ─────

export const BUFFALO_LIVE_OVERRIDES_KEY = "ak_buffaloes_live_overrides_v1";
export const BUFFALO_LIVE_DELETED_KEY = "ak_buffaloes_live_deleted_v1";
export const BUFFALO_UPDATED_EVENT = "ak-buffaloes-updated";

export function readBuffaloLiveOverrides(): Record<
  string,
  Partial<NewStockBuffaloRecord> & { id: string; updated_at?: string }
> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BUFFALO_LIVE_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function readBuffaloDeletedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(BUFFALO_LIVE_DELETED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.map(String)) : new Set();
  } catch {
    return new Set();
  }
}

export function notifyBuffaloesUpdated(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(BUFFALO_UPDATED_EVENT));
  } catch {
    // ignore event errors
  }
  try {
    if (typeof BroadcastChannel !== "undefined") {
      const bc = new BroadcastChannel("ak_buffaloes_live_sync");
      bc.postMessage({ type: BUFFALO_UPDATED_EVENT, timestamp: Date.now() });
      bc.close();
    }
  } catch {
    // ignore BroadcastChannel errors in unsupported environments
  }
}

export function saveBuffaloLiveOverride(
  record: Partial<NewStockBuffaloRecord> & { id: string }
): void {
  if (typeof window === "undefined" || !record?.id) return;
  try {
    const existing = readBuffaloLiveOverrides();
    const prev = existing[record.id] || {};
    existing[record.id] = {
      ...prev,
      ...record,
      updated_at: new Date().toISOString(),
    };
    window.localStorage.setItem(
      BUFFALO_LIVE_OVERRIDES_KEY,
      JSON.stringify(existing)
    );
    // Ensure it is not in deleted list if re-saved
    const deleted = readBuffaloDeletedIds();
    if (deleted.has(record.id)) {
      deleted.delete(record.id);
      window.localStorage.setItem(
        BUFFALO_LIVE_DELETED_KEY,
        JSON.stringify(Array.from(deleted))
      );
    }
  } catch {
    try {
      // If storage quota exceeded, prune any oversized data URIs (> 100KB) and re-save safely
      const existing = readBuffaloLiveOverrides();
      const cleaned: Record<string, Partial<NewStockBuffaloRecord> & { id: string; updated_at?: string }> = {};
      for (const [k, v] of Object.entries(existing)) {
        const item = { ...v };
        if (typeof item.video_url === "string" && item.video_url.length > 100000) {
          item.video_url = null;
        }
        if (typeof item.image_url === "string" && item.image_url.length > 100000) {
          item.image_url = "";
        }
        cleaned[k] = item;
      }
      cleaned[record.id] = {
        ...cleaned[record.id],
        ...record,
        updated_at: new Date().toISOString(),
      };
      if (typeof cleaned[record.id].video_url === "string" && (cleaned[record.id].video_url as string).length > 100000) {
        cleaned[record.id].video_url = null;
      }
      window.localStorage.setItem(BUFFALO_LIVE_OVERRIDES_KEY, JSON.stringify(cleaned));
    } catch {
      // ignore storage quota errors
    }
  }
  notifyBuffaloesUpdated();
}

export function removeBuffaloLiveOverride(id: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const existing = readBuffaloLiveOverrides();
    delete existing[id];
    window.localStorage.setItem(
      BUFFALO_LIVE_OVERRIDES_KEY,
      JSON.stringify(existing)
    );
    const deleted = readBuffaloDeletedIds();
    deleted.add(id);
    window.localStorage.setItem(
      BUFFALO_LIVE_DELETED_KEY,
      JSON.stringify(Array.from(deleted))
    );
  } catch {
    // ignore storage errors
  }
  notifyBuffaloesUpdated();
}

/**
 * Combines backend DB listings with local live overrides so that status updates
 * (Out of Stock / Limited Stock / In Stock) and edits from Admin Panel reflect
 * immediately on the user side across both tabs ("Explore All 10 Buffalo Breeds" & "New Stocks").
 */
export function mergeDbWithLiveOverrides(
  dbListings: Array<Partial<NewStockBuffaloRecord> & { id: string }>
): Array<Partial<NewStockBuffaloRecord> & { id: string }> {
  const deletedIds = readBuffaloDeletedIds();
  const liveOverrides = readBuffaloLiveOverrides();
  const mergedMap = new Map<
    string,
    Partial<NewStockBuffaloRecord> & { id: string; updated_at?: string }
  >();

  for (const item of dbListings || []) {
    if (!item || !item.id || isLegacySampleRecord(item) || deletedIds.has(item.id)) {
      continue;
    }
    mergedMap.set(item.id, { ...item });
  }

  for (const [id, override] of Object.entries(liveOverrides)) {
    if (!override || !id || isLegacySampleRecord(override) || deletedIds.has(id)) {
      continue;
    }
    const existing = mergedMap.get(id);
    if (!existing) {
      mergedMap.set(id, { ...override, id });
    } else {
      mergedMap.set(id, { ...existing, ...override, id });
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Merges DB buffalo_listings with DEFAULT_BREED_CATALOG_PROFILES (10 Breeds: BRD-001 to BRD-010)
 * so that all 10 Buffalo Breeds use the exact same rich card + right-side detail panel format as New Stocks,
 * with all legacy 5-sample records completely removed and instant status updates applied.
 */
const sortByStockCode = (arr: NewStockBuffaloRecord[]) =>
  arr.slice().sort((a, b) => {
    const numA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
    const numB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
    // Same prefix (both AKB or both BRD) — sort numerically
    const prefixA = (a.stock_code || "").replace(/[0-9-]/g, "");
    const prefixB = (b.stock_code || "").replace(/[0-9-]/g, "");
    if (prefixA === prefixB) return numA - numB;
    // Different prefix — BRD before AKB (catalog first), or keep original order
    return (a.stock_code || "").localeCompare(b.stock_code || "");
  });
export function getMergedBreedCatalog(
  dbListings: Array<Partial<NewStockBuffaloRecord> & { id: string }>
): NewStockBuffaloRecord[] {
  const deletedIds = readBuffaloDeletedIds();
  const cleanDb = mergeDbWithLiveOverrides(dbListings);
  const byId = new Map<string, Partial<NewStockBuffaloRecord> & { id: string }>();
  const byCode = new Map<string, Partial<NewStockBuffaloRecord> & { id: string }>();
  for (const item of cleanDb) {
    byId.set(item.id, item);
    if (item.stock_code) {
      byCode.set(item.stock_code.trim().toUpperCase(), item);
    }
  }

  const results: NewStockBuffaloRecord[] = [];
  const usedIds = new Set<string>();

  // 1. Include all 10 Default Breed Catalog profiles (BRD-001 to BRD-010), merged with any Admin edits
  DEFAULT_BREED_CATALOG_PROFILES.forEach((def, idx) => {
    if (deletedIds.has(def.id)) return;
    const dbOverride =
      byId.get(def.id) || byCode.get(def.stock_code.toUpperCase());
    if (dbOverride) {
      usedIds.add(dbOverride.id);
    }
    usedIds.add(def.id);
    if (dbOverride && dbOverride.is_new_stock === true) {
      return; // Admin moved this record to New Stocks
    }
    const merged = dbOverride
      ? {
          ...def,
          ...dbOverride,
          id: def.id,
          stock_code: dbOverride.stock_code || def.stock_code,
          name: dbOverride.name || def.name,
          subtitle_label: dbOverride.subtitle_label || def.subtitle_label,
          breed: dbOverride.breed || def.breed,
          price: dbOverride.price !== undefined && dbOverride.price !== null ? Number(dbOverride.price) : def.price,
          is_negotiable: dbOverride.is_negotiable !== undefined ? Boolean(dbOverride.is_negotiable) : def.is_negotiable,
          age: dbOverride.age || def.age,
          weight: dbOverride.weight || def.weight,
          milk_yield: dbOverride.milk_yield || def.milk_yield,
          lactation: dbOverride.lactation || def.lactation,
          pregnancy_status: dbOverride.pregnancy_status || def.pregnancy_status,
          calf_details: dbOverride.calf_details || def.calf_details,
          health_records: dbOverride.health_records || def.health_records,
          video_url: dbOverride.video_url !== undefined ? dbOverride.video_url : def.video_url,
          image_url: dbOverride.image_url !== undefined ? dbOverride.image_url : def.image_url,
          extra_images: dbOverride.extra_images !== undefined ? dbOverride.extra_images : def.extra_images,
          description: dbOverride.description !== undefined ? dbOverride.description : def.description,
          is_new_stock: false,
          status:
            dbOverride.status ||
            (dbOverride.is_available === false ? "out_of_stock" : def.status),
          is_available:
            dbOverride.status === "out_of_stock"
              ? false
              : dbOverride.status === "available" ||
                dbOverride.status === "limited_stock"
              ? true
              : dbOverride.is_available ?? def.is_available,
        }
      : def;
    results.push(enrichBuffaloToNewStock(merged, idx));
  });

  // 2. Include any custom Admin-added or Admin-moved breed catalog buffaloes (where is_new_stock === false)
  let customCounter = DEFAULT_BREED_CATALOG_PROFILES.length + 1;
  for (const item of cleanDb) {
    if (usedIds.has(item.id) || deletedIds.has(item.id)) continue;

    if (item.is_new_stock === false) {
      usedIds.add(item.id);
      results.push(
        enrichBuffaloToNewStock(
          {
            ...item,
            stock_code:
              item.stock_code || `BRD-${String(customCounter).padStart(3, "0")}`,
            is_new_stock: false,
          },
          customCounter - 1
        )
      );
      customCounter += 1;
    }
  }

  return sortByStockCode(results);
}

/**
 * Merges DB buffalo_listings with DEFAULT_NEW_STOCK_PROFILES so that:
 * - All 8 curated New Stock arrivals (AKB-001 to AKB-008) are present unless deleted/moved by Admin
 * - Any buffalo added by Admin or toggled as `is_new_stock: true` in Admin Panel appears in New Stocks
 * - Instant status updates (Out of Stock / Limited Stock / In Stock) reflect immediately on the user side
 */
export function getMergedNewStocks(
  dbListings: Array<Partial<NewStockBuffaloRecord> & { id: string }>
): NewStockBuffaloRecord[] {
  const deletedIds = readBuffaloDeletedIds();
  const cleanDb = mergeDbWithLiveOverrides(dbListings);
  const byId = new Map<string, Partial<NewStockBuffaloRecord> & { id: string }>();
  const byCode = new Map<string, Partial<NewStockBuffaloRecord> & { id: string }>();
  for (const item of cleanDb) {
    byId.set(item.id, item);
    if (item.stock_code) {
      byCode.set(item.stock_code.trim().toUpperCase(), item);
    }
  }

  const results: NewStockBuffaloRecord[] = [];
  const usedIds = new Set<string>();

  // 1. Include custom Admin-created or Admin-marked New Stocks first
  let customCounter = DEFAULT_NEW_STOCK_PROFILES.length + 1;
  for (const item of cleanDb) {
    if (deletedIds.has(item.id)) continue;
    const isDefaultNewStock = DEFAULT_NEW_STOCK_PROFILES.some(
      (d) =>
        d.id === item.id ||
        (item.stock_code &&
          d.stock_code.toUpperCase() === item.stock_code.trim().toUpperCase())
    );
    if (isDefaultNewStock) continue;

    const explicitlyMarked = item.is_new_stock === true;
    const isCustomAdded =
      !DEFAULT_BREED_CATALOG_PROFILES.some((d) => d.id === item.id) &&
      item.is_new_stock !== false;

    if (explicitlyMarked || isCustomAdded) {
      usedIds.add(item.id);
      results.push(
        enrichBuffaloToNewStock(
          {
            ...item,
            stock_code:
              item.stock_code || `AKB-${String(customCounter).padStart(3, "0")}`,
            is_new_stock: true,
          },
          customCounter - 1
        )
      );
      customCounter += 1;
    }
  }

  // 2. Include Default New Stock profiles (merged with any Admin edits in DB or live overrides)
  DEFAULT_NEW_STOCK_PROFILES.forEach((def, idx) => {
    if (deletedIds.has(def.id)) return;
    const dbOverride =
      byId.get(def.id) || byCode.get(def.stock_code.toUpperCase());
    if (dbOverride) {
      usedIds.add(dbOverride.id);
    }
    usedIds.add(def.id);
    if (dbOverride && dbOverride.is_new_stock === false) {
      return; // Admin explicitly moved this item to 10 Breeds Catalog
    }
    const merged = dbOverride
      ? {
          ...def,
          ...dbOverride,
          id: def.id,
          stock_code: dbOverride.stock_code || def.stock_code,
          name: dbOverride.name || def.name,
          subtitle_label: dbOverride.subtitle_label || def.subtitle_label,
          breed: dbOverride.breed || def.breed,
          price: dbOverride.price !== undefined && dbOverride.price !== null ? Number(dbOverride.price) : def.price,
          is_negotiable: dbOverride.is_negotiable !== undefined ? Boolean(dbOverride.is_negotiable) : def.is_negotiable,
          age: dbOverride.age || def.age,
          weight: dbOverride.weight || def.weight,
          milk_yield: dbOverride.milk_yield || def.milk_yield,
          lactation: dbOverride.lactation || def.lactation,
          pregnancy_status: dbOverride.pregnancy_status || def.pregnancy_status,
          calf_details: dbOverride.calf_details || def.calf_details,
          health_records: dbOverride.health_records || def.health_records,
          video_url: dbOverride.video_url !== undefined ? dbOverride.video_url : def.video_url,
          image_url: dbOverride.image_url !== undefined ? dbOverride.image_url : def.image_url,
          extra_images: dbOverride.extra_images !== undefined ? dbOverride.extra_images : def.extra_images,
          description: dbOverride.description !== undefined ? dbOverride.description : def.description,
          is_new_stock: true,
          status:
            dbOverride.status ||
            (dbOverride.is_available === false ? "out_of_stock" : def.status),
          is_available:
            dbOverride.status === "out_of_stock"
              ? false
              : dbOverride.status === "available" ||
                dbOverride.status === "limited_stock"
              ? true
              : dbOverride.is_available ?? def.is_available,
        }
      : def;
    results.push(enrichBuffaloToNewStock(merged, idx));
  });

  return sortByStockCode(results);
}
