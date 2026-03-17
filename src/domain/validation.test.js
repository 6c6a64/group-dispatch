import { createTranslator } from "../app/i18n";
import { validerGroupe, validerSousGroupe } from "./validation";

const t = createTranslator("en");

describe("validation", () => {
  test("detects ratio and incompatibilities in subgroup", () => {
    const children = [
      { id: "e1", nom: "A", age: 8, ratioMax: 1, incompatiblesEnfants: ["e2"], incompatiblesAccos: [] },
      { id: "e2", nom: "B", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: ["a1"] },
    ];
    const supportWorkers = [{ id: "a1", nom: "Acco 1", tags: [] }];
    const sg = { id: "sg1", accoId: "a1", enfantIds: ["e1", "e2"] };

    const conflicts = validerSousGroupe(sg, null, children, supportWorkers, t);

    const types = conflicts.map((c) => c.type);
    expect(types).toContain("ratio");
    expect(types).toContain("enfant");
    expect(types).toContain("acco");
  });

  test("detects age and unassigned children at group level", () => {
    const children = [
      { id: "e1", nom: "A", age: 6, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] },
      { id: "e2", nom: "B", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] },
    ];
    const supportWorkers = [{ id: "a1", nom: "Acco 1", tags: [] }];

    const groupe = {
      id: "g1",
      nom: "G1",
      ageMin: 7,
      ageMax: 9,
      responsableId: "a1",
      enfantIds: ["e1", "e2"],
      accoIds: ["a1"],
      sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["e2"] }],
    };

    const conflicts = validerGroupe(groupe, children, supportWorkers, t);

    const types = conflicts.map((c) => c.type);
    expect(types).toContain("age");
    expect(types).toContain("nonassigne");
  });
});
