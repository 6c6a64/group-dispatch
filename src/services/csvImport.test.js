import {
  buildChildrenCsvTemplate,
  buildSupportWorkersCsvTemplate,
  validateChildrenCsv,
  validateSupportWorkersCsv,
} from "./csvImport";

describe("csvImport", () => {
  test("validates and maps a children CSV with name-based incompatibilities", () => {
    const csv = [
      "nom,age,ratioMax,incompatiblesEnfants,incompatiblesAccos,id",
      "Lea M.,7,2,Tom B.;Jade R.,Marie F.,e1",
      "Tom B.,8,3,,,",
      "Jade R.,8,1,Lea M.,,",
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
        incompatiblesEnfants: ["e_import_2", "e_import_3"],
        incompatiblesAccos: ["a1"],
      },
      {
        id: "e_import_2",
        nom: "Tom B.",
        age: 8,
        ratioMax: 3,
        incompatiblesEnfants: [],
        incompatiblesAccos: [],
      },
      {
        id: "e_import_3",
        nom: "Jade R.",
        age: 8,
        ratioMax: 1,
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

  test("validates support workers and blocks unknown specialties", () => {
    const csv = [
      "nom,specialites,id",
      "Marie F.,TSA;TDAH,a1",
      "Pierre G.,Unknown specialty,a2",
    ].join("\n");

    const result = validateSupportWorkersCsv(csv);

    expect(result.validCount).toBe(0);
    expect(result.errors.some((error) => error.message.includes("Unknown speciality"))).toBe(true);
  });

  test("builds non-empty CSV templates", () => {
    expect(buildChildrenCsvTemplate().startsWith("nom,age,ratioMax")).toBe(true);
    expect(buildSupportWorkersCsvTemplate().startsWith("nom,specialites")).toBe(true);
  });
});
