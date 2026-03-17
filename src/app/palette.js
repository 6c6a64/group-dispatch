export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";
export const THEME_STORAGE_KEY = "groupDispatch.themePreference";

export const brand = {
  orange: "#FF7A2B",
  teal: "#7CC8C8",
  magenta: "#CC30D6",
  sand: "#E4DFD9",
  ink: "#141414",
};

export const themes = {
  [THEME_LIGHT]: {
    bg: "#EAE5DE",
    surface: "#F4F0EA",
    card: "#FAF7F3",
    card2: "#FFFFFF",
    border: "#D7D0C6",
    accent: "#EA6E28",
    accentDim: "#FFEBDD",
    green: "#6FB7B8",
    greenDim: "#E1F1F1",
    yellow: "#E39C52",
    yellowDim: "#FFF3E7",
    red: "#A94FB7",
    redDim: "#F3E4F7",
    purple: "#A94FB7",
    purpleDim: "#F3E4F7",
    text: "#1E1A17",
    muted: "#6E655B",
    faint: "#9A9187",
  },
  [THEME_DARK]: {
    bg: "#17141A",
    surface: "#1F1B23",
    card: "#27222D",
    card2: "#2E2735",
    border: "#403847",
    accent: "#EA7A3F",
    accentDim: "#4A2E1F",
    green: "#73B8B9",
    greenDim: "#1E383A",
    yellow: "#D99B58",
    yellowDim: "#4A3322",
    red: "#B15CBF",
    redDim: "#3E2244",
    purple: "#B15CBF",
    purpleDim: "#3E2244",
    text: "#F3ECE5",
    muted: "#B6AFA5",
    faint: "#837970",
  },
};

export function resolveSystemTheme() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return THEME_LIGHT;
  }
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (!mediaQuery || typeof mediaQuery.matches !== "boolean") {
    return THEME_LIGHT;
  }
  return mediaQuery.matches ? THEME_DARK : THEME_LIGHT;
}

export function sanitizeThemePreference(value) {
  return value === THEME_DARK || value === THEME_LIGHT ? value : null;
}

function cloneTheme(theme) {
  return {
    ...theme,
  };
}

export const C = cloneTheme(themes[THEME_DARK]);

export function applyTheme(themeId) {
  const nextTheme = themes[themeId] || themes[THEME_DARK];
  Object.keys(C).forEach((key) => {
    delete C[key];
  });
  Object.assign(C, cloneTheme(nextTheme));
}
