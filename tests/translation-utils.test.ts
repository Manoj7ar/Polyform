import { describe, expect, it } from "vitest";

import { applyTranslatedUnits, extractTranslatableUnits } from "@/components/blocks/translation-utils";

describe("translation utils", () => {
  it("extracts and applies document units", () => {
    const source = { paragraphs: ["Hello", "World"], format: { bold: true } };
    const units = extractTranslatableUnits("document", source);
    expect(units).toEqual(["Hello", "World"]);

    const translated = applyTranslatedUnits("document", source, ["Hola", "Mundo"]);
    expect(translated).toEqual({ paragraphs: ["Hola", "Mundo"], format: { bold: true } });
  });
});
