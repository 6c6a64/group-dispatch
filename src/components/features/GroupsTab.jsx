import React from "react";
import { C } from "../../app/palette";
import {
  calcCompatibilite,
  calcCompatibiliteAcco,
  diagnostiquerEnfant,
  newSgId,
} from "../../domain/assignment";
import { validerGroupe, validerSousGroupe } from "../../domain/validation";
import { suffixPlural } from "../../app/i18n";
import { Badge, Btn, ConflitRow } from "../ui/atoms";
import { GroupFormModal } from "./GroupFormModal";
import { GlobalAutoAssignModal } from "./GlobalAutoAssignModal";

function DragHandleIcon({ size = 11, color = C.faint, style = {} }) {
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: "inline-block", color, flexShrink: 0, ...style }}
    >
      <circle cx="2" cy="2" r="1" fill="currentColor" />
      <circle cx="6" cy="2" r="1" fill="currentColor" />
      <circle cx="10" cy="2" r="1" fill="currentColor" />
      <circle cx="2" cy="6" r="1" fill="currentColor" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
      <circle cx="10" cy="6" r="1" fill="currentColor" />
      <circle cx="2" cy="10" r="1" fill="currentColor" />
      <circle cx="6" cy="10" r="1" fill="currentColor" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function DragHandleColumn({ iconSize = 10 }) {
  return (
    <div
      style={{
        width: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRight: `1px solid ${C.border}`,
        background: `${C.bg}26`,
      }}
    >
      <DragHandleIcon size={iconSize} color={C.muted} />
    </div>
  );
}

export function moveChildBetweenGroups(prev, enfantId, fromGroupeId, fromSgId, toGroupeId, toSgId) {
  const keepInSourceGroup = fromGroupeId
    && toGroupeId
    && fromGroupeId === toGroupeId
    && toGroupeId !== "__nonplaces__";

  let next = prev.map((group) => {
    if (group.id !== fromGroupeId) {
      return group;
    }
    return {
      ...group,
      enfantIds: keepInSourceGroup ? group.enfantIds : group.enfantIds.filter((id) => id !== enfantId),
      sousgroupes: group.sousgroupes.map((sg) => (
        sg.id === fromSgId ? { ...sg, enfantIds: sg.enfantIds.filter((id) => id !== enfantId) } : sg
      )),
    };
  });

  next = next.map((group) => {
    if (group.id !== toGroupeId) {
      return group;
    }

    const dejaDansGroupe = group.enfantIds.includes(enfantId);
    return {
      ...group,
      enfantIds: dejaDansGroupe ? group.enfantIds : [...group.enfantIds, enfantId],
      sousgroupes: toSgId
        ? group.sousgroupes.map((sg) => (
          sg.id === toSgId
            ? {
              ...sg,
              enfantIds: sg.enfantIds.includes(enfantId)
                ? sg.enfantIds
                : [...sg.enfantIds, enfantId],
            }
            : {
              ...sg,
              enfantIds: sg.enfantIds.filter((id) => id !== enfantId),
            }
        ))
        : group.sousgroupes.map((sg) => ({
          ...sg,
          enfantIds: sg.enfantIds.filter((id) => id !== enfantId),
        })),
    };
  });

  return next;
}

