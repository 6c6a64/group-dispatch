import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { SupportWorkersTab } from "./SupportWorkersTab";
import { createTranslator } from "../../app/i18n";

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("SupportWorkersTab import CSV", () => {
  let container;
  let root;
  const t = createTranslator("en");

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

  const uploadCsv = async (csvText) => {
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = new File(["placeholder"], "aides.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      configurable: true,
      value: jest.fn(async () => csvText),
    });

    await act(async () => {
      Object.defineProperty(input, "files", {
        configurable: true,
        value: [file],
      });
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    window.localStorage.clear();
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

  test("applies valid support workers import and sanitizes groups", async () => {
    const setSupportWorkers = jest.fn();
    const setGroups = jest.fn();
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    const groups = [
      {
        id: "g1",
        nom: "G1",
        ageMin: 7,
        ageMax: 9,
        responsableId: "oldA",
        enfantIds: ["e1"],
        accoIds: ["oldA"],
        sousgroupes: [{ id: "sg1", accoId: "oldA", enfantIds: ["e1"] }],
      },
    ];

    act(() => {
      root.render(
        <SupportWorkersTab
          supportWorkers={[{ id: "oldA", nom: "Old Aide", specialites: [] }]}
          setSupportWorkers={setSupportWorkers}
          groups={groups}
          setGroups={setGroups}
          children={[{
            id: "e1",
            nom: "Child 1",
            age: 7,
            ratioMax: 2,
            incompatiblesEnfants: [],
            incompatiblesAccos: [],
          }]}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    const csv = [
      "nom,specialites,id",
      "Marie F.,TSA;TDAH,a1",
    ].join("\n");

    await uploadCsv(csv);
    await flush(2);
    clickButton("Apply import");
    await flush(2);

    expect(setSupportWorkers).toHaveBeenCalledWith([
      { id: "a1", nom: "Marie F.", specialites: ["TSA", "TDAH"] },
    ]);

    expect(setGroups).toHaveBeenCalledWith([
      {
        id: "g1",
        nom: "G1",
        ageMin: 7,
        ageMax: 9,
        responsableId: "",
        enfantIds: ["e1"],
        accoIds: [],
        sousgroupes: [],
      },
    ]);

    window.confirm = originalConfirm;
  });
});
