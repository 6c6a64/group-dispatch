import React from "react";
import { C } from "../../app/palette";
import { SPECIALITES } from "../../domain/demoData";
import { Btn, Inp, Modal, Pill } from "../ui/atoms";

export function SupportWorkersTab({ supportWorkers, setSupportWorkers, groups, t, emptyStateMessage }) {
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({ nom: "", specialites: [] });

  const groupForSupportWorker = (id) => groups.find((group) => group.accoIds.includes(id));

  const openAdd = () => {
    setForm({ nom: "", specialites: [] });
    setModal("add");
  };

  const openEdit = (supportWorker) => {
    setForm({ ...supportWorker });
    setModal(supportWorker);
  };

  const save = () => {
    if (!form.nom) {
      return;
    }

    const entry = { ...form, id: modal === "add" ? `a${Date.now()}` : modal.id };
    setSupportWorkers((prev) => (modal === "add"
      ? [...prev, entry]
      : prev.map((supportWorker) => (supportWorker.id === entry.id ? entry : supportWorker))));
    setModal(null);
  };

  const toggleSpec = (specialite) => {
    setForm((prev) => ({
      ...prev,
      specialites: prev.specialites.includes(specialite)
        ? prev.specialites.filter((item) => item !== specialite)
        : [...prev.specialites, specialite],
    }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>{t("supportWorkers.title")}</h2>
        <Btn onClick={openAdd}>{t("supportWorkers.add")}</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
        {supportWorkers.length === 0 && emptyStateMessage ? (
          <div
            style={{
              gridColumn: "1 / -1",
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

        {supportWorkers.map((supportWorker) => {
          const group = groupForSupportWorker(supportWorker.id);
          const isResponsable = group && group.responsableId === supportWorker.id;

          return (
            <div key={supportWorker.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontWeight: 700, color: C.text }}>
                  {supportWorker.nom}
                  {isResponsable
                    ? <span style={{ color: C.yellow, fontWeight: 400, fontSize: 12, marginLeft: 6 }}>{t("supportWorkers.responsable")}</span>
                    : null}
                </div>
              </div>

              <div style={{ color: C.muted, fontSize: 12, marginBottom: 8 }}>
                {supportWorker.specialites.length > 0 ? supportWorker.specialites.join(", ") : t("supportWorkers.noSpec")}
              </div>

              {group
                ? <div style={{ fontSize: 11, color: C.accent, marginBottom: 6 }}>{group.nom}</div>
                : <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{t("common.unassigned")}</div>}

              <div style={{ display: "flex", gap: 6 }}>
                <Btn small variant="ghost" onClick={() => openEdit(supportWorker)}>{t("common.edit")}</Btn>
                <Btn small variant="danger" onClick={() => setSupportWorkers((prev) => prev.filter((entry) => entry.id !== supportWorker.id))}>{t("common.delete")}</Btn>
              </div>
            </div>
          );
        })}
      </div>

      {modal ? (
        <Modal title={modal === "add" ? t("supportWorkers.addTitle") : t("supportWorkers.edit", { name: modal.nom })} onClose={() => setModal(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={labelStyle}>{t("supportWorkers.name")}</label>
              <Inp
                value={form.nom}
                onChange={(value) => setForm((prev) => ({ ...prev, nom: value }))}
                placeholder={t("supportWorkers.namePlaceholder")}
              />
            </div>

            <div>
              <label style={labelStyle}>{t("supportWorkers.specs")}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {SPECIALITES.map((specialite) => (
                  <Pill
                    key={specialite}
                    active={form.specialites.includes(specialite)}
                    color={C.purple}
                    onClick={() => toggleSpec(specialite)}
                  >
                    {specialite}
                  </Pill>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setModal(null)}>{t("common.cancel")}</Btn>
              <Btn onClick={save} disabled={!form.nom}>{t("common.save")}</Btn>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
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
