import React from "react";
import { C } from "../../app/palette";
import { dedupeTags, normalizeTag, normalizeTagKey } from "../../domain/tags";

export function Badge({ children, color = C.accent }) {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        border: `1px solid ${color}44`,
        borderRadius: 5,
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function Pill({ children, active, color = C.accent, onClick, ...rest }) {
  return (
    <button
      onClick={onClick}
      type="button"
      {...rest}
      style={{
        background: active ? `${color}22` : C.surface,
        color: active ? color : C.muted,
        border: `1px solid ${active ? `${color}55` : C.border}`,
        borderRadius: 6,
        padding: "4px 11px",
        fontSize: 12,
        fontWeight: active ? 700 : 400,
        cursor: onClick ? "pointer" : "default",
        fontFamily: "inherit",
        transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  );
}

export function Btn({ children, onClick, variant = "primary", small, disabled, type = "button", ...rest }) {
  const styleByVariant = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: `${C.red}18`, color: C.red, border: `1px solid ${C.red}33` },
    success: { background: `${C.green}18`, color: C.green, border: `1px solid ${C.green}33` },
  }[variant];

  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      {...rest}
      style={{
        ...styleByVariant,
        borderRadius: 7,
        padding: small ? "4px 11px" : "7px 16px",
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        fontFamily: "inherit",
      }}
    >
      {children}
    </button>
  );
}

export function Inp({ value, onChange, placeholder, type = "text", style = {}, onKeyDown, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      {...rest}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 7,
        padding: "7px 11px",
        color: C.text,
        fontSize: 13,
        outline: "none",
        fontFamily: "inherit",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

function toTestIdSegment(value) {
  return normalizeTagKey(value).replace(/[^a-z0-9]+/g, "-");
}

export function TagSelector({
  availableTags,
  selectedTags,
  onChange,
  emptyLabel,
  newPlaceholder,
  addLabel,
  color = C.accent,
  testIdPrefix,
}) {
  const [draft, setDraft] = React.useState("");
  const selected = React.useMemo(
    () => dedupeTags(selectedTags || []),
    [selectedTags],
  );
  const selectedKeys = React.useMemo(
    () => new Set(selected.map((tag) => normalizeTagKey(tag))),
    [selected],
  );
  const pool = React.useMemo(
    () => dedupeTags([...(availableTags || []), ...selected]),
    [availableTags, selected],
  );

  const toggleTag = React.useCallback((tag) => {
    const key = normalizeTagKey(tag);
    if (selectedKeys.has(key)) {
      onChange(selected.filter((entry) => normalizeTagKey(entry) !== key));
      return;
    }
    onChange(dedupeTags([...selected, tag]));
  }, [onChange, selected, selectedKeys]);

  const addTag = React.useCallback(() => {
    const nextTag = normalizeTag(draft);
    if (!nextTag) {
      setDraft("");
      return;
    }

    const mergedPool = dedupeTags([...pool, nextTag]);
    const targetKey = normalizeTagKey(nextTag);
    const canonicalTag = mergedPool.find((entry) => normalizeTagKey(entry) === targetKey) || nextTag;

    if (!selectedKeys.has(targetKey)) {
      onChange(dedupeTags([...selected, canonicalTag]));
    }

    setDraft("");
  }, [draft, onChange, pool, selected, selectedKeys]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {pool.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {pool.map((tag) => {
            const key = normalizeTagKey(tag);
            return (
              <Pill
                key={tag}
                active={selectedKeys.has(key)}
                color={color}
                onClick={() => toggleTag(tag)}
                data-testid={testIdPrefix ? `${testIdPrefix}-existing-pill-${toTestIdSegment(tag)}` : undefined}
              >
                {tag}
              </Pill>
            );
          })}
        </div>
      ) : (
        <div style={{ color: C.muted, fontSize: 12 }}>
          {emptyLabel}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Inp
          value={draft}
          onChange={setDraft}
          placeholder={newPlaceholder}
          data-testid={testIdPrefix ? `${testIdPrefix}-new-input` : undefined}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === ";") {
              event.preventDefault();
              addTag();
            }
          }}
          style={{ flex: 1 }}
        />
        <Btn
          small
          variant="ghost"
          onClick={addTag}
          disabled={!draft.trim()}
          data-testid={testIdPrefix ? `${testIdPrefix}-add-button` : undefined}
        >
          {addLabel}
        </Btn>
      </div>
    </div>
  );
}

export function TagPillList({ tags, color = C.accent, emptyLabel }) {
  const normalized = dedupeTags(tags || []);

  if (normalized.length === 0) {
    return <div style={{ color: C.muted, fontSize: 11 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
      {normalized.map((tag) => (
        <span
          key={tag}
          style={{
            display: "inline-flex",
            alignItems: "center",
            height: 18,
            boxSizing: "border-box",
            padding: "0 8px",
            borderRadius: 999,
            background: `${color}20`,
            border: `1px solid ${color}55`,
            color: color,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: 0.1,
            whiteSpace: "nowrap",
          }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function Sel({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 7,
        padding: "7px 11px",
        color: value ? C.text : C.muted,
        fontSize: 13,
        outline: "none",
        fontFamily: "inherit",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ConflitRow({ c }) {
  const styleMap = {
    ratio: { color: C.red, icon: "!" },
    enfant: { color: C.yellow, icon: "X" },
    acco: { color: C.yellow, icon: "-" },
    age: { color: C.purple, icon: "@" },
    nonassigne: { color: C.muted, icon: "o" },
    incompat_croisee: { color: "#f79a4f", icon: "~" },
  };
  const { color, icon } = styleMap[c.type] || { color: C.muted, icon: "*" };

  return (
    <div
      style={{
        display: "flex",
        gap: 7,
        alignItems: "flex-start",
        background: `${color}12`,
        border: `1px solid ${color}33`,
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12,
        color,
      }}
    >
      <span style={{ flexShrink: 0 }}>{icon}</span>
      <span>{c.msg}</span>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#00000099",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          padding: 26,
          width: "100%",
          maxWidth: wide ? 800 : 500,
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0, color: C.text, fontSize: 15, fontWeight: 800 }}>{title}</h3>
          <button
            onClick={onClose}
            type="button"
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LanguageSwitch({ lang, setLang, t }) {
  const optionStyle = (active) => ({
    border: `1px solid ${active ? `${C.accent}88` : C.border}`,
    background: active ? `${C.accent}22` : "transparent",
    color: active ? C.accent : C.muted,
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: C.muted, fontSize: 11 }}>{t("app.language")}</span>
      <button type="button" style={optionStyle(lang === "fr")} onClick={() => setLang("fr")}>FR</button>
      <button type="button" style={optionStyle(lang === "en")} onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

export function ThemeSwitch({ theme, setTheme, t }) {
  const optionStyle = (active) => ({
    border: `1px solid ${active ? `${C.accent}88` : C.border}`,
    background: active ? `${C.accent}22` : "transparent",
    color: active ? C.accent : C.muted,
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color: C.muted, fontSize: 11 }}>{t("app.theme")}</span>
      <button
        type="button"
        style={optionStyle(theme === "light")}
        onClick={() => setTheme("light")}
        data-testid="theme-light"
        aria-pressed={theme === "light"}
      >
        {t("app.themeLight")}
      </button>
      <button
        type="button"
        style={optionStyle(theme === "dark")}
        onClick={() => setTheme("dark")}
        data-testid="theme-dark"
        aria-pressed={theme === "dark"}
      >
        {t("app.themeDark")}
      </button>
    </div>
  );
}
