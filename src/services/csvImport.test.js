import {
  buildChildrenCsvTemplate,
  buildSupportWorkersCsvTemplate,
  validateChildrenCsv,
  validateSupportWorkersCsv,
} from "./csvImport";

describe("csvImport", () => {
  test("validates and maps a children CSV with name-based incompatibilities", () => {
    const csv = [
      "nom,age,ratioMax,incompatiblesEnfants,incompatiblesAccos,tags,id",
      "Lea M.,7,2,Tom B.;Jade R.,Marie F.,Calm;Visual,e1",
      "Tom B.,8,3,,,Needs break;Needs break,",
      "Jade R.,8,1,Lea M.,,,",
    ].join("\n");

    const result = validateChildrenCsv(csv, [{ id: "a1", nom: "Marie F." }]);

    expect(result.errors).toEqual([]);
    expect(result.validCount).toBe(3);
    expect(result.items).toEqual([
      {
        id: "e1",
        nom: "Lea M.",
        age: 7,
        ratioMax: 2,
        tags: ["Calm", "Visual"],
        incompatiblesEnfants: ["e_import_2", "e_import_3"],
        incompatiblesAccos: ["a1"],
      },
      {
        id: "e_import_2",
        nom: "Tom B.",
        age: 8,
        ratioMax: 3,
        tags: ["Needs break"],
        incompatiblesEnfants: [],
        incompatiblesAccos: [],
      },
      {
        id: "e_import_3",
        nom: "Jade R.",
        age: 8,
        ratioMax: 1,
        tags: [],
        incompatiblesEnfants: ["e1"],
        incompatiblesAccos: [],
      },
    ]);
  });

  test("blocks children import when required columns are missing", () => {
    const csv = [
      "nom,age,incompatiblesEnfants",
      "Lea M.,7,Tom B.",
    ].join("\n");

    const result = validateChildrenCsv(csv, []);

    expect(result.validCount).toBe(0);
    expect(result.errors.some((error) => error.message.includes("ratioMax"))).toBe(true);
  });

  test("blocks children import with duplicate names or unresolved references", () => {
    const csv = [
      "nom,age,ratioMax,incompatiblesEnfants,incompatiblesAccos",
      "Lea M.,7,2,Tom B.,Missing aide",
      "Lea M.,8,2,,",
      "Tom B.,7,2,Unknown child,",
    ].join("\n");

    const result = validateChildrenCsv(csv, [{ id: "a1", nom: "Marie F." }]);

    expect(result.validCount).toBe(0);
    expect(result.errors.some((error) => error.message.toLowerCase().includes("duplicate name"))).toBe(true);
    expect(result.errors.some((error) => error.message.includes("Unknown child"))).toBe(true);
    expect(result.errors.some((error) => error.message.includes("Unknown aide"))).toBe(true);
  });

  test("validates support workers with free-text tags", () => {
    const csv = [
      "nom,tags,id",
      "Marie F.,TSA;Morning routine,a1",
      "Pierre G.,Sensory;sensory,a2",
    ].join("\n");

    const result = validateSupportWorkersCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.validCount).toBe(2);
    expect(result.items).toEqual([
      { id: "a1", nom: "Marie F.", tags: ["TSA", "Morning routine"] },
      { id: "a2", nom: "Pierre G.", tags: ["Sensory"] },
    ]);
  });

  test("builds non-empty CSV templates", () => {
    expect(buildChildrenCsvTemplate().startsWith("nom,age,ratioMax")).toBe(true);
    expect(buildSupportWorkersCsvTemplate().startsWith("nom,tags")).toBe(true);
  });
});
