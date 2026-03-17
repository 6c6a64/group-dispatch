import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { SupportWorkersTab } from "./SupportWorkersTab";
import { createTranslator } from "../../app/i18n";

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("SupportWorkersTab tags", () => {
  let container;
  let root;
  const t = createTranslator("en");

  const clickButton = (label) => {
    const button = [...container.querySelectorAll("button")].find((entry) => entry.textContent.includes(label));
    expect(button).toBeTruthy();
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  const setInputValue = (selector, value) => {
    const input = container.querySelector(selector);
    expect(input).toBeTruthy();
    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(input.constructor.prototype, "value").set;
      valueSetter.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("reuses existing tags and creates a new tag in the aide form", () => {
    const setSupportWorkers = jest.fn();
    const initialSupportWorkers = [
      { id: "a1", nom: "Aide 1", tags: ["Sensory"] },
    ];

    act(() => {
      root.render(
        <SupportWorkersTab
          supportWorkers={initialSupportWorkers}
          setSupportWorkers={setSupportWorkers}
          groups={[]}
          setGroups={jest.fn()}
          children={[]}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    clickButton("+ Add");
    setInputValue('input[placeholder="First Last"]', "Aide 2");

    const existingTagPill = container.querySelector('[data-testid="support-workers-tags-existing-pill-sensory"]');
    expect(existingTagPill).toBeTruthy();
    act(() => {
      existingTagPill.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    setInputValue('[data-testid="support-workers-tags-new-input"]', "Morning routine");
    const addTagButton = container.querySelector('[data-testid="support-workers-tags-add-button"]');
    expect(addTagButton).toBeTruthy();
    act(() => {
      addTagButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="support-workers-tags-existing-pill-morning-routine"]')).toBeTruthy();

    clickButton("Save");

    expect(setSupportWorkers).toHaveBeenCalledTimes(1);
    const updater = setSupportWorkers.mock.calls[0][0];
    expect(typeof updater).toBe("function");

    const next = updater(initialSupportWorkers);
    const added = next.find((entry) => entry.nom === "Aide 2");
    expect(added).toBeTruthy();
    expect(added.tags).toEqual(["Sensory", "Morning routine"]);
  });

  test("renders aide tags as pills on cards", () => {
    act(() => {
      root.render(
        <SupportWorkersTab
          supportWorkers={[{ id: "a1", nom: "Aide 1", tags: ["Sensory"] }]}
          setSupportWorkers={jest.fn()}
          groups={[]}
          setGroups={jest.fn()}
          children={[]}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    const tagPill = [...container.querySelectorAll("span")].find((entry) => entry.textContent === "Sensory");
    expect(tagPill).toBeTruthy();
  });
});
