import { describe, it, expect } from "vitest";
import { generateLocalAiReply } from "@/lib/aiAssistant";
import { BUFFALO_BREEDS, getBuffaloSliderImages } from "@/data/buffaloBreedsData";

describe("AK Buffaloes AI Assistant Knowledge Engine", () => {
  it("answers questions about founders Akil Bhai and Salim Bhai", () => {
    const res = generateLocalAiReply("Who is Akil Bhai?");
    expect(res.text).toContain("Akil Bhai");
    expect(res.text).toContain("Salim Bhai");
    expect(res.quickActions?.some((a) => a.url === "/about")).toBe(true);
  });

  it("answers questions about highest milk yield", () => {
    const res = generateLocalAiReply("Which breed gives the highest milk?");
    expect(res.text).toContain("Murrah");
    expect(res.text).toContain("10 to 14+ Litres");
    expect(res.quickActions?.some((a) => a.url === "/buffaloes/murrah")).toBe(true);
  });

  it("answers questions about buffalo prices", () => {
    const res = generateLocalAiReply("What are the prices of buffaloes?");
    expect(res.text).toContain("₹70,000");
    expect(res.text).toContain("₹2,00,000");
    expect(res.text).toContain("Murrah");
  });

  it("answers questions about farm location and visiting", () => {
    const res = generateLocalAiReply("Where is your farm located in Pachora Jalgaon?");
    expect(res.text).toContain("Pachora");
    expect(res.text).toContain("Jalgaon");
    expect(res.quickActions?.some((a) => a.url === "/contact")).toBe(true);
  });

  it("answers questions about live milking verification", () => {
    const res = generateLocalAiReply("Can I test live milking before buying?");
    expect(res.text).toContain("Live Milking Test");
    expect(res.text).toContain("6:00 AM");
  });

  it("answers questions about feed, nutrition, and diet", () => {
    const res = generateLocalAiReply("What fodder should I feed my buffalo?");
    expect(res.text).toContain("Green Fodder");
    expect(res.text).toContain("Dry Fodder");
    expect(res.text).toContain("Concentrate Feed");
  });

  it("answers questions about mastitis (thanela disease)", () => {
    const res = generateLocalAiReply("How to treat Thanela disease?");
    expect(res.text).toContain("Mastitis");
    expect(res.text).toContain("Teat Dipping");
  });

  it("answers questions about account creation and email OTP", () => {
    const res = generateLocalAiReply("How to create account with email OTP?");
    expect(res.text).toContain("How to Create an Account");
    expect(res.text).toContain("6-digit OTP");
    expect(res.text).toContain("15 minutes");
    expect(res.quickActions?.some((a) => a.url === "/register")).toBe(true);
  });

  it("answers questions about password reset and security", () => {
    const res = generateLocalAiReply("How to reset forgot password and what about real password?");
    expect(res.text).toContain("Password & Account Security");
    expect(res.text).toContain("8 characters");
    expect(res.text).toContain("real password");
    expect(res.quickActions?.some((a) => a.url === "/forgot-password")).toBe(true);
  });

  it("answers questions about user dashboard and 7 modules", () => {
    const res = generateLocalAiReply("Tell me about user dashboard sections");
    expect(res.text).toContain("User Dashboard");
    expect(res.text).toContain("7 Core Modules");
    expect(res.text).toContain("/dashboard/my-inquiries");
    expect(res.quickActions?.some((a) => a.url === "/dashboard")).toBe(true);
  });

  it("answers questions about operations analytics and KPIs", () => {
    const res = generateLocalAiReply("Show user operations analytics and KPI metrics");
    expect(res.text).toContain("Operations Analytics");
    expect(res.text).toContain("Total Inquiries");
    expect(res.text).toContain("Pending Review");
    expect(res.text).toContain("Estimated Deal Value");
    expect(res.quickActions?.some((a) => a.url === "/dashboard")).toBe(true);
  });

  it("answers questions about inquiry lifecycle tracking", () => {
    const res = generateLocalAiReply("How to track inquiry and what is inquiry status lifecycle?");
    expect(res.text).toContain("5-Stage Inquiry Lifecycle");
    expect(res.text).toContain("Pending");
    expect(res.text).toContain("Accepted");
    expect(res.text).toContain("Confirmed");
    expect(res.text).toContain("Completed");
    expect(res.quickActions?.some((a) => a.url === "/dashboard/my-inquiries")).toBe(true);
  });

  it("provides personalized response when user is logged in", () => {
    const res = generateLocalAiReply("Who am I and am I logged in now?", {
      isLoggedIn: true,
      userName: "Ramesh Patil",
      userEmail: "ramesh@example.com",
      role: "user",
      inquiriesCount: 3,
      confirmedCount: 1,
    });
    expect(res.text).toContain("LOGGED IN");
    expect(res.text).toContain("Ramesh Patil");
    expect(res.text).toContain("ramesh@example.com");
    expect(res.quickActions?.some((a) => a.url === "/dashboard")).toBe(true);
  });

  it("supports all 10 buffalo breeds with 2 distinct slider images per sample (2 photos per buffalo)", () => {
    expect(BUFFALO_BREEDS).toHaveLength(10);
    for (const breed of BUFFALO_BREEDS) {
      expect(breed.sampleProfiles).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        const sliderImages = getBuffaloSliderImages(
          {
            id: `sample-${breed.slug}-${i + 1}`,
            name: `${breed.name} Sample ${i + 1}`,
            breed: breed.name,
            image_url: breed.photoPaths[i],
          },
          i,
          breed.slug
        );
        expect(sliderImages).toHaveLength(2);
        expect(new Set(sliderImages).size).toBe(2);
      }
    }
  });
});

