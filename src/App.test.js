import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "./App";

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("group-dispatch shell", () => {
  let container;
  let root;

  const renderApp = () => {
    act(() => {
      root.render(<App />);
    });
  };

  const flush = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  const findButton = (needle) => [...container.querySelectorAll("button")]
    .find((button) => button.textContent.includes(needle));

  const clickButton = (needle) => {
    const button = findButton(needle);
    expect(button).toBeTruthy();
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
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
  });

  test("renders app shell", async () => {
    renderApp();
    await flush();
    expect(container.textContent.includes("Group Dispatch")).toBe(true);
  });

  test("starts empty", async () => {
    renderApp();
    await flush();
    expect(container.textContent.includes("No data yet")).toBe(true);
  });

  test("shows unassigned summary in groups view when empty", async () => {
    renderApp();
    await flush();
    clickButton("Groups");
    await flush();
    expect(container.textContent.includes("All children are assigned to a group")).toBe(true);
  });

  test("loads demo data", async () => {
    renderApp();
    await flush();
    clickButton("Load demo data");
    await flush();
    clickButton("Groups");
    await flush();
    expect(container.textContent.includes("Groupe Colibri")).toBe(true);
  });

  test("switches language", async () => {
    renderApp();
    await flush();
    clickButton("EN");
    await flush();
    expect(container.textContent.includes("Overview")).toBe(true);
    expect(container.textContent.includes("Load demo data")).toBe(true);
    expect(container.textContent.includes("Aides")).toBe(true);
  });

  test("resets groups only with confirmation", async () => {
    renderApp();
    await flush();
    clickButton("Load demo data");
    await flush();
    clickButton("Groups");
    await flush();
    expect(container.textContent.includes("Groupe Colibri")).toBe(true);

    const originalConfirm = window.confirm;

    window.confirm = jest.fn(() => false);
    clickButton("Reset");
    await flush();
    expect(container.textContent.includes("Groupe Colibri")).toBe(true);

    window.confirm = jest.fn(() => true);
    clickButton("Reset");
    await flush();
    expect(container.textContent.includes("Groupe Colibri")).toBe(false);

    clickButton("Children");
    await flush();
    expect(container.textContent.includes("Lea M.")).toBe(true);

    window.confirm = originalConfirm;
  });
});
