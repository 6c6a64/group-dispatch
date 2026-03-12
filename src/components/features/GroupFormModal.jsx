import React from "react";
import { Btn, Inp, Modal, Pill } from "../ui/atoms";
import { C } from "../../app/palette";

export function GroupFormModal({ initial, children, supportWorkers, groups, onSave, onClose, t }) {
  const isNew = !initial;

  const [form, setForm] = React.useState(initial
    ? { ...initial, ageMin: String(initial.ageMin), ageMax: String(initial.ageMax) }
    : {
      nom: "",
      ageMin: "",
      ageMax: "",
      responsableId: "",
      enfantIds: [],
      accoIds: [],
      sousgroupes: [],
    });

  const accosDispo = supportWorkers.filter((acco) => !groups
    .filter((group) => group.id !== (initial ? initial.id : null))
    .some((group) => group.accoIds.includes(acco.id)));

  const toggle = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }));
  };

  const setResponsable = (value) => {
    setForm((prev) => ({
      ...prev,
      responsableId: value,
      accoIds: prev.accoIds.includes(value) ? prev.accoIds : [...prev.accoIds, value],
    }));
  };

  const handleSave = () => {
    if (!form.nom) {
      return;
    }

    onSave({
      ...form,
      id: initial ? initial.id : `g${Date.now()}`,
      ageMin: Number.parseInt(form.ageMin, 10) || 0,
      ageMax: Number.parseInt(form.ageMax, 10) || 99,
    });
  };

  return (
    <Modal title={isNew ? t("form.group.new") : t("form.group.edit", { name: initial.nom })} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>{t("form.group.name")}</label>
          <Inp
            value={form.nom}
            onChange={(value) => setForm((prev) => ({ ...prev, nom: value }))}
            placeholder={t("form.group.namePlaceholder")}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t("form.group.ageMin")}</label>
            <Inp
              type="number"
              value={form.ageMin}
              onChange={(value) => setForm((prev) => ({ ...prev, ageMin: value }))}
              placeholder="6"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>{t("form.group.ageMax")}</label>
            <Inp
              type="number"
              value={form.ageMax}
              onChange={(value) => setForm((prev) => ({ ...prev, ageMax: value }))}
              placeholder="12"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>{t("form.group.supportWorkers")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {accosDispo.map((acco) => (
              <Pill
                key={acco.id}
                active={form.accoIds.includes(acco.id)}
                color={C.accent}
                onClick={() => toggle("accoIds", acco.id)}
              >
                {acco.nom}
              </Pill>
            ))}
          </div>
        </div>

        {form.accoIds.length > 0 ? (
          <div>
            <label style={labelStyle}>{t("form.group.responsable")}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {form.accoIds.map((accoId) => {
                const acco = supportWorkers.find((item) => item.id === accoId);
                if (!acco) {
                  return null;
                }
                return (
                  <Pill
                    key={accoId}
                    active={form.responsableId === accoId}
                    color={C.yellow}
                    onClick={() => setResponsable(accoId)}
                  >
                    {acco.nom}
                  </Pill>
                );
              })}
            </div>
          </div>
        ) : null}

        <div>
          <label style={labelStyle}>{t("form.group.children")}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 180, overflowY: "auto" }}>
            {children.map((enfant) => {
              const dejaDansUnAutreGroupe = groups
                .filter((group) => group.id !== (initial ? initial.id : null))
                .some((group) => group.enfantIds.includes(enfant.id));
              const selected = form.enfantIds.includes(enfant.id);

              return (
                <button
                  key={enfant.id}
                  type="button"
                  onClick={() => {
                    if (!dejaDansUnAutreGroupe) {
                      toggle("enfantIds", enfant.id);
                    }
                  }}
                  style={{
                    background: selected ? `${C.green}15` : C.surface,
                    color: selected ? C.green : dejaDansUnAutreGroupe ? C.faint : C.muted,
                    border: `1px solid ${selected ? `${C.green}44` : C.border}`,
                    borderRadius: 6,
                    padding: "5px 10px",
                    fontSize: 12,
                    cursor: dejaDansUnAutreGroupe ? "not-allowed" : "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                  }}
                >
                  {`${enfant.nom} - ${enfant.age} ${t("common.years")} - 1:${enfant.ratioMax}`}
                  {dejaDansUnAutreGroupe ? (
                    <span style={{ marginLeft: 6, fontSize: 10, color: C.faint }}>
                      - {t("form.group.alreadyInGroup")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <Btn variant="ghost" onClick={onClose}>{t("common.cancel")}</Btn>
          <Btn onClick={handleSave} disabled={!form.nom}>{t("common.save")}</Btn>
        </div>
      </div>
    </Modal>
  );
}

const labelStyle = {
  color: C.muted,
  fontSize: 11,
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
