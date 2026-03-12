import React from "react";
import { C } from "../../app/palette";
import { validerGroupe } from "../../domain/validation";
import { ConflitRow } from "../ui/atoms";
import { suffixPlural } from "../../app/i18n";

export function DashboardTab({ groups, children, supportWorkers, t, emptyStateMessage }) {
  const tousConflits = React.useMemo(
    () => groups.flatMap((group) => validerGroupe(group, children, supportWorkers, t)),
    [groups, children, supportWorkers, t],
  );
  const placesIds = React.useMemo(() => new Set(groups.flatMap((group) => group.enfantIds)), [groups]);
  const assignesIds = React.useMemo(
    () => new Set(groups.flatMap((group) => group.sousgroupes.flatMap((sg) => sg.enfantIds))),
    [groups],
  );

  const nonPlaces = React.useMemo(() => children.filter((enfant) => !placesIds.has(enfant.id)), [children, placesIds]);
  const placesNonAssign = React.useMemo(
    () => children.filter((enfant) => placesIds.has(enfant.id) && !assignesIds.has(enfant.id)),
    [children, placesIds, assignesIds],
  );

  const toutOK = tousConflits.length === 0 && nonPlaces.length === 0 && placesNonAssign.length === 0;

  const stat = (label, value, color, sub) => (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px" }}>
      <div style={{ color: C.muted, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ color, fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub ? <div style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>{sub}</div> : null}
    </div>
  );

  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: C.text, fontSize: 18, fontWeight: 800 }}>{t("dashboard.title")}</h2>

      {emptyStateMessage ? (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 14,
            color: C.muted,
            marginBottom: 16,
          }}
        >
          {emptyStateMessage}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12, marginBottom: 28 }}>
        {stat(
          t("dashboard.children"),
          children.length,
          C.accent,
          t("dashboard.childrenPlacement", { inGroups: placesIds.size, inSubgroups: assignesIds.size }),
        )}
        {stat(
          t("dashboard.groups"),
          groups.length,
          C.green,
          t("dashboard.subgroupTotal", { count: groups.flatMap((group) => group.sousgroupes).length }),
        )}
        {stat(t("dashboard.supportWorkers"), supportWorkers.length, C.purple, "")}
        {stat(
          t("dashboard.conflicts"),
          tousConflits.length,
          tousConflits.length > 0 ? C.red : C.green,
          tousConflits.length > 0 ? t("dashboard.toResolve") : t("dashboard.noneConflict"),
        )}
      </div>

      {toutOK ? (
        <div
          style={{
            background: `${C.green}12`,
            border: `1px solid ${C.green}33`,
            borderRadius: 10,
            padding: 18,
            textAlign: "center",
            color: C.green,
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {t("dashboard.ok")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {nonPlaces.length > 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {t("dashboard.childrenWithoutGroup", {
                  count: nonPlaces.length,
                  suffix: suffixPlural(nonPlaces.length),
                })}
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>{nonPlaces.map((enfant) => enfant.nom).join(", ")}</div>
            </div>
          ) : null}

          {placesNonAssign.length > 0 ? (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {t("dashboard.childrenWithoutSubgroup", {
                  count: placesNonAssign.length,
                  suffix: suffixPlural(placesNonAssign.length),
                })}
              </div>
              <div style={{ color: C.muted, fontSize: 12 }}>
                {placesNonAssign.map((enfant) => {
                  const group = groups.find((entry) => entry.enfantIds.includes(enfant.id));
                  return `${enfant.nom} (${group ? group.nom : "-"})`;
                }).join(", ")}
              </div>
            </div>
          ) : null}

          {tousConflits.length > 0 ? (
            <div>
              <h3 style={{ color: C.text, fontSize: 14, fontWeight: 700, margin: "4px 0 8px" }}>
                {t("dashboard.groupConflicts")}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {groups.flatMap((group) => validerGroupe(group, children, supportWorkers, t).map((conflict, index) => (
                  <div
                    key={`${group.id}-${index}`}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      padding: "8px 12px",
                    }}
                  >
                    <span style={{ color: C.muted, fontSize: 12, minWidth: 110, paddingTop: 1, flexShrink: 0 }}>
                      {group.nom}
                    </span>
                    <ConflitRow c={conflict} />
                  </div>
                )))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
