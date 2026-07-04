import { normalizeUnit } from "../utils/types/units";

describe("normalizeUnit()", () => {
  describe("known aliases", () => {
    it("normalizes weight units", () => {
      expect(normalizeUnit("gram")).toBe("g");
      expect(normalizeUnit("grams")).toBe("g");
      expect(normalizeUnit("kilogram")).toBe("kg");
      expect(normalizeUnit("ounces")).toBe("oz");
      expect(normalizeUnit("pounds")).toBe("lb");
      expect(normalizeUnit("lbs")).toBe("lb");
    });

    it("normalizes volume units", () => {
      expect(normalizeUnit("milliliters")).toBe("ml");
      expect(normalizeUnit("liters")).toBe("l");
      expect(normalizeUnit("cup")).toBe("cup");
      expect(normalizeUnit("cups")).toBe("cup");
      expect(normalizeUnit("tablespoon")).toBe("tbsp");
      expect(normalizeUnit("tablespoons")).toBe("tbsp");
      expect(normalizeUnit("Tbsp")).toBe("tbsp");
      expect(normalizeUnit("teaspoon")).toBe("tsp");
      expect(normalizeUnit("teaspoons")).toBe("tsp");
    });

    it("normalizes discrete units", () => {
      expect(normalizeUnit("piece")).toBe("piece");
      expect(normalizeUnit("pieces")).toBe("piece");
      expect(normalizeUnit("unit")).toBe("piece");
      expect(normalizeUnit("whole")).toBe("piece");
      expect(normalizeUnit("clove")).toBe("clove");
      expect(normalizeUnit("cloves")).toBe("clove");
      expect(normalizeUnit("slice")).toBe("slice");
      expect(normalizeUnit("slices")).toBe("slice");
    });

    it("normalizes packaging units", () => {
      expect(normalizeUnit("can")).toBe("can");
      expect(normalizeUnit("tin")).toBe("can");
      expect(normalizeUnit("package")).toBe("package");
      expect(normalizeUnit("pack")).toBe("package");
      expect(normalizeUnit("jar")).toBe("jar");
    });

    it("normalizes empty string to 'piece'", () => {
      expect(normalizeUnit("")).toBe("piece");
    });

    it("trims whitespace before lookup", () => {
      expect(normalizeUnit("  gram  ")).toBe("g");
      expect(normalizeUnit("  cup  ")).toBe("cup");
    });
  });

  describe("unknown units (fallback behaviour - line 63)", () => {
    it("lowercases and trims unknown units", () => {
      expect(normalizeUnit("HANDFUL")).toBe("handful");
      expect(normalizeUnit("  WeirdUnit  ")).toBe("weirdunit");
      expect(normalizeUnit("CUSTOM_UNIT")).toBe("custom_unit");
    });

    it("returns lowercased string for completely unknown unit", () => {
      expect(normalizeUnit("ZORK")).toBe("zork");
    });
  });
});
