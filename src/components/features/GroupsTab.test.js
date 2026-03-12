import { moveChildBetweenGroups } from "./GroupsTab";

const baseGroupes = [
  {
    id: "g1",
    nom: "G1",
    ageMin: 7,
    ageMax: 10,
    responsableId: "a1",
    enfantIds: ["e1", "e2"],
    accoIds: ["a1", "a2"],
    sousgroupes: [
      { id: "sg1", accoId: "a1", enfantIds: ["e1"] },
      { id: "sg2", accoId: "a2", enfantIds: ["e2"] },
    ],
  },
  {
    id: "g2",
    nom: "G2",
    ageMin: 7,
    ageMax: 10,
    responsableId: "a3",
    enfantIds: [],
    accoIds: ["a3"],
    sousgroupes: [{ id: "sg3", accoId: "a3", enfantIds: [] }],
  },
];

describe("moveChildBetweenGroups", () => {
  test("removes child from group when dropped to non assigned", () => {
    const next = moveChildBetweenGroups(baseGroupes, "e1", "g1", "sg1", "__nonplaces__", null);

    expect(next[0].enfantIds).toEqual(["e2"]);
    expect(next[0].sousgroupes[0].enfantIds).toEqual([]);
  });

  test("moves child from subgroup to another group", () => {
    const next = moveChildBetweenGroups(baseGroupes, "e1", "g1", "sg1", "g2", "sg3");

    expect(next[0].enfantIds).toEqual(["e2"]);
    expect(next[0].sousgroupes[0].enfantIds).toEqual([]);
    expect(next[1].enfantIds).toEqual(["e1"]);
    expect(next[1].sousgroupes[0].enfantIds).toEqual(["e1"]);
  });

  test("keeps group membership for same-group subgroup move", () => {
    const next = moveChildBetweenGroups(baseGroupes, "e1", "g1", "sg1", "g1", "sg2");

    expect(next[0].enfantIds.sort()).toEqual(["e1", "e2"]);
    expect(next[0].sousgroupes[0].enfantIds).toEqual([]);
    expect(next[0].sousgroupes[1].enfantIds.sort()).toEqual(["e1", "e2"]);
  });
});
