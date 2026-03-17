import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import App from "./App";
import { THEME_STORAGE_KEY } from "./app/palette";

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("group-dispatch shell", () => {
  let container;
  let root;
  let prefersDark = false;

  const installMatchMedia = () => {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-color-scheme: dark)" ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  };

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
    prefersDark = false;
    installMatchMedia();
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

  test("uses system theme by default", async () => {
    prefersDark = true;
    installMatchMedia();

    renderApp();
    await flush();

    const darkButton = container.querySelector('[data-testid="theme-dark"]');
    const lightButton = container.querySelector('[data-testid="theme-light"]');
    expect(darkButton).toBeTruthy();
    expect(lightButton).toBeTruthy();
    expect(darkButton.getAttribute("aria-pressed")).toBe("true");
    expect(lightButton.getAttribute("aria-pressed")).toBe("false");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  test("theme toggle persists explicit choice", async () => {
    renderApp();
    await flush();

    const darkButton = container.querySelector('[data-testid="theme-dark"]');
    expect(darkButton).toBeTruthy();
    const appRoot = container.firstChild;
    expect(appRoot).toBeTruthy();
    const backgroundBefore = appRoot.style.background;

    act(() => {
      darkButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();

    const lightButton = container.querySelector('[data-testid="theme-light"]');
    const backgroundAfter = appRoot.style.background;
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(darkButton.getAttribute("aria-pressed")).toBe("true");
    expect(lightButton.getAttribute("aria-pressed")).toBe("false");
    expect(backgroundAfter).not.toBe(backgroundBefore);
  });

  test("restores persisted theme on reload", async () => {
    renderApp();
    await flush();

    const darkButton = container.querySelector('[data-testid="theme-dark"]');
    act(() => {
      darkButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await flush();
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    act(() => {
      root.unmount();
    });
    root = createRoot(container);

    renderApp();
    await flush();

    const darkButtonAfterReload = container.querySelector('[data-testid="theme-dark"]');
    const lightButtonAfterReload = container.querySelector('[data-testid="theme-light"]');
    expect(darkButtonAfterReload.getAttribute("aria-pressed")).toBe("true");
    expect(lightButtonAfterReload.getAttribute("aria-pressed")).toBe("false");
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
