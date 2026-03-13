import { SPECIALITES } from "../domain/demoData";

const CHILDREN_HEADER_CONFIG = {
  required: ["nom", "age", "ratioMax"],
  aliases: {
    id: ["id", "identifier"],
    nom: ["nom", "name", "fullname", "full_name"],
    age: ["age"],
    ratioMax: ["ratiomax", "ratio_max", "ratio", "ratiomaximum"],
    incompatiblesEnfants: [
      "incompatiblesenfants",
      "incompatibles_enfants",
      "incompatchildren",
      "incompatible_children",
    ],
    incompatiblesAccos: [
      "incompatiblesaccos",
      "incompatibles_accos",
      "incompataides",
      "incompatible_aides",
      "incompatiblesupportworkers",
      "incompatible_support_workers",
    ],
  },
};

const SUPPORT_WORKERS_HEADER_CONFIG = {
  required: ["nom"],
  aliases: {
    id: ["id", "identifier"],
    nom: ["nom", "name", "fullname", "full_name"],
    specialites: ["specialites", "specialties", "speciality", "specialite"],
  },
};

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toLowerCase();
}

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeNameKey(value) {
  return normalizeName(value).toLowerCase();
}

function parseCsvLine(line, delimiter) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function detectDelimiter(headerLine) {
  const commaCount = parseCsvLine(headerLine, ",").length;
  const semicolonCount = parseCsvLine(headerLine, ";").length;
  return semicolonCount > commaCount ? ";" : ",";
}

function parseListCell(value) {
  return String(value || "")
    .split(/[;,]/g)
    .map((entry) => normalizeName(entry))
    .filter(Boolean);
}

function parseCsvRows(csvText) {
  const lines = String(csvText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
    };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);
  const rows = lines.slice(1).map((line, index) => ({
    line: index + 2,
    values: parseCsvLine(line, delimiter),
  }));

  return { headers, rows };
}

function resolveHeaders(headers, config) {
  const normalizedHeaders = headers.map((header) => normalizeHeader(header));
  const resolved = {};

  Object.entries(config.aliases).forEach(([canonicalKey, aliases]) => {
    const aliasSet = new Set(aliases.map((entry) => normalizeHeader(entry)));
    const foundIndex = normalizedHeaders.findIndex((entry) => aliasSet.has(entry));
    if (foundIndex >= 0) {
      resolved[canonicalKey] = foundIndex;
    }
  });

  const missingRequired = config.required.filter((key) => typeof resolved[key] !== "number");
  return {
    resolved,
    missingRequired,
  };
}

function getValueAt(values, index) {
  if (typeof index !== "number") {
    return "";
  }
  return String(values[index] || "").trim();
}

function createUniqueId(prefix, rowIndex) {
  return `${prefix}_import_${rowIndex + 1}`;
}

function buildDuplicateKeyMap(items, getValue) {
  const entriesByKey = new Map();
  items.forEach((item) => {
    const key = normalizeNameKey(getValue(item));
    if (!key) {
      return;
    }
    const existing = entriesByKey.get(key) || [];
    existing.push(item);
    entriesByKey.set(key, existing);
  });
  return entriesByKey;
}

function pushDuplicateErrors(errors, duplicateMap, fieldLabel, getDisplayValue) {
  duplicateMap.forEach((entries, key) => {
    if (entries.length <= 1) {
      return;
    }

    entries.forEach((entry) => {
      errors.push({
        line: entry.line,
        field: fieldLabel,
        message: `Duplicate ${fieldLabel}: "${normalizeName(getDisplayValue ? getDisplayValue(entry) : key)}"`,
      });
    });
  });
}

function buildUniqueNameMap(items) {
  const map = new Map();
  const duplicates = new Set();

  items.forEach((item) => {
    const key = normalizeNameKey(item.nom);
    if (!key) {
      return;
    }
    if (map.has(key)) {
      duplicates.add(key);
      return;
    }
    map.set(key, item);
  });

  return { map, duplicates };
}