function EnfantChip({ enfant, fromGroupeId, fromSgId, children, supportWorkers, draggingId, onDragStart, onDragEnd }) {
  const incompatChildren = enfant.incompatiblesEnfants
    .map((id) => children.find((entry) => entry.id === id))
    .filter(Boolean)
    .map((entry) => entry.nom);
  const incompatAccos = enfant.incompatiblesAccos
    .map((id) => supportWorkers.find((entry) => entry.id === id))
    .filter(Boolean)
    .map((entry) => entry.nom);

  const isDragging = draggingId === enfant.id;

  return (
    <div
      draggable
      onDragStart={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.dataTransfer.setDragImage(event.currentTarget, event.clientX - rect.left, event.clientY - rect.top);
        onDragStart(enfant, fromGroupeId, fromSgId);
      }}
      onDragEnd={onDragEnd}
      style={{
        background: isDragging ? C.accentDim : C.surface,
        borderRadius: 6,
        display: "grid",
        gridTemplateColumns: "18px minmax(0, 1fr)",
        overflow: "hidden",
        cursor: "grab",
        opacity: isDragging ? 0.4 : 1,
        border: `1px solid ${isDragging ? C.accent : "transparent"}`,
      }}
    >
      <DragHandleColumn />
      <div style={{ padding: "5px 9px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: C.text, fontSize: 12, fontWeight: 600 }}>{enfant.nom}</span>
          <span style={{ color: C.muted, fontSize: 11 }}>{`${enfant.age} - 1:${enfant.ratioMax}`}</span>
        </div>
        {incompatChildren.length > 0 ? (
          <div style={{ fontSize: 11, color: C.yellow, marginTop: 2 }}>{`X ${incompatChildren.join(", ")}`}</div>
        ) : null}
        {incompatAccos.length > 0 ? (
          <div style={{ fontSize: 11, color: C.red, marginTop: 2 }}>{`- ${incompatAccos.join(", ")}`}</div>
        ) : null}
      </div>
    </div>
  );
}

export function GroupsTab({ groups, setGroups, children, supportWorkers, t, emptyStateMessage }) {
  const desktopBreakpoint = 1024;
  const [modalForm, setModalForm] = React.useState(null);
  const [modalAuto, setModalAuto] = React.useState(false);

  const [dragging, setDragging] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);
  const [dropWarning, setDropWarning] = React.useState(null);
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== "undefined" ? window.innerWidth >= desktopBreakpoint : false,
  );

  const conflitsParGroupe = React.useMemo(
    () => Object.fromEntries(groups.map((group) => [group.id, validerGroupe(group, children, supportWorkers, t)])),
    [groups, children, supportWorkers, t],
  );

  const enfantsNonPlaces = React.useMemo(() => {
    const places = new Set(groups.flatMap((group) => group.enfantIds));
    return children.filter((enfant) => !places.has(enfant.id));
  }, [groups, children]);

  const startDragEnfant = (enfant, fromGroupeId, fromSgId) => {
    const compat = calcCompatibilite(enfant, groups, children, supportWorkers, t);
    setDragging({ type: "enfant", id: enfant.id, fromGroupeId, fromSgId, compat });
  };

  const startDragAcco = (acco, fromGroupeId) => {
    const compat = calcCompatibiliteAcco({ id: acco.id, fromGroupeId }, groups, t);
    setDragging({ type: "acco", id: acco.id, fromGroupeId, compat });
  };

  const saveGroupe = (group) => {
    setGroups((prev) => {
      const found = prev.find((entry) => entry.id === group.id);
      if (found) {
        return prev.map((entry) => (entry.id === group.id ? group : entry));
      }
      return [...prev, group];
    });
    setModalForm(null);
  };

  const applyDropEnfant = (enfantId, fromGroupeId, fromSgId, toGroupeId, toSgId) => {
    setGroups((prev) => moveChildBetweenGroups(prev, enfantId, fromGroupeId, fromSgId, toGroupeId, toSgId));
  };

  const applyDropAcco = (accoId, fromGroupeId, toGroupeId) => {
    if (fromGroupeId === toGroupeId) {
      return;
    }

    setGroups((prev) => prev.map((group) => {
      if (group.id === fromGroupeId) {
        return {
          ...group,
          accoIds: group.accoIds.filter((id) => id !== accoId),
          responsableId: group.responsableId === accoId ? "" : group.responsableId,
          sousgroupes: group.sousgroupes.filter((sg) => sg.accoId !== accoId),
        };
      }
      if (group.id === toGroupeId) {
        return {
          ...group,
          accoIds: group.accoIds.includes(accoId) ? group.accoIds : [...group.accoIds, accoId],
        };
      }
      return group;
    }));
  };

  const handleDrop = (toGroupeId, toSgId) => {
    if (!dragging) {
      return;
    }

    setDropTarget(null);

    if (dragging.type === "acco") {
      applyDropAcco(dragging.id, dragging.fromGroupeId, toGroupeId);
      setDragging(null);
      return;
    }

    if (toGroupeId === "__nonplaces__") {
      applyDropEnfant(dragging.id, dragging.fromGroupeId, dragging.fromSgId, "__nonplaces__", null);
      setDragging(null);
      return;
    }

    const groupCompat = dragging.compat ? dragging.compat[toGroupeId] : null;
    const sgCompat = toSgId && groupCompat ? groupCompat.sgs[toSgId] : null;
    const warnings = sgCompat ? sgCompat.conflicts : (groupCompat ? groupCompat.conflicts : []);

    const pending = {
      enfantId: dragging.id,
      fromGroupeId: dragging.fromGroupeId,
      fromSgId: dragging.fromSgId,
      toGroupeId,
      toSgId,
    };

    if (warnings.length > 0) {
      setDropWarning({ msgs: warnings, pending });
    } else {
      applyDropEnfant(
        pending.enfantId,
        pending.fromGroupeId,
        pending.fromSgId,
        pending.toGroupeId,
        pending.toSgId,
      );
    }

    setDragging(null);
  };

  const confirmDrop = () => {
    if (!dropWarning) {
      return;
    }

    const { pending } = dropWarning;
    applyDropEnfant(
      pending.enfantId,
      pending.fromGroupeId,
      pending.fromSgId,
      pending.toGroupeId,
      pending.toSgId,
    );
    setDropWarning(null);
  };

  const groupeHighlight = (group) => {
    if (!dragging) {
      return null;
    }
    if (dragging.fromGroupeId === group.id) {
      return null;
    }

    const compat = dragging.compat ? dragging.compat[group.id] : null;
    if (!compat) {
      return null;
    }

    if (compat.ok) {
      return "green";
    }
    return "red";
  };

  const sgHighlight = (group, sg) => {
    if (!dragging || dragging.type !== "enfant") {
      return null;
    }

    const compat = dragging.compat ? dragging.compat[group.id] : null;
    if (!compat || !compat.sgs || !compat.sgs[sg.id]) {
      return null;
    }

    return compat.sgs[sg.id].ok ? "green" : "red";
  };

  const isOver = (groupeId, sgId) => dropTarget
    && dropTarget.groupeId === groupeId
    && dropTarget.sgId === (sgId || null);

  const dropZoneStyle = (groupeId, sgId) => {
    const over = isOver(groupeId, sgId);
    return {
      outline: over ? `2px dashed ${C.accent}` : "none",
      outlineOffset: -2,
      background: over ? C.accentDim : "transparent",
      transition: "background 0.15s, outline 0.15s",
      borderRadius: 8,
    };
  };

  const groupeBorderColor = (group) => {
    const conflitsExistants = conflitsParGroupe[group.id] || [];
    if (!dragging) {
      return conflitsExistants.length > 0 ? `${C.red}55` : C.border;
    }

    const highlight = groupeHighlight(group);
    if (highlight === "green") {
      return `${C.green}99`;
    }
    if (highlight === "red") {
      return `${C.red}99`;
    }

    return C.border;
  };

  const groupeBackground = (group) => {
    if (!dragging) {
      return C.card;
    }
    const highlight = groupeHighlight(group);
    if (highlight === "green") {
      return `${C.green}08`;
    }
    if (highlight === "red") {
      return `${C.red}08`;
    }
    return C.card;
  };

  const sgBorderLeft = (group, sg) => {
    if (!dragging || dragging.type !== "enfant") {
      return "none";
    }

    const highlight = sgHighlight(group, sg);
    if (highlight === "green") {
      return `3px solid ${C.green}66`;
    }
    if (highlight === "red") {
      return `3px solid ${C.red}66`;
    }
    return "none";
  };

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateLayoutMode = () => {
      setIsDesktop(window.innerWidth >= desktopBreakpoint);
    };

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, [desktopBreakpoint]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>{t("groups.title")}</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" small onClick={() => setModalAuto(true)}>{t("groups.auto")}</Btn>
          <Btn onClick={() => setModalForm("new")}>{t("groups.new")}</Btn>
        </div>
      </div>

      {dropWarning ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#00000088",
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.yellow}55`,
              borderRadius: 14,
              padding: 24,
              maxWidth: 400,
              width: "100%",
            }}
          >
            <div style={{ fontWeight: 700, color: C.yellow, marginBottom: 12 }}>{t("groups.conflictsDetected")}</div>
            {dropWarning.msgs.map((msg, index) => (
              <div key={index} style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>- {msg}</div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn onClick={confirmDrop}>{t("groups.moveAnyway")}</Btn>
              <Btn variant="ghost" onClick={() => setDropWarning(null)}>{t("common.cancel")}</Btn>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isDesktop ? "minmax(280px, 30%) minmax(0, 1fr)" : "1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ position: isDesktop ? "sticky" : "static", top: isDesktop ? 68 : "auto", alignSelf: "start" }}>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDropTarget({ groupeId: "__nonplaces__", sgId: null });
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDropTarget(null);
              }
            }}
            onDrop={() => handleDrop("__nonplaces__", null)}
            style={{
              background: `${C.yellow}08`,
              border: `1px solid ${C.yellow}33`,
              borderRadius: 10,
              padding: "12px 16px",
              maxHeight: isDesktop ? "calc(100vh - 150px)" : "none",
              overflowY: isDesktop ? "auto" : "visible",
              ...dropZoneStyle("__nonplaces__", null),
            }}
          >
            <div
              style={{
                color: C.yellow,
                fontWeight: 700,
                fontSize: 12,
                marginBottom: (enfantsNonPlaces.length > 0 || (dragging && dragging.type === "enfant")) ? 10 : 0,
              }}
            >
              {t("groups.unplaced", {
                count: enfantsNonPlaces.length,
                suffix: suffixPlural(enfantsNonPlaces.length),
              })}
              {dragging && dragging.type === "enfant"
                ? <span style={{ color: C.muted, fontWeight: 400, marginLeft: 8 }}>{t("groups.dropToRemove")}</span>
                : null}
            </div>

            {enfantsNonPlaces.length === 0 ? (
              <div style={{ color: C.muted, fontSize: 12 }}>{t("groups.noUnplaced")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {enfantsNonPlaces.map((enfant) => {
                  const incompatChildren = enfant.incompatiblesEnfants
                    .map((id) => children.find((entry) => entry.id === id))
                    .filter(Boolean)
                    .map((entry) => entry.nom);
                  const incompatAccos = enfant.incompatiblesAccos
                    .map((id) => supportWorkers.find((entry) => entry.id === id))
                    .filter(Boolean)
                    .map((entry) => entry.nom);
                  const groupesAge = groups.filter((group) => enfant.age >= group.ageMin && enfant.age <= group.ageMax);

                  return (
                    <div
                      key={enfant.id}
                      draggable
                      onDragStart={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        event.dataTransfer.setDragImage(event.currentTarget, event.clientX - rect.left, event.clientY - rect.top);
                        startDragEnfant(enfant, null, null);
                      }}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropTarget(null);
                      }}
                      style={{
                        background: C.card,
                        border: `1px solid ${C.border}`,
                        borderLeft: `3px solid ${C.yellow}`,
                        borderRadius: 7,
                        display: "grid",
                        gridTemplateColumns: "18px minmax(0, 1fr)",
                        overflow: "hidden",
                        cursor: "grab",
                        opacity: dragging && dragging.id === enfant.id ? 0.5 : 1,
                      }}
                    >
                      <DragHandleColumn iconSize={10} />
                      <div style={{ padding: "7px 11px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{enfant.nom}</span>
                          <span style={{ color: C.muted, fontSize: 11 }}>{`${enfant.age} - 1:${enfant.ratioMax}`}</span>
                        </div>

                        {groupesAge.length === 0 ? (
                          <div style={{ fontSize: 11, color: C.muted }}>{t("groups.noCompatibleGroup", { age: enfant.age })}</div>
                        ) : null}
                        {incompatChildren.length > 0 ? (
                          <div style={{ fontSize: 11, color: C.yellow }}>{`X ${incompatChildren.join(", ")}`}</div>
                        ) : null}
                        {incompatAccos.length > 0 ? (
                          <div style={{ fontSize: 11, color: C.red }}>{`- ${incompatAccos.join(", ")}`}</div>
                        ) : null}
                        {groupesAge.length > 0 && incompatChildren.length === 0 && incompatAccos.length === 0 ? (
                          <div style={{ fontSize: 11, color: C.muted }}>{t("groups.notAssignedYet")}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {groups.length === 0 && emptyStateMessage ? (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: 16,
                color: C.muted,
              }}
            >
              {emptyStateMessage}
            </div>
          ) : null}

        {groups.map((group) => {
          const conflicts = conflitsParGroupe[group.id] || [];
          const responsable = supportWorkers.find((acco) => acco.id === group.responsableId);
          const hasConflits = conflicts.length > 0;

          const enfantsAssignes = new Set(group.sousgroupes.flatMap((sg) => sg.enfantIds));
          const enfantsNonAssignes = group.enfantIds
            .map((enfantId) => children.find((enfant) => enfant.id === enfantId))
            .filter(Boolean)
            .filter((enfant) => !enfantsAssignes.has(enfant.id));

          const accosUtilises = new Set(group.sousgroupes.map((sg) => sg.accoId));
          const accosDispo = supportWorkers
            .filter((acco) => group.accoIds.includes(acco.id) && !accosUtilises.has(acco.id));

          return (
            <div
              key={group.id}
              style={{
                background: groupeBackground(group),
                border: `1.5px solid ${groupeBorderColor(group)}`,
                borderRadius: 14,
                overflow: "hidden",
                transition: "border-color 0.2s, background 0.2s",
              }}
            >
              <div
                onDragOver={(event) => {
                  if (dragging && dragging.type === "acco") {
                    event.preventDefault();
                    setDropTarget({ groupeId: group.id, sgId: "header" });
                  }
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setDropTarget(null);
                  }
                }}
                onDrop={() => {
                  if (dragging && dragging.type === "acco") {
                    handleDrop(group.id, null);
                  }
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: `1px solid ${C.border}`,
                  ...(dragging && dragging.type === "acco" ? dropZoneStyle(group.id, "header") : {}),
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                  <span style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{group.nom}</span>
                  <span style={{ color: C.muted, fontSize: 12 }}>
                    {`${group.ageMin}-${group.ageMax} ${t("common.years")}`}
                    {responsable ? (
                      <>
                        {` - ${t("common.responsable")} `}
                        <span style={{ color: C.text }}>{responsable.nom}</span>
                      </>
                    ) : null}
                    {` - ${t("groups.childrenCount", { count: group.enfantIds.length, suffix: suffixPlural(group.enfantIds.length) })}`}
                  </span>
                  {dragging && dragging.type === "acco" ? (
                    <span style={{ fontSize: 11, color: C.accent }}>{t("groups.dropAccoHint")}</span>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                  {group.accoIds.map((accoId) => {
                    const acco = supportWorkers.find((item) => item.id === accoId);
                    if (!acco) {
                      return null;
                    }
                    const isDragging = dragging && dragging.id === accoId;
                    return (
                      <div
                        key={accoId}
                        draggable
                        onDragStart={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          event.dataTransfer.setDragImage(event.currentTarget, event.clientX - rect.left, event.clientY - rect.top);
                          startDragAcco(acco, group.id);
                        }}
                        onDragEnd={() => {
                          setDragging(null);
                          setDropTarget(null);
                        }}
                        style={{
                          background: isDragging ? C.accentDim : C.surface,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          display: "grid",
                          gridTemplateColumns: "14px minmax(0, 1fr)",
                          overflow: "hidden",
                          fontSize: 11,
                          color: C.muted,
                          cursor: "grab",
                          opacity: isDragging ? 0.4 : 1,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRight: `1px solid ${C.border}`,
                            background: `${C.bg}26`,
                          }}
                        >
                          <DragHandleIcon size={8} color={C.muted} />
                        </div>
                        <span style={{ padding: "2px 8px", whiteSpace: "nowrap" }}>{`${acco.nom}${group.responsableId === accoId ? " *" : ""}`}</span>
                      </div>
                    );
                  })}

                  {hasConflits
                    ? <Badge color={C.red}>{`! ${conflicts.length}`}</Badge>
                    : <Badge color={C.green}>{t("label.ok")}</Badge>}
                  <Btn small variant="ghost" onClick={() => setModalForm(group)}>{t("common.edit")}</Btn>
                  <Btn small variant="danger" onClick={() => setGroups((prev) => prev.filter((entry) => entry.id !== group.id))}>{t("common.delete")}</Btn>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 0,
                  borderBottom: group.sousgroupes.length > 0 || enfantsNonAssignes.length > 0
                    ? `1px solid ${C.border}`
                    : "none",
                }}
              >
                {group.sousgroupes.map((sg, index) => {
                  const acco = supportWorkers.find((item) => item.id === sg.accoId);
                  const membres = children.filter((enfant) => sg.enfantIds.includes(enfant.id));
                  const sgConflits = validerSousGroupe(sg, group, children, supportWorkers, t);
                  const isResponsable = sg.accoId === group.responsableId;

                  return (
                    <div
                      key={sg.id}
                      onDragOver={(event) => {
                        if (dragging && dragging.type === "enfant") {
                          event.preventDefault();
                          setDropTarget({ groupeId: group.id, sgId: sg.id });
                        }
                      }}
                      onDragLeave={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          setDropTarget(null);
                        }
                      }}
                      onDrop={() => {
                        if (dragging && dragging.type === "enfant") {
                          handleDrop(group.id, sg.id);
                        }
                      }}
                      style={{
                        flex: "1 1 220px",
                        padding: "12px 18px",
                        borderRight: index < group.sousgroupes.length - 1 ? `1px solid ${C.border}` : "none",
                        borderLeft: sgBorderLeft(group, sg),
                        transition: "border-left 0.15s",
                        ...(dragging && dragging.type === "enfant" ? dropZoneStyle(group.id, sg.id) : {}),
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>
                          {acco ? acco.nom : "-"}
                          {isResponsable ? <span style={{ color: C.yellow, fontSize: 10, marginLeft: 5 }}>*</span> : null}
                        </span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {sgConflits.length > 0
                            ? <Badge color={C.red}>{`! ${sgConflits.length}`}</Badge>
                            : <Badge color={C.green}>{t("label.ok")}</Badge>}
                          <button
                            type="button"
                            onClick={() => {
                              setGroups((prev) => prev.map((entry) => {
                                if (entry.id !== group.id) {
                                  return entry;
                                }
                                return { ...entry, sousgroupes: entry.sousgroupes.filter((sub) => sub.id !== sg.id) };
                              }));
                            }}
                            title={t("groups.removeSubgroup")}
                            style={{
                              background: "none",
                              border: "none",
                              color: C.faint,
                              cursor: "pointer",
                              fontSize: 16,
                              lineHeight: 1,
                              padding: "0 2px",
                            }}
                          >
                            x
                          </button>
                        </div>
                      </div>

                      {sgConflits.map((conflict, conflictIndex) => <ConflitRow key={conflictIndex} c={conflict} />)}

                      {dragging && dragging.type === "enfant" ? (() => {
                        const compat = dragging.compat && dragging.compat[group.id]
                          ? dragging.compat[group.id].sgs[sg.id]
                          : null;
                        if (!compat || compat.ok) {
                          return null;
                        }
                        return (
                          <div style={{ marginBottom: 6 }}>
                            {compat.conflicts.map((conflict, conflictIndex) => (
                              <div
                                key={conflictIndex}
                                style={{
                                  fontSize: 11,
                                  color: C.red,
                                  background: `${C.red}10`,
                                  borderRadius: 4,
                                  padding: "2px 6px",
                                  marginBottom: 2,
                                }}
                              >
                                {`! ${conflict}`}
                              </div>
                            ))}
                          </div>
                        );
                      })() : null}

                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: sgConflits.length > 0 ? 6 : 0 }}>
                        {membres.map((enfant) => (
                          <EnfantChip
                            key={enfant.id}
                            enfant={enfant}
                            fromGroupeId={group.id}
                            fromSgId={sg.id}
                            children={children}
                            supportWorkers={supportWorkers}
                            draggingId={dragging ? dragging.id : null}
                            onDragStart={startDragEnfant}
                            onDragEnd={() => {
                              setDragging(null);
                              setDropTarget(null);
                            }}
                          />
                        ))}
                        {membres.length === 0 && !isOver(group.id, sg.id)
                          ? <div style={{ color: C.faint, fontSize: 12 }}>{t("groups.dropHere")}</div>
                          : null}
                      </div>

                      {(() => {
                        const disponibles = children.filter((enfant) => (
                          group.enfantIds.includes(enfant.id) && !sg.enfantIds.includes(enfant.id)
                        ));
                        if (disponibles.length === 0) {
                          return null;
                        }

                        return (
                          <select
                            value=""
                            onChange={(event) => {
                              const enfantId = event.target.value;
                              if (!enfantId) {
                                return;
                              }
                              setGroups((prev) => prev.map((entry) => {
                                if (entry.id !== group.id) {
                                  return entry;
                                }
                                return {
                                  ...entry,
                                  sousgroupes: entry.sousgroupes.map((sub) => {
                                    if (sub.id !== sg.id) {
                                      return { ...sub, enfantIds: sub.enfantIds.filter((id) => id !== enfantId) };
                                    }
                                    return { ...sub, enfantIds: [...sub.enfantIds, enfantId] };
                                  }),
                                };
                              }));
                            }}
                            style={{
                              marginTop: 8,
                              background: "none",
                              border: `1px dashed ${C.border}`,
                              borderRadius: 6,
                              padding: "3px 8px",
                              color: C.muted,
                              fontSize: 11,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              width: "100%",
                            }}
                          >
                            <option value="">{t("common.addEllipsis")}</option>
                            {disponibles.map((enfant) => (
                              <option key={enfant.id} value={enfant.id}>
                                {`${enfant.nom} - ${enfant.age} - 1:${enfant.ratioMax}`}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                  );
                })}

                {enfantsNonAssignes.length > 0 ? (
                  <div
                    onDragOver={(event) => {
                      if (dragging && dragging.type === "enfant") {
                        event.preventDefault();
                        setDropTarget({ groupeId: group.id, sgId: "__nonassignes__" });
                      }
                    }}
                    onDragLeave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget)) {
                        setDropTarget(null);
                      }
                    }}
                    onDrop={() => {
                      if (dragging && dragging.type === "enfant") {
                        handleDrop(group.id, null);
                      }
                    }}
                    style={{
                      flex: "1 1 220px",
                      padding: "12px 18px",
                      borderLeft: group.sousgroupes.length > 0 ? `1px solid ${C.border}` : "none",
                      background: `${C.yellow}06`,
                      ...(dragging && dragging.type === "enfant" ? dropZoneStyle(group.id, "__nonassignes__") : {}),
                    }}
                  >
                    <div style={{ fontSize: 12, color: C.yellow, fontWeight: 700, marginBottom: 8 }}>
                      {t("groups.nonAssignes", { count: enfantsNonAssignes.length })}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {enfantsNonAssignes.map((enfant) => {
                        const raisons = diagnostiquerEnfant(enfant, group, children, supportWorkers, group.sousgroupes, false, t);
                        return (
                          <div key={enfant.id}>
                            <EnfantChip
                              enfant={enfant}
                              fromGroupeId={group.id}
                              fromSgId={null}
                              children={children}
                              supportWorkers={supportWorkers}
                              draggingId={dragging ? dragging.id : null}
                              onDragStart={startDragEnfant}
                              onDragEnd={() => {
                                setDragging(null);
                                setDropTarget(null);
                              }}
                            />
                            {group.sousgroupes.length > 0
                              ? raisons.map((raison, idx) => (
                                <div key={idx} style={{ fontSize: 11, color: C.muted, paddingLeft: 9, marginTop: 1 }}>
                                  - {raison}
                                </div>
                              ))
                              : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>

              {accosDispo.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: C.muted }}>{t("groups.addSubgroupFor")}</span>
                  {accosDispo.map((acco) => (
                    <button
                      key={acco.id}
                      type="button"
                      onClick={() => {
                        const newSubgroup = { id: newSgId(), accoId: acco.id, enfantIds: [] };
                        setGroups((prev) => prev.map((entry) => (
                          entry.id === group.id
                            ? { ...entry, sousgroupes: [...entry.sousgroupes, newSubgroup] }
                            : entry
                        )));
                      }}
                      style={{
                        background: "none",
                        border: `1px dashed ${C.border}`,
                        borderRadius: 6,
                        color: C.muted,
                        fontSize: 11,
                        padding: "2px 9px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {acco.nom}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        </div>
      </div>

      {modalForm ? (
        <GroupFormModal
          initial={modalForm === "new" ? null : modalForm}
          children={children}
          supportWorkers={supportWorkers}
          groups={groups}
          onSave={saveGroupe}
          onClose={() => setModalForm(null)}
          t={t}
        />
      ) : null}

      {modalAuto ? (
        <GlobalAutoAssignModal
          groups={groups}
          children={children}
          supportWorkers={supportWorkers}
          onClose={() => setModalAuto(false)}
          onApply={(nouveauxGroupes, idsNonPlaces) => {
            const groupesPropres = nouveauxGroupes.map((group) => ({
              ...group,
              enfantIds: group.enfantIds.filter((id) => !(idsNonPlaces || []).includes(id)),
              sousgroupes: group.sousgroupes.map((sg) => ({
                ...sg,
                enfantIds: sg.enfantIds.filter((id) => !(idsNonPlaces || []).includes(id)),
              })),
            }));
            setGroups(groupesPropres);
          }}
          t={t}
        />
      ) : null}
    </div>
  );
}
