import { sanitizeGroupsSnapshot } from "./groupSnapshots";

describe("sanitizeGroupsSnapshot", () => {
  test("removes stale child and aide references", () => {
    const children = [
      { id: "e1" },
      { id: "e2" },
    ];
    const supportWorkers = [
      { id: "a1" },
    ];

    const snapshotGroups = [
      {
        id: "g1",
        nom: "Group 1",
        ageMin: 7,
        ageMax: 8,
        responsableId: "a2",
        enfantIds: ["e1", "eX"],
        accoIds: ["a1", "a2"],
        sousgroupes: [
          { id: "sg1", accoId: "a1", enfantIds: ["e1", "eX"] },
          { id: "sg2", accoId: "a2", enfantIds: ["e1"] },
        ],
      },
    ];

    const sanitized = sanitizeGroupsSnapshot(snapshotGroups, children, supportWorkers);

    expect(sanitized.groups).toEqual([
      {
        id: "g1",
        nom: "Group 1",
        ageMin: 7,
        ageMax: 8,
        responsableId: "",
        enfantIds: ["e1"],
        accoIds: ["a1"],
        sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["e1"] }],
      },
    ]);
    expect(sanitized.removedCount).toBeGreaterThan(0);
  });

  test("keeps valid snapshot untouched", () => {
    const children = [{ id: "e1" }];
    const supportWorkers = [{ id: "a1" }];

    const snapshotGroups = [
      {
        id: "g1",
        nom: "Group 1",
        ageMin: 7,
        ageMax: 8,
        responsableId: "a1",
        enfantIds: ["e1"],
        accoIds: ["a1"],
        sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["e1"] }],
      },
    ];

    const sanitized = sanitizeGroupsSnapshot(snapshotGroups, children, supportWorkers);

    expect(sanitized.groups).toEqual(snapshotGroups);
    expect(sanitized.removedCount).toBe(0);
  });
});