function toPreviewResult(entityType, rowsTotal, items, errors) {
  return {
    entityType,
    rowsTotal,
    validCount: errors.length === 0 ? items.length : 0,
    errors,
    items: errors.length === 0 ? items : [],
  };
}

export function validateChildrenCsv(csvText, supportWorkers) {
  const { headers, rows } = parseCsvRows(csvText);
  const errors = [];

  if (headers.length === 0) {
    return toPreviewResult("children", 0, [], [{ line: 1, field: "file", message: "CSV is empty." }]);
  }

  const { resolved, missingRequired } = resolveHeaders(headers, CHILDREN_HEADER_CONFIG);
  missingRequired.forEach((key) => {
    errors.push({ line: 1, field: key, message: `Missing required column "${key}".` });
  });

  if (errors.length > 0) {
    return toPreviewResult("children", rows.length, [], errors);
  }

  const draftChildren = [];

  rows.forEach((row, index) => {
    const nom = normalizeName(getValueAt(row.values, resolved.nom));
    const ageRaw = getValueAt(row.values, resolved.age);
    const ratioRaw = getValueAt(row.values, resolved.ratioMax);
    const idRaw = normalizeName(getValueAt(row.values, resolved.id));

    if (!nom) {
      errors.push({ line: row.line, field: "nom", message: "Name is required." });
      return;
    }

    const age = Number.parseInt(ageRaw, 10);
    if (!Number.isFinite(age)) {
      errors.push({ line: row.line, field: "age", message: `Invalid age "${ageRaw}".` });
      return;
    }

    const ratioMax = Number.parseInt(ratioRaw, 10);
    if (!Number.isFinite(ratioMax) || ratioMax < 1 || ratioMax > 9) {
      errors.push({ line: row.line, field: "ratioMax", message: `Invalid ratioMax "${ratioRaw}" (expected 1..9).` });
      return;
    }

    draftChildren.push({
      line: row.line,
      rowIndex: index,
      id: idRaw || createUniqueId("e", index),
      nom,
      age,
      ratioMax,
      incompatChildrenNames: parseListCell(getValueAt(row.values, resolved.incompatiblesEnfants)),
      incompatSupportWorkerNames: parseListCell(getValueAt(row.values, resolved.incompatiblesAccos)),
    });
  });

  const nameDuplicates = buildDuplicateKeyMap(draftChildren, (entry) => entry.nom);
  pushDuplicateErrors(errors, nameDuplicates, "name", (entry) => entry.nom);

  const idDuplicates = buildDuplicateKeyMap(draftChildren, (entry) => entry.id);
  pushDuplicateErrors(errors, idDuplicates, "id", (entry) => entry.id);

  const { map: importedChildrenByName, duplicates: importedChildrenDuplicateNames } = buildUniqueNameMap(draftChildren);
  importedChildrenDuplicateNames.forEach((nameKey) => {
    errors.push({
      line: 1,
      field: "nom",
      message: `Ambiguous child name "${nameKey}" in import.`,
    });
  });

  const supportWorkersForLookup = (supportWorkers || []).map((entry, index) => ({
    line: index + 1,
    nom: normalizeName(entry.nom),
    id: entry.id,
  }));
  const { map: supportWorkersByName, duplicates: supportWorkersDuplicateNames } = buildUniqueNameMap(supportWorkersForLookup);

  draftChildren.forEach((entry) => {
    const incompatiblesEnfants = [];
    entry.incompatChildrenNames.forEach((name) => {
      const key = normalizeNameKey(name);
      if (key === normalizeNameKey(entry.nom)) {
        errors.push({
          line: entry.line,
          field: "incompatiblesEnfants",
          message: `Child "${entry.nom}" cannot be incompatible with itself.`,
        });
        return;
      }
      if (!importedChildrenByName.has(key)) {
        errors.push({
          line: entry.line,
          field: "incompatiblesEnfants",
          message: `Unknown child "${name}".`,
        });
        return;
      }
      incompatiblesEnfants.push(importedChildrenByName.get(key).id);
    });

    const incompatiblesAccos = [];
    entry.incompatSupportWorkerNames.forEach((name) => {
      const key = normalizeNameKey(name);
      if (supportWorkersDuplicateNames.has(key)) {
        errors.push({
          line: entry.line,
          field: "incompatiblesAccos",
          message: `Ambiguous aide name "${name}".`,
        });
        return;
      }
      if (!supportWorkersByName.has(key)) {
        errors.push({
          line: entry.line,
          field: "incompatiblesAccos",
          message: `Unknown aide "${name}".`,
        });
        return;
      }
      incompatiblesAccos.push(supportWorkersByName.get(key).id);
    });

    entry.incompatiblesEnfants = [...new Set(incompatiblesEnfants)];
    entry.incompatiblesAccos = [...new Set(incompatiblesAccos)];
  });

  const childrenItems = draftChildren.map((entry) => ({
    id: entry.id,
    nom: entry.nom,
    age: entry.age,
    ratioMax: entry.ratioMax,
    incompatiblesEnfants: entry.incompatiblesEnfants || [],
    incompatiblesAccos: entry.incompatiblesAccos || [],
  }));

  return toPreviewResult("children", rows.length, childrenItems, errors);
}

