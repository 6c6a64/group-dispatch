import { buildStateFromRows, mapStateToRows } from "./groupsDataService";

describe("groupsDataService tags mapping", () => {
  test("round-trips children and aide tags, with legacy aide specialties fallback", () => {
    const state = {
      children: [
        {
          id: "e1",
          nom: "Child 1",
          age: 8,
          ratioMax: 2,
          tags: ["Calm", "calm", "Visual support"],
          incompatiblesEnfants: [],
          incompatiblesAccos: ["a1"],
        },
      ],
      supportWorkers: [
        { id: "a1", nom: "Aide 1", tags: ["TSA", "tsa", "Morning routine"] },
        { id: "a2", nom: "Aide 2", specialites: ["Legacy tag"] },
      ],
      groups: [
        {
          id: "g1",
          nom: "Group 1",
          ageMin: 7,
          ageMax: 10,
          responsableId: "a1",
          enfantIds: ["e1"],
          accoIds: ["a1", "a2"],
          sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["e1"] }],
        },
      ],
    };

    const rows = mapStateToRows(state);

    expect(rows.enfantsTagsRows).toEqual([
      { enfant_id: "e1", tag: "Calm", position: 0 },
      { enfant_id: "e1", tag: "Visual support", position: 1 },
    ]);

    expect(rows.accoSpecialitesRows).toEqual([
      { acco_id: "a1", specialite: "TSA", position: 0 },
      { acco_id: "a1", specialite: "Morning routine", position: 1 },
      { acco_id: "a2", specialite: "Legacy tag", position: 0 },
    ]);

    const rebuilt = buildStateFromRows({
      ...rows,
      accosRows: rows.accosRows,
      accoSpecialitesRows: rows.accoSpecialitesRows,
      enfantsRows: rows.enfantsRows,
      enfantsTagsRows: rows.enfantsTagsRows,
      incompatEnfantsRows: rows.incompatEnfantsRows,
      incompatAccosRows: rows.incompatAccosRows,
      groupesRows: rows.groupesRows,
      groupesAccosRows: rows.groupesAccosRows,
      groupesEnfantsRows: rows.groupesEnfantsRows,
      sousgroupesRows: rows.sousgroupesRows,
      sousgroupesEnfantsRows: rows.sousgroupesEnfantsRows,
    });

    expect(rebuilt.children).toEqual([
      {
        id: "e1",
        nom: "Child 1",
        age: 8,
        ratioMax: 2,
        tags: ["Calm", "Visual support"],
        incompatiblesEnfants: [],
        incompatiblesAccos: ["a1"],
      },
    ]);

    expect(rebuilt.supportWorkers).toEqual([
      { id: "a1", nom: "Aide 1", tags: ["TSA", "Morning routine"] },
      { id: "a2", nom: "Aide 2", tags: ["Legacy tag"] },
    ]);
  });
});
