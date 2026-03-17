import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ChildrenTab } from "./ChildrenTab";
import { createTranslator } from "../../app/i18n";

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("ChildrenTab import CSV", () => {
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

    const file = new File(["placeholder"], "children.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      configurable: true,
      value: jest.fn(async () => csvText),
    });

    await act(async () => {
      input.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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

  test("applies valid children import and sanitizes groups", async () => {
    const setChildren = jest.fn();
    const setGroups = jest.fn();
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    const groups = [
      {
        id: "g1",
        nom: "G1",
        ageMin: 7,
        ageMax: 9,
        responsableId: "a1",
        enfantIds: ["legacy"],
        accoIds: ["a1"],
        sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: ["legacy"] }],
      },
    ];

    act(() => {
      root.render(
        <ChildrenTab
          children={[]}
          setChildren={setChildren}
          supportWorkers={[{ id: "a1", nom: "Marie F.", tags: [] }]}
          groups={groups}
          setGroups={setGroups}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    const csv = [
      "nom,age,ratioMax,incompatiblesEnfants,incompatiblesAccos,tags,id",
      "Lea M.,7,2,,,Calm;Visual,e1",
      "Tom B.,8,3,Lea M.,Marie F.,Needs break,e2",
    ].join("\n");

    await uploadCsv(csv);
    await flush(2);
    clickButton("Apply import");
    await flush(2);

    expect(setChildren).toHaveBeenCalledWith([
      {
        id: "e1",
        nom: "Lea M.",
        age: 7,
        ratioMax: 2,
        tags: ["Calm", "Visual"],
        incompatiblesEnfants: [],
        incompatiblesAccos: [],
      },
      {
        id: "e2",
        nom: "Tom B.",
        age: 8,
        ratioMax: 3,
        tags: ["Needs break"],
        incompatiblesEnfants: ["e1"],
        incompatiblesAccos: ["a1"],
      },
    ]);

    expect(setGroups).toHaveBeenCalledWith([
      {
        id: "g1",
        nom: "G1",
        ageMin: 7,
        ageMax: 9,
        responsableId: "a1",
        enfantIds: [],
        accoIds: ["a1"],
        sousgroupes: [{ id: "sg1", accoId: "a1", enfantIds: [] }],
      },
    ]);

    window.confirm = originalConfirm;
  });

  test("blocks apply when import has validation errors", async () => {
    const setChildren = jest.fn();
    const setGroups = jest.fn();

    act(() => {
      root.render(
        <ChildrenTab
          children={[]}
          setChildren={setChildren}
          supportWorkers={[]}
          groups={[]}
          setGroups={setGroups}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    const csv = [
      "nom,age,incompatiblesEnfants",
      "Lea M.,7,Tom B.",
    ].join("\n");

    await uploadCsv(csv);
    await flush(2);

    const applyButton = [...container.querySelectorAll("button")]
      .find((entry) => entry.textContent.includes("Apply import"));
    expect(applyButton).toBeTruthy();
    expect(applyButton.disabled).toBe(true);
    expect(setChildren).not.toHaveBeenCalled();
    expect(setGroups).not.toHaveBeenCalled();
  });
});