export function validateSupportWorkersCsv(csvText) {
  const { headers, rows } = parseCsvRows(csvText);
  const errors = [];

  if (headers.length === 0) {
    return toPreviewResult("supportWorkers", 0, [], [{ line: 1, field: "file", message: "CSV is empty." }]);
  }

  const { resolved, missingRequired } = resolveHeaders(headers, SUPPORT_WORKERS_HEADER_CONFIG);
  missingRequired.forEach((key) => {
    errors.push({ line: 1, field: key, message: `Missing required column "${key}".` });
  });

  if (errors.length > 0) {
    return toPreviewResult("supportWorkers", rows.length, [], errors);
  }

  const specialitesByKey = new Map(
    SPECIALITES.map((specialite) => [normalizeNameKey(specialite), specialite]),
  );

  const draftSupportWorkers = [];

  rows.forEach((row, index) => {
    const nom = normalizeName(getValueAt(row.values, resolved.nom));
    const idRaw = normalizeName(getValueAt(row.values, resolved.id));

    if (!nom) {
      errors.push({ line: row.line, field: "nom", message: "Name is required." });
      return;
    }

    const specialitesInput = parseListCell(getValueAt(row.values, resolved.specialites));
    const specialites = [];

    specialitesInput.forEach((entry) => {
      const key = normalizeNameKey(entry);
      if (!specialitesByKey.has(key)) {
        errors.push({
          line: row.line,
          field: "specialites",
          message: `Unknown speciality "${entry}".`,
        });
        return;
      }
      specialites.push(specialitesByKey.get(key));
    });

    draftSupportWorkers.push({
      line: row.line,
      rowIndex: index,
      id: idRaw || createUniqueId("a", index),
      nom,
      specialites: [...new Set(specialites)],
    });
  });

  const nameDuplicates = buildDuplicateKeyMap(draftSupportWorkers, (entry) => entry.nom);
  pushDuplicateErrors(errors, nameDuplicates, "name", (entry) => entry.nom);

  const idDuplicates = buildDuplicateKeyMap(draftSupportWorkers, (entry) => entry.id);
  pushDuplicateErrors(errors, idDuplicates, "id", (entry) => entry.id);

  const supportWorkerItems = draftSupportWorkers.map((entry) => ({
    id: entry.id,
    nom: entry.nom,
    specialites: entry.specialites,
  }));

  return toPreviewResult("supportWorkers", rows.length, supportWorkerItems, errors);
}

export function buildChildrenCsvTemplate() {
  return [
    "nom,age,ratioMax,incompatiblesEnfants,incompatiblesAccos,id",
    "Lea M.,7,2,Tom B.;Jade R.,Marie F.,",
  ].join("\n");
}

export function buildSupportWorkersCsvTemplate() {
  return [
    "nom,specialites,id",
    "Marie F.,TSA;TDAH,",
  ].join("\n");
}
