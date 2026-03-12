import React from "react";
import { C } from "../../app/palette";
import { repartirGlobal } from "../../domain/assignment";
import { Btn, Modal } from "../ui/atoms";
import { suffixPlural } from "../../app/i18n";

export function GlobalAutoAssignModal({ groups, children, supportWorkers, onClose, onApply, t }) {
  const [result, setResult] = React.useState(null);

  const preview = React.useMemo(() => {
    if (!result) {
      return null;
    }

    const groupedIds = new Set(result.groups.flatMap((group) => group.enfantIds));
    const subgroupIds = new Set(result.groups.flatMap((group) => group.sousgroupes.flatMap((sg) => sg.enfantIds)));
    const noGroupChildren = children.filter((enfant) => !groupedIds.has(enfant.id));
    const noSubgroupChildren = children.filter((enfant) => groupedIds.has(enfant.id) && !subgroupIds.has(enfant.id));
    const noGroupMap = new Map(result.nonPlaces.map((entry) => [entry.enfant.id, entry]));

    return {
      noGroupChildren,
      noSubgroupChildren,
      noGroupMap,
      hasIssues: noGroupChildren.length > 0 || noSubgroupChildren.length > 0,
    };
  }, [result, children]);

  const lancer = (mode) => {
    setResult(repartirGlobal(groups, children, supportWorkers, mode, t));
  };

  const appliquer = () => {
    if (!result || !preview) {
      return;
    }
    onApply(result.groups, preview.noGroupChildren.map((entry) => entry.id));
    setTimeout(onClose, 0);
  };

  return (
    <Modal title={t("autoGlobal.title")} onClose={onClose} wide>
      {!result ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, color: C.muted, fontSize: 13, lineHeight: 1.6 }}>
            {t("autoGlobal.description")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button type="button" onClick={() => lancer("nonplaces")} style={modeButtonStyle}>
              <div style={modeTitleStyle}>{t("autoGlobal.modeNonPlaced")}</div>
              <div style={modeDescStyle}>{t("autoGlobal.modeNonPlacedDesc")}</div>
            </button>

            <button type="button" onClick={() => lancer("tout")} style={modeButtonStyle}>
              <div style={modeTitleStyle}>{t("autoGlobal.modeAll")}</div>
              <div style={modeDescStyle}>{t("autoGlobal.modeAllDesc")}</div>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              background: preview && !preview.hasIssues ? `${C.green}10` : `${C.yellow}10`,
              border: `1px solid ${preview && !preview.hasIssues ? `${C.green}33` : `${C.yellow}33`}`,
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 13,
              color: preview && !preview.hasIssues ? C.green : C.yellow,
              fontWeight: 700,
            }}
          >
            {preview && !preview.hasIssues
              ? t("autoGlobal.allPlaced")
              : t("autoGlobal.partialMixed", {
                noGroupCount: preview ? preview.noGroupChildren.length : 0,
                noSubgroupCount: preview ? preview.noSubgroupChildren.length : 0,
              })}
          </div>

          {preview && preview.hasIssues ? (
            <div
              style={{
                background: C.card2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "8px 11px",
                marginBottom: 14,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {preview.noGroupChildren.length > 0 ? (
                <div style={{ color: C.muted, fontSize: 11 }}>{t("autoGlobal.noGroupHint")}</div>
              ) : null}
              {preview.noSubgroupChildren.length > 0 ? (
                <div style={{ color: C.muted, fontSize: 11 }}>{t("autoGlobal.noSubgroupHint")}</div>
              ) : null}
            </div>
          ) : null}

          {preview && preview.noGroupChildren.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                {t("autoGlobal.noGroupTitle", { count: preview.noGroupChildren.length })}
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>
                {t("autoGlobal.noGroupHint")}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {preview.noGroupChildren.map((enfant) => {
                  const entry = preview.noGroupMap.get(enfant.id);
                  const raisons = entry ? entry.raisons : [];
                  return (
                    <div
                      key={enfant.id}
                      style={{
                        background: C.card2,
                        borderRadius: 7,
                        padding: "8px 11px",
                        borderLeft: `3px solid ${C.yellow}`,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: C.text, fontSize: 12, marginBottom: 3 }}>
                        {`${enfant.nom} - ${enfant.age} ${t("common.years")} - 1:${enfant.ratioMax}`}
                      </div>
                      {raisons.map((raison, index) => (
                        <div key={index} style={{ fontSize: 11, color: C.muted }}>
                          - {raison}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {preview && preview.noSubgroupChildren.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.yellow, fontWeight: 700, fontSize: 12, marginBottom: 6 }}>
                {t("autoGlobal.noSubgroupTitle", { count: preview.noSubgroupChildren.length })}
              </div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 8 }}>
                {t("autoGlobal.noSubgroupHint")}
              </div>
              <div
                style={{
                  background: C.card2,
                  borderRadius: 7,
                  border: `1px solid ${C.border}`,
                  padding: "4px 8px",
                  maxHeight: 220,
                  overflowY: "auto",
                }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 6 }}>
                  {preview.noSubgroupChildren.map((enfant) => {
                    const group = result.groups.find((item) => item.enfantIds.includes(enfant.id));
                    return (
                      <div
                        key={enfant.id}
                        style={{
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: "6px 7px",
                          background: C.surface,
                          minWidth: 0,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 12, marginBottom: 2 }}>
                          {`${enfant.nom} - ${enfant.age} ${t("common.years")} - 1:${enfant.ratioMax}`}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted }}>
                          {t("autoGlobal.inGroup", { groupName: group ? group.nom : "-" })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 18 }}>
            {result.groups.map((group) => (
              <div key={group.id} style={{ background: C.card2, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 13, marginBottom: 8 }}>
                  {`${group.nom} - ${t("groups.childrenCount", {
                    count: group.enfantIds.length,
                    suffix: suffixPlural(group.enfantIds.length),
                  })}`}
                </div>
                {group.sousgroupes.length === 0 ? (
                  <div style={{ color: C.faint, fontSize: 12 }}>{t("common.noSubgroup")}</div>
                ) : null}
                {group.sousgroupes.map((sg) => {
                  const acco = supportWorkers.find((item) => item.id === sg.accoId);
                  const membres = children.filter((item) => sg.enfantIds.includes(item.id));
                  return (
                    <div key={sg.id} style={{ fontSize: 12, color: C.muted, marginBottom: 3 }}>
                      <span style={{ color: C.text }}>{acco ? acco.nom : "-"}</span>
                      {" -> "}
                      {membres.length === 0
                        ? <span style={{ color: C.faint }}>{t("common.noChildren")}</span>
                        : membres.map((item) => item.nom).join(", ")}
                    </div>
                  );
                })}

                {(() => {
                  const assignedIds = new Set(group.sousgroupes.flatMap((sg) => sg.enfantIds));
                  const nonAssignes = children.filter((enfant) => (
                    group.enfantIds.includes(enfant.id) && !assignedIds.has(enfant.id)
                  ));
                  if (nonAssignes.length === 0) {
                    return null;
                  }
                  return (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: `1px dashed ${C.border}`,
                      }}
                    >
                      <div style={{ color: C.yellow, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                        {t("groups.nonAssignes", { count: nonAssignes.length })}
                      </div>
                      <div
                        style={{
                          color: C.muted,
                          fontSize: 12,
                          maxHeight: 70,
                          overflowY: "auto",
                        }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 4 }}>
                          {nonAssignes.map((item) => (
                            <div key={item.id} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.nom}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={appliquer}>{t("autoGlobal.apply")}</Btn>
            <Btn variant="ghost" onClick={() => setResult(null)}>{t("autoGlobal.changeMode")}</Btn>
            <Btn variant="ghost" onClick={onClose}>{t("common.cancel")}</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

const modeButtonStyle = {
  background: C.card2,
  border: `1px solid ${C.border}`,
  borderRadius: 10,
  padding: "14px 16px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
};

const modeTitleStyle = {
  color: C.text,
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 4,
};

const modeDescStyle = {
  color: C.muted,
  fontSize: 12,
};
