import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { GroupsTab } from "./GroupsTab";
import { createTranslator } from "../../app/i18n";

jest.mock("../../services/groupsDataService", () => ({
  groupsDataService: {
    listGroupSnapshots: jest.fn(),
    saveGroupSnapshot: jest.fn(),
    restoreGroupSnapshot: jest.fn(),
    deleteGroupSnapshot: jest.fn(),
  },
}));

const { groupsDataService: mockGroupsDataService } = require("../../services/groupsDataService");

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("GroupsTab snapshots", () => {
  let container;
  let root;

  const t = createTranslator("en");

  const renderTab = (props = {}) => {
    const defaultProps = {
      groups: [],
      setGroups: jest.fn(),
      children: [],
      supportWorkers: [],
      t,
      emptyStateMessage: "",
      onResetGroups: jest.fn(),
    };

    act(() => {
      root.render(<GroupsTab {...defaultProps} {...props} />);
    });

    return defaultProps;
  };

  const flush = async (times = 1) => {
    for (let i = 0; i < times; i += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  };

  const clickButton = (label) => {
    const button = [...container.querySelectorAll("button")].find((entry) => entry.textContent.includes(label));
    expect(button).toBeTruthy();
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  const setFieldValue = (selector, value) => {
    const field = container.querySelector(selector);
    expect(field).toBeTruthy();
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(field.constructor.prototype, "value").set;
      valueSetter.call(field, value);
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    });
  };

  beforeEach(() => {
    mockGroupsDataService.listGroupSnapshots.mockReset();
    mockGroupsDataService.saveGroupSnapshot.mockReset();
    mockGroupsDataService.restoreGroupSnapshot.mockReset();
    mockGroupsDataService.deleteGroupSnapshot.mockReset();

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.restoreAllMocks();
  });

  test("saves a snapshot and refreshes snapshot list", async () => {
    mockGroupsDataService.listGroupSnapshots
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "s1", name: "Morning setup" }]);
    mockGroupsDataService.saveGroupSnapshot.mockResolvedValue({
      status: "created",
      id: "s1",
      name: "Morning setup",
    });

    renderTab();
    await flush(2);

    setFieldValue('[data-testid="snapshot-name-input"]', "Morning setup");
    clickButton("Save snapshot");
    await flush(3);

    expect(mockGroupsDataService.saveGroupSnapshot).toHaveBeenCalledWith({
      name: "Morning setup",
      groups: [],
      overwrite: false,
    });

    const select = container.querySelector('[data-testid="snapshot-select"]');
    expect(select.textContent.includes("Morning setup")).toBe(true);
  });

  test("confirms overwrite when snapshot name already exists", async () => {
    mockGroupsDataService.listGroupSnapshots.mockResolvedValue([{ id: "s1", name: "Baseline" }]);
    mockGroupsDataService.saveGroupSnapshot.mockResolvedValue({
      status: "updated",
      id: "s1",
      name: "Baseline",
    });

    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    renderTab();
    await flush(2);

    setFieldValue('[data-testid="snapshot-name-input"]', " baseline ");
    clickButton("Save snapshot");
    await flush(2);

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockGroupsDataService.saveGroupSnapshot).toHaveBeenCalledWith({
      name: "baseline",
      groups: [],
      overwrite: true,
    });

    window.confirm = originalConfirm;
  });

  test("restores a snapshot and sanitizes stale references", async () => {
    mockGroupsDataService.listGroupSnapshots.mockResolvedValue([{ id: "s1", name: "Baseline" }]);
    mockGroupsDataService.restoreGroupSnapshot.mockResolvedValue({
      id: "s1",
      name: "Baseline",
      groups: [
        {
          id: "g1",
          nom: "G1",
          ageMin: 7,
          ageMax: 8,
          responsableId: "aX",
          enfantIds: ["e1", "eX"],
          accoIds: ["a1", "aX"],
          sousgroupes: [
            { id: "sg1", accoId: "a1", enfantIds: ["e1", "eX"] },
            { id: "sg2", accoId: "aX", enfantIds: ["e1"] },
          ],
        },
      ],
    });

    const setGroups = jest.fn();
    const initialChildren = [{ id: "e1", nom: "Child 1", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] }];
    const initialSupportWorkers = [{ id: "a1", nom: "Aide 1", specialites: [] }];

    renderTab({
      setGroups,
      children: initialChildren,
      supportWorkers: initialSupportWorkers,
    });
    await flush(2);

    clickButton("Restore snapshot");
    await flush(2);

    expect(mockGroupsDataService.restoreGroupSnapshot).toHaveBeenCalledWith("s1");
    expect(setGroups).toHaveBeenCalledWith([
      {
        id: "g1",
        nom: "G1",
        ageMin: 7,
        ageMax: 8,
        responsableId: "",
        enfantIds: ["e1"],
        accoIds: ["a1"],
        sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["e1"] }],
      },
    ]);
    expect(initialChildren).toEqual([{ id: "e1", nom: "Child 1", age: 8, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: [] }]);
    expect(initialSupportWorkers).toEqual([{ id: "a1", nom: "Aide 1", specialites: [] }]);
  });

  test("deletes selected snapshot after confirmation", async () => {
    mockGroupsDataService.listGroupSnapshots
      .mockResolvedValueOnce([{ id: "s1", name: "Baseline" }])
      .mockResolvedValueOnce([]);
    mockGroupsDataService.deleteGroupSnapshot.mockResolvedValue(undefined);

    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    renderTab();
    await flush(2);

    clickButton("Delete snapshot");
    await flush(2);

    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(mockGroupsDataService.deleteGroupSnapshot).toHaveBeenCalledWith("s1");

    window.confirm = originalConfirm;
  });
});
