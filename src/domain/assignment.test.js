import { createTranslator } from "../app/i18n";
import { repartirAuto, repartirGlobal, resetSubgroupCounter } from "./assignment";

const t = createTranslator("en");

describe("assignment", () => {
  beforeEach(() => {
    resetSubgroupCounter();
  });

  test("repartirAuto places compatible children", () => {
    const children = [
      { id: "e1", nom: "A", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] },
      { id: "e2", nom: "B", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] },
    ];
    const supportWorkers = [{ id: "a1", nom: "Acco 1", specialites: [] }];
    const groupe = {
      id: "g1",
      nom: "G1",
      ageMin: 7,
      ageMax: 9,
      responsableId: "a1",
      enfantIds: ["e1", "e2"],
      accoIds: ["a1"],
      sousgroupes: [],
    };

    const result = repartirAuto(groupe, children, supportWorkers, t);

    expect(result.ok).toBe(true);
    expect(result.nonPlaces.length).toBe(0);
    expect(result.sousgroupes.length).toBe(1);
    expect(result.sousgroupes[0].enfantIds.sort()).toEqual(["e1", "e2"]);
  });

  test("repartirAuto keeps non-placeable child with reasons", () => {
    const children = [
      { id: "e1", nom: "A", age: 8, ratioMax: 1, incompatiblesEnfants: [], incompatiblesAccos: [] },
      { id: "e2", nom: "B", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] },
    ];
    const supportWorkers = [{ id: "a1", nom: "Acco 1", specialites: [] }];
    const groupe = {
      id: "g1",
      nom: "G1",
      ageMin: 7,
      ageMax: 9,
      responsableId: "a1",
      enfantIds: ["e1", "e2"],
      accoIds: ["a1"],
      sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["e1"] }],
    };

    const result = repartirAuto(groupe, children, supportWorkers, t, groupe.sousgroupes);

    expect(result.ok).toBe(false);
    expect(result.nonPlaces.length).toBe(1);
    expect(result.nonPlaces[0].enfant.id).toBe("e2");
    expect(result.nonPlaces[0].raisons.length).toBeGreaterThan(0);
  });

  test("repartirGlobal reports child when no group age range fits", () => {
    const children = [{ id: "e1", nom: "A", age: 5, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] }];
    const supportWorkers = [{ id: "a1", nom: "Acco 1", specialites: [] }];
    const groups = [{
      id: "g1",
      nom: "G1",
      ageMin: 7,
      ageMax: 9,
      responsableId: "a1",
      enfantIds: [],
      accoIds: ["a1"],
      sousgroupes: [],
    }];

    const result = repartirGlobal(groups, children, supportWorkers, "tout", t);

    expect(result.nonPlaces.length).toBe(1);
    expect(result.nonPlaces[0].enfant.id).toBe("e1");
  });
});
