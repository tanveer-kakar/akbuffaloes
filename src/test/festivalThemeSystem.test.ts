import { describe, it, expect } from "vitest";
import {
  DEFAULT_FESTIVAL_OCCASIONS,
  DEFAULT_FESTIVAL_SETTINGS,
  evaluateFestivalCalendar,
  getISTDateParts,
  mergeOccasionsWithDb,
  resolveOccasionForISTDate,
  type FestivalOccasion,
  type FestivalGlobalSettings,
} from "@/data/festivalCalendarData";

describe("AK Buffaloes — Live Date-Based Automatic Festival Theme System (12 Acceptance Scenarios)", () => {
  it("1. Today is an enabled occasion's date: its theme appears automatically", () => {
    // Test on Independence Day (15 August 2026 at 10:30 AM IST -> 05:00 UTC)
    const aug15Ist = new Date("2026-08-15T05:00:00.000Z");
    const result = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      aug15Ist
    );

    expect(result.istNow.dateStr).toBe("2026-08-15");
    expect(result.activeOccasion).not.toBeNull();
    expect(result.activeOccasion?.id).toBe("occ-independence-day");
    expect(result.activeOccasion?.live_status).toBe("active_today");
  });

  it("2. Today is not an enabled occasion's date: the default theme appears", () => {
    // Pick an ordinary non-festival date (e.g., 2026-07-14 at 12:00 PM IST -> 06:30 UTC)
    const ordinaryDay = new Date("2026-07-14T06:30:00.000Z");
    const result = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      ordinaryDay
    );

    expect(result.istNow.dateStr).toBe("2026-07-14");
    expect(result.activeOccasion).toBeNull();
    expect(result.secondaryOccasions).toHaveLength(0);
  });

  it("3. An occasion is OFF: its theme does not appear, even on its date", () => {
    const republicDayIst = new Date("2027-01-26T06:00:00.000Z");
    const disabledRepublicDay = DEFAULT_FESTIVAL_OCCASIONS.map((occ) =>
      occ.id === "occ-republic-day" ? { ...occ, enabled: false } : occ
    );

    const result = evaluateFestivalCalendar(
      disabledRepublicDay,
      DEFAULT_FESTIVAL_SETTINGS,
      republicDayIst
    );

    expect(result.istNow.dateStr).toBe("2027-01-26");
    expect(result.activeOccasion).toBeNull();
    const repStatus = result.resolvedOccasions.find((o) => o.id === "occ-republic-day");
    expect(repStatus?.live_status).toBe("disabled");
  });

  it("4. The master toggle is OFF: no automatic festival theme appears", () => {
    const diwaliDayIst = new Date("2026-11-08T12:00:00.000Z");
    const masterOffSettings: FestivalGlobalSettings = {
      ...DEFAULT_FESTIVAL_SETTINGS,
      master_enabled: false,
    };

    const result = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      masterOffSettings,
      diwaliDayIst
    );

    expect(result.istNow.dateStr).toBe("2026-11-08");
    expect(result.activeOccasion).toBeNull();
    expect(result.secondaryOccasions).toHaveLength(0);
  });

  it("5. The date changes at midnight in India (Asia/Kolkata): the correct theme is recalculated", () => {
    // 14 Aug 2026 23:58 IST = 14 Aug 2026 18:28 UTC (Before Independence Day)
    const beforeMidnightIST = new Date("2026-08-14T18:28:00.000Z");
    const beforeEval = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      beforeMidnightIST
    );
    expect(beforeEval.istNow.dateStr).toBe("2026-08-14");
    expect(beforeEval.activeOccasion?.id).not.toBe("occ-independence-day");

    // 15 Aug 2026 00:02 IST = 14 Aug 2026 18:32 UTC (Just after midnight in India, even though UTC is still Aug 14!)
    const afterMidnightIST = new Date("2026-08-14T18:32:00.000Z");
    const afterEval = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      afterMidnightIST
    );
    expect(afterEval.istNow.dateStr).toBe("2026-08-15");
    expect(afterEval.activeOccasion?.id).toBe("occ-independence-day");

    // 16 Aug 2026 00:01 IST = 15 Aug 2026 18:31 UTC (Just after Independence Day ends at midnight IST)
    const afterEndIST = new Date("2026-08-15T18:31:00.000Z");
    const endedEval = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      afterEndIST
    );
    expect(endedEval.istNow.dateStr).toBe("2026-08-16");
    expect(endedEval.activeOccasion?.id).not.toBe("occ-independence-day");
  });

  it("6. The year changes from December to January: the annual calendar continues working in 2027, 2028, 2029+", () => {
    // 31 Dec 2026 23:55 IST
    const dec31 = new Date("2026-12-31T18:25:00.000Z");
    const decEval = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      dec31
    );
    expect(decEval.istNow.dateStr).toBe("2026-12-31");

    // 1 Jan 2027 00:05 IST -> New Year's Day 2027 activates automatically
    const jan1_2027 = new Date("2026-12-31T18:35:00.000Z");
    const jan2027Eval = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      jan1_2027
    );
    expect(jan2027Eval.istNow.dateStr).toBe("2027-01-01");
    expect(jan2027Eval.activeOccasion?.id).toBe("occ-new-year");

    // Check Republic Day in 2029 (26 Jan 2029)
    const rep2029 = new Date("2029-01-26T06:00:00.000Z");
    const rep2029Eval = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      rep2029
    );
    expect(rep2029Eval.istNow.dateStr).toBe("2029-01-26");
    expect(rep2029Eval.activeOccasion?.id).toBe("occ-republic-day");
  });

  it("7. A lunar festival date changes next year & unconfirmed future years never reuse old dates", () => {
    // Diwali in 2026 is Nov 8 (2026-11-08), while in 2027 it is Oct 29 (2027-10-29)
    const diwali2026 = new Date("2026-11-08T10:00:00.000Z");
    const eval2026 = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      diwali2026
    );
    expect(eval2026.activeOccasion?.id).toBe("occ-diwali");

    // On Nov 8, 2027, Diwali 2026 date must NOT be reused!
    const nov8_2027 = new Date("2027-11-08T10:00:00.000Z");
    const evalNov8_2027 = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      nov8_2027
    );
    expect(evalNov8_2027.activeOccasion?.id).not.toBe("occ-diwali");

    // On Oct 29, 2027, Diwali 2027 activates properly
    const diwali2027 = new Date("2027-10-29T10:00:00.000Z");
    const eval2027 = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      DEFAULT_FESTIVAL_SETTINGS,
      diwali2027
    );
    expect(eval2027.activeOccasion?.id).toBe("occ-diwali");

    // In 2035 (a future year with no confirmed lunar entry yet), lunar festivals must report 'needs_confirmation'
    const year2035 = getISTDateParts(new Date("2035-10-29T10:00:00.000Z"));
    const diwaliOcc = DEFAULT_FESTIVAL_OCCASIONS.find((o) => o.id === "occ-diwali")!;
    const resolved2035 = resolveOccasionForISTDate(diwaliOcc, year2035);
    expect(resolved2035.resolved_confirmation).toBe("needs_confirmation");
    expect(resolved2035.live_status).toBe("needs_confirmation");
  });

  it("8. Two enabled occasions overlap: configured priority & overlap_display_mode are respected", () => {
    // Create two overlapping enabled occasions on 2026-05-01 (Maharashtra Day vs Eid-ul-Fitr with higher priority 99)
    const customOverlapOccasions: FestivalOccasion[] = DEFAULT_FESTIVAL_OCCASIONS.map((occ) =>
      occ.id === "occ-eid-ul-fitr"
        ? {
            ...occ,
            priority: 99,
            yearly_schedule: {
              ...occ.yearly_schedule,
              "2026": {
                start_date: "2026-05-01",
                end_date: "2026-05-01",
                confirmation_status: "confirmed",
              },
            },
          }
        : occ
    );

    const may1Ist = new Date("2026-05-01T06:00:00.000Z");
    const evalMainPlusSec = evaluateFestivalCalendar(
      customOverlapOccasions,
      { ...DEFAULT_FESTIVAL_SETTINGS, overlap_display_mode: "main_plus_secondary" },
      may1Ist
    );

    expect(evalMainPlusSec.activeOccasion?.id).toBe("occ-eid-ul-fitr");
    expect(evalMainPlusSec.secondaryOccasions.map((o) => o.id)).toContain("occ-maharashtra-day");

    const evalSingleMain = evaluateFestivalCalendar(
      customOverlapOccasions,
      { ...DEFAULT_FESTIVAL_SETTINGS, overlap_display_mode: "single_main" },
      may1Ist
    );
    expect(evalSingleMain.activeOccasion?.id).toBe("occ-eid-ul-fitr");
    expect(evalSingleMain.secondaryOccasions).toHaveLength(0);
  });

  it("9 & 11. Admin changes a toggle, moon-sighting offset, or date: mergeOccasionsWithDb persists and applies changes", () => {
    // Simulate DB record where Eid-ul-Fitr 2026 (2026-03-20 to 2026-03-21) has a +1 day moon-sighting adjustment -> extends to 2026-03-22
    const dbRecords: Partial<FestivalOccasion>[] = [
      {
        id: "occ-eid-ul-fitr",
        moon_offset_days: 1,
        confirmation_status: "confirmed",
      },
    ];

    const merged = mergeOccasionsWithDb(dbRecords);
    const march22Ist = new Date("2026-03-22T06:00:00.000Z");
    const evalMarch22 = evaluateFestivalCalendar(merged, DEFAULT_FESTIVAL_SETTINGS, march22Ist);

    expect(evalMarch22.istNow.dateStr).toBe("2026-03-22");
    expect(evalMarch22.activeOccasion?.id).toBe("occ-eid-ul-fitr");
  });

  it("10. Manual activation (Activate Now) overrides during its window and expires automatically after its end time", () => {
    const manualSettings: FestivalGlobalSettings = {
      ...DEFAULT_FESTIVAL_SETTINGS,
      manual_activation: {
        occasion_id: "occ-diwali",
        activated_at: "2026-06-10T09:30",
        expires_at: "2026-06-10T18:00",
        active: true,
      },
    };

    // During manual activation window (2026-06-10 12:00 IST -> 06:30 UTC)
    const duringManual = new Date("2026-06-10T06:30:00.000Z");
    const evalDuring = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      manualSettings,
      duringManual
    );
    expect(evalDuring.activeOccasion?.id).toBe("occ-diwali");

    // After manual activation expires (2026-06-10 19:00 IST -> 13:30 UTC)
    const afterManualExpiry = new Date("2026-06-10T13:30:00.000Z");
    const evalExpired = evaluateFestivalCalendar(
      DEFAULT_FESTIVAL_OCCASIONS,
      manualSettings,
      afterManualExpiry
    );
    expect(evalExpired.activeOccasion).toBeNull();
  });

  it("12. Annual calendar contains all required categories and separates category from holiday_status", () => {
    const categories = new Set(DEFAULT_FESTIVAL_OCCASIONS.map((o) => o.category));
    expect(categories.has("hindu_festival")).toBe(true);
    expect(categories.has("muslim_festival")).toBe(true);
    expect(categories.has("other_religious")).toBe(true);
    expect(categories.has("national_day")).toBe(true);
    expect(categories.has("regional_day")).toBe(true);
    expect(categories.has("jayanti_anniversary")).toBe(true);
    expect(categories.has("international_day")).toBe(true);

    // Check required notable occasions exist
    const slugs = new Set(DEFAULT_FESTIVAL_OCCASIONS.map((o) => o.slug));
    expect(slugs.has("gandhi-jayanti")).toBe(true);
    expect(slugs.has("ambedkar-jayanti")).toBe(true);
    expect(slugs.has("shivaji-maharaj-jayanti")).toBe(true);
    expect(slugs.has("savitribai-phule-jayanti")).toBe(true);
    expect(slugs.has("independence-day")).toBe(true);
    expect(slugs.has("republic-day")).toBe(true);
    expect(slugs.has("constitution-day")).toBe(true);
    expect(slugs.has("maharashtra-day")).toBe(true);
  });
});
