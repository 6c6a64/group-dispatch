import React from "react";
import { C } from "../../app/palette";
import { SPECIALITES } from "../../domain/demoData";
import { Btn, Inp, Modal, Pill } from "../ui/atoms";
import { suffixPlural } from "../../app/i18n";
import { sanitizeGroupsSnapshot } from "../../services/groupSnapshots";
import { buildSupportWorkersCsvTemplate, validateSupportWorkersCsv } from "../../services/csvImport";

export function SupportWorkersTab({
  supportWorkers,
  setSupportWorkers,
  groups,
  setGroups,
  children,
  t,
  emptyStateMessage,
}) {
  const [modal, setModal] = React.useState(null);
  const [form, setForm] = React.useState({ nom: "", specialites: [] });
  const [importModalOpen, setImportModalOpen] = React.useState(false);
  const [importPreview, setImportPreview] = React.useState(null);
  const [importFileName, setImportFileName] = React.useState("");
  const [importFeedback, setImportFeedback] = React.useState(null);
  const fileInputRef = React.useRef(null);

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

  const downloadTemplate = () => {
    const content = buildSupportWorkersCsvTemplate();
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aides_template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const openImportPicker = () => {
    if (!fileInputRef.current) {
      return;
    }
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      return;
    }

    try {
      const csvText = await file.text();
      const preview = validateSupportWorkersCsv(csvText);
      setImportPreview(preview);
      setImportFileName(file.name);
      setImportModalOpen(true);
      setImportFeedback(null);
    } catch (error) {
      setImportFeedback({
        tone: "error",
        text: t("import.fileReadError", { message: error && error.message ? error.message : String(error) }),
      });
    }
  };

  const applyImport = () => {
    if (!importPreview || importPreview.errors.length > 0) {
      return;
    }

    const confirmed = typeof window === "undefined"
      ? true
      : window.confirm(t("import.replaceConfirm", { entity: t("import.entitySupportWorkers") }));

    if (!confirmed) {
      return;
    }

    const importedSupportWorkers = importPreview.items;
    const sanitized = sanitizeGroupsSnapshot(groups, children, importedSupportWorkers);

    setSupportWorkers(importedSupportWorkers);
    if (typeof setGroups === "function") {
      setGroups(sanitized.groups);
    }

    setImportModalOpen(false);
    setImportPreview(null);
    setImportFeedback(
      sanitized.removedCount > 0
        ? {
          tone: "warning",
          text: t("import.appliedWithCleanup", {
            entity: t("import.entitySupportWorkers"),
            count: sanitized.removedCount,
            suffix: suffixPlural(sanitized.removedCount),
          }),
        }
        : {
          tone: "success",
          text: t("import.appliedSuccess", { entity: t("import.entitySupportWorkers") }),
        },
    );
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>{t("supportWorkers.title")}</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Btn small variant="ghost" onClick={downloadTemplate}>{t("import.downloadTemplate")}</Btn>
          <Btn small variant="ghost" onClick={openImportPicker}>{t("import.importCsv")}</Btn>
          <Btn onClick={openAdd}>{t("supportWorkers.add")}</Btn>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: "none" }}
        onChange={handleImportFile}
      />

      {importFeedback ? (
        <div
          style={{
            background: importFeedback.tone === "error"
              ? `${C.red}14`
              : importFeedback.tone === "warning"
                ? `${C.yellow}14`
                : `${C.green}14`,
            border: `1px solid ${importFeedback.tone === "error"
              ? `${C.red}44`
              : importFeedback.tone === "warning"
                ? `${C.yellow}44`
                : `${C.green}44`}`,
            color: importFeedback.tone === "error"
              ? C.red
              : importFeedback.tone === "warning"
                ? C.yellow
                : C.green,
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          {importFeedback.text}
        </div>
      ) : null}

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

      {importModalOpen && importPreview ? (
        <Modal
          wide
          title={t("import.previewTitle", { entity: t("import.entitySupportWorkers") })}
          onClose={() => setImportModalOpen(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ color: C.muted, fontSize: 12 }}>{importFileName || "-"}</div>
            <div style={{ color: C.yellow, fontSize: 12 }}>{t("import.replaceImpact", { entity: t("import.entitySupportWorkers") })}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={previewMetricStyle}>
                <div style={previewMetricLabelStyle}>{t("import.totalRows")}</div>
                <div style={previewMetricValueStyle}>{importPreview.rowsTotal}</div>
              </div>
              <div style={previewMetricStyle}>
                <div style={previewMetricLabelStyle}>{t("import.validRows")}</div>
                <div style={previewMetricValueStyle}>{importPreview.validCount}</div>
              </div>
              <div style={previewMetricStyle}>
                <div style={previewMetricLabelStyle}>{t("import.errorCount")}</div>
                <div style={previewMetricValueStyle}>{importPreview.errors.length}</div>
              </div>
            </div>

            {importPreview.errors.length > 0 ? (
              <div
                style={{
                  background: `${C.red}10`,
                  border: `1px solid ${C.red}33`,
                  borderRadius: 8,
                  padding: 10,
                  maxHeight: 240,
                  overflowY: "auto",
                }}
              >
                <div style={{ color: C.red, fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                  {t("import.blockingErrors")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {importPreview.errors.map((error, index) => (
                    <div key={index} style={{ color: C.red, fontSize: 12 }}>
                      {`L${error.line} ${error.field ? `[${error.field}] ` : ""}${error.message}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color: C.green, fontSize: 12 }}>{t("import.noErrors")}</div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setImportModalOpen(false)}>{t("common.cancel")}</Btn>
              <Btn
                variant={importPreview.errors.length > 0 ? "ghost" : "primary"}
                onClick={applyImport}
                disabled={importPreview.errors.length > 0}
              >
                {t("import.applyImport")}
              </Btn>
            </div>
          </div>
        </Modal>
      ) : null}

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

const previewMetricStyle = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "7px 10px",
  minWidth: 120,
};

const previewMetricLabelStyle = {
  color: C.muted,
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const previewMetricValueStyle = {
  color: C.text,
  fontSize: 16,
  fontWeight: 800,
  marginTop: 2,
};

const labelStyle = {
  color: C.muted,
  fontSize: 11,
  display: "block",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
