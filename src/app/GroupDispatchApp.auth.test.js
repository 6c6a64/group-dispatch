import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";

const mockAuthService = {
  isEnabled: jest.fn(),
  getSession: jest.fn(),
  onAuthStateChange: jest.fn(),
  signInWithPassword: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
};

const mockGroupsDataService = {
  loadInitialState: jest.fn(),
  loadDemoState: jest.fn(),
  saveState: jest.fn(),
  listGroupSnapshots: jest.fn(),
  saveGroupSnapshot: jest.fn(),
  restoreGroupSnapshot: jest.fn(),
};

jest.mock("../services/authService", () => ({
  authService: mockAuthService,
}));

jest.mock("../services/groupsDataService", () => ({
  groupsDataService: mockGroupsDataService,
}));

const App = require("../App").default;

global.IS_REACT_ACT_ENVIRONMENT = true;

describe("group-dispatch auth gate", () => {
  let container;
  let root;

  const renderApp = () => {
    act(() => {
      root.render(<App />);
    });
  };

  const flush = async (times = 1) => {
    for (let i = 0; i < times; i += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  };

  beforeEach(() => {
    mockAuthService.isEnabled.mockReturnValue(true);
    mockAuthService.getSession.mockResolvedValue({ session: null });
    mockAuthService.onAuthStateChange.mockImplementation(() => () => undefined);
    mockAuthService.signInWithPassword.mockResolvedValue({});
    mockAuthService.signUp.mockResolvedValue({ session: null });
    mockAuthService.signOut.mockResolvedValue({});

    mockGroupsDataService.loadInitialState.mockResolvedValue({ children: [], supportWorkers: [], groups: [] });
    mockGroupsDataService.loadDemoState.mockResolvedValue({ children: [], supportWorkers: [], groups: [] });
    mockGroupsDataService.saveState.mockResolvedValue(undefined);
    mockGroupsDataService.listGroupSnapshots.mockResolvedValue([]);
    mockGroupsDataService.saveGroupSnapshot.mockResolvedValue({ status: "created", id: "s1", name: "default" });
    mockGroupsDataService.restoreGroupSnapshot.mockResolvedValue({ id: "s1", name: "default", groups: [] });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.clearAllMocks();
  });

  test("shows login gate when unauthenticated", async () => {
    renderApp();
    await flush(2);

    expect(container.textContent.includes("Sign in required")).toBe(true);
    expect(mockGroupsDataService.loadInitialState).not.toHaveBeenCalled();
  });

  test("loads data when authenticated", async () => {
    mockAuthService.getSession.mockResolvedValue({
      session: { user: { id: "u1", email: "user@example.com" } },
    });

    renderApp();
    await flush(4);

    expect(mockGroupsDataService.loadInitialState).toHaveBeenCalledTimes(1);
    expect(container.textContent.includes("Overview")).toBe(true);
    expect(container.textContent.includes("Signed in: user@example.com")).toBe(true);
  });
});
