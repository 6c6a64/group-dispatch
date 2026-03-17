import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { ChildrenTab } from "./ChildrenTab";
import { createTranslator } from "../../app/i18n";

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("ChildrenTab tags", () => {
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

  test("reuses existing tags and creates a new tag in the child form", () => {
    const setChildren = jest.fn();
    const initialChildren = [
      {
        id: "e1",
        nom: "Child 1",
        age: 8,
        ratioMax: 2,
        tags: ["Calm"],
        incompatiblesEnfants: [],
        incompatiblesAccos: [],
      },
    ];

    act(() => {
      root.render(
        <ChildrenTab
          children={initialChildren}
          setChildren={setChildren}
          supportWorkers={[]}
          groups={[]}
          setGroups={jest.fn()}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    clickButton("+ Add");
    setInputValue('input[placeholder="First Last"]', "New Child");
    setInputValue('input[placeholder="8"]', "9");

    const existingTagPill = container.querySelector('[data-testid="children-tags-existing-pill-calm"]');
    expect(existingTagPill).toBeTruthy();
    act(() => {
      existingTagPill.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    setInputValue('[data-testid="children-tags-new-input"]', "Visual support");
    const addTagButton = container.querySelector('[data-testid="children-tags-add-button"]');
    expect(addTagButton).toBeTruthy();
    act(() => {
      addTagButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="children-tags-existing-pill-visual-support"]')).toBeTruthy();

    clickButton("Save");

    expect(setChildren).toHaveBeenCalledTimes(1);
    const updater = setChildren.mock.calls[0][0];
    expect(typeof updater).toBe("function");

    const next = updater(initialChildren);
    const added = next.find((entry) => entry.nom === "New Child");
    expect(added).toBeTruthy();
    expect(added.tags).toEqual(["Calm", "Visual support"]);
  });

  test("renders child tags as pills on cards", () => {
    act(() => {
      root.render(
        <ChildrenTab
          children={[
            {
              id: "e1",
              nom: "Child 1",
              age: 8,
              ratioMax: 2,
              tags: ["Calm"],
              incompatiblesEnfants: [],
              incompatiblesAccos: [],
            },
          ]}
          setChildren={jest.fn()}
          supportWorkers={[]}
          groups={[]}
          setGroups={jest.fn()}
          t={t}
          emptyStateMessage=""
        />,
      );
    });

    const tagPill = [...container.querySelectorAll("span")].find((entry) => entry.textContent === "Calm");
    expect(tagPill).toBeTruthy();
  });
});
