import { cloneState, createDemoState, createEmptyState } from "../domain/demoData";
import { cloneGroups, normalizeSnapshotName, normalizeSnapshotNameKey } from "./groupSnapshots";
import { getSupabaseClient, isSupabaseConfigured } from "./supabaseClient";

const SAVE_DEBOUNCE_MS = 700;

let pendingState = null;
let debounceTimer = null;
let pendingWaiters = [];
let persistQueue = Promise.resolve();

function normalizeState(state) {
  return cloneState({
    children: state.children || [],
    supportWorkers: state.supportWorkers || [],
    groups: state.groups || [],
  });
}

async function getAuthenticatedClient() {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw new Error(`auth.getSession: ${error.message}`);
  }

  if (!data.session) {
    return null;
  }

  return client;
}

async function fetchRows(label, query) {
  const { data, error } = await query;
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  return data || [];
}

async function deleteAllRows(client, table, filterColumn) {
  const { error } = await client.from(table).delete().not(filterColumn, "is", null);
  if (error) {
    throw new Error(`${table}.delete: ${error.message}`);
  }
}

async function insertRows(client, table, rows) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await client.from(table).insert(rows);
  if (error) {
    throw new Error(`${table}.insert: ${error.message}`);
  }
}

function mapStateToRows(state) {
  const accosRows = state.supportWorkers.map((acco, index) => ({
    id: acco.id,
    nom: acco.nom,
    position: index,
  }));

  const accoSpecialitesRows = state.supportWorkers.flatMap((acco) => (
    (acco.specialites || []).map((specialite, index) => ({
      acco_id: acco.id,
      specialite: specialite,
      position: index,
    }))
  ));

  const enfantsRows = state.children.map((enfant, index) => ({
    id: enfant.id,
    nom: enfant.nom,
    age: enfant.age,
    ratio_max: enfant.ratioMax,
    position: index,
  }));

  const incompatEnfantsRows = state.children.flatMap((enfant) => (
    (enfant.incompatiblesEnfants || []).map((incompatibleEnfantId) => ({
      enfant_id: enfant.id,
      incompatible_enfant_id: incompatibleEnfantId,
    }))
  ));

  const incompatAccosRows = state.children.flatMap((enfant) => (
    (enfant.incompatiblesAccos || []).map((accoId) => ({
      enfant_id: enfant.id,
      acco_id: accoId,
    }))
  ));

  const groupesRows = state.groups.map((group, index) => ({
    id: group.id,
    nom: group.nom,
    age_min: group.ageMin,
    age_max: group.ageMax,
    responsable_id: group.responsableId || null,
    position: index,
  }));

  const groupesAccosRows = state.groups.flatMap((group) => (
    (group.accoIds || []).map((accoId, index) => ({
      groupe_id: group.id,
      acco_id: accoId,
      position: index,
    }))
  ));

  const groupesEnfantsRows = state.groups.flatMap((group) => (
    (group.enfantIds || []).map((enfantId, index) => ({
      groupe_id: group.id,
      enfant_id: enfantId,
      position: index,
    }))
  ));

  const sousgroupesRows = state.groups.flatMap((group) => (
    (group.sousgroupes || []).map((sg, index) => ({
      id: sg.id,
      groupe_id: group.id,
      acco_id: sg.accoId,
      position: index,
    }))
  ));

  const sousgroupesEnfantsRows = state.groups.flatMap((group) => (
    (group.sousgroupes || []).flatMap((sg) => (
      (sg.enfantIds || []).map((enfantId, index) => ({
        sousgroupe_id: sg.id,
        groupe_id: group.id,
        enfant_id: enfantId,
        position: index,
      }))
    ))
  ));

  return {
    accosRows,
    accoSpecialitesRows,
    enfantsRows,
    incompatEnfantsRows,
    incompatAccosRows,
    groupesRows,
    groupesAccosRows,
    groupesEnfantsRows,
    sousgroupesRows,
    sousgroupesEnfantsRows,
  };
}

async function persistStateToSupabase(client, state) {
  const rows = mapStateToRows(state);

  await deleteAllRows(client, "sousgroupes_enfants", "sousgroupe_id");
  await deleteAllRows(client, "sousgroupes", "id");
  await deleteAllRows(client, "groupes_enfants", "enfant_id");
  await deleteAllRows(client, "groupes_accos", "acco_id");
  await deleteAllRows(client, "groupes", "id");
  await deleteAllRows(client, "enfants_incompat_enfants", "enfant_id");
  await deleteAllRows(client, "enfants_incompat_accos", "enfant_id");
  await deleteAllRows(client, "enfants", "id");
  await deleteAllRows(client, "acco_specialites", "acco_id");
  await deleteAllRows(client, "accos", "id");

  await insertRows(client, "accos", rows.accosRows);
  await insertRows(client, "acco_specialites", rows.accoSpecialitesRows);

  await insertRows(client, "enfants", rows.enfantsRows);
  await insertRows(client, "enfants_incompat_enfants", rows.incompatEnfantsRows);
  await insertRows(client, "enfants_incompat_accos", rows.incompatAccosRows);

  await insertRows(client, "groupes", rows.groupesRows);
  await insertRows(client, "groupes_accos", rows.groupesAccosRows);
  await insertRows(client, "groupes_enfants", rows.groupesEnfantsRows);

  await insertRows(client, "sousgroupes", rows.sousgroupesRows);
  await insertRows(client, "sousgroupes_enfants", rows.sousgroupesEnfantsRows);
}

async function loadStateFromSupabase(client) {
  const [
    accosRows,
    accoSpecialitesRows,
    enfantsRows,
    incompatEnfantsRows,
    incompatAccosRows,
    groupesRows,
    groupesAccosRows,
    groupesEnfantsRows,
    sousgroupesRows,
    sousgroupesEnfantsRows,
  ] = await Promise.all([
    fetchRows(
      "supportWorkers.select",
      client.from("accos").select("id, nom, position").order("position", { ascending: true }).order("id", { ascending: true }),
    ),
    fetchRows(
      "acco_specialites.select",
      client
        .from("acco_specialites")
        .select("acco_id, specialite, position")
        .order("acco_id", { ascending: true })
        .order("position", { ascending: true }),
    ),
    fetchRows(
      "children.select",
      client
        .from("enfants")
        .select("id, nom, age, ratio_max, position")
        .order("position", { ascending: true })
        .order("id", { ascending: true }),
    ),
    fetchRows(
      "enfants_incompat_enfants.select",
      client
        .from("enfants_incompat_enfants")
        .select("enfant_id, incompatible_enfant_id")
        .order("enfant_id", { ascending: true }),
    ),
    fetchRows(
      "enfants_incompat_accos.select",
      client
        .from("enfants_incompat_accos")
        .select("enfant_id, acco_id")
        .order("enfant_id", { ascending: true }),
    ),
    fetchRows(
      "groups.select",
      client
        .from("groupes")
        .select("id, nom, age_min, age_max, responsable_id, position")
        .order("position", { ascending: true })
        .order("id", { ascending: true }),
    ),
    fetchRows(
      "groupes_accos.select",
      client
        .from("groupes_accos")
        .select("groupe_id, acco_id, position")
        .order("groupe_id", { ascending: true })
        .order("position", { ascending: true }),
    ),
    fetchRows(
      "groupes_enfants.select",
      client
        .from("groupes_enfants")
        .select("groupe_id, enfant_id, position")
        .order("groupe_id", { ascending: true })
        .order("position", { ascending: true }),
    ),
    fetchRows(
      "sousgroupes.select",
      client
        .from("sousgroupes")
        .select("id, groupe_id, acco_id, position")
        .order("groupe_id", { ascending: true })
        .order("position", { ascending: true }),
    ),
    fetchRows(
      "sousgroupes_enfants.select",
      client
        .from("sousgroupes_enfants")
        .select("sousgroupe_id, groupe_id, enfant_id, position")
        .order("groupe_id", { ascending: true })
        .order("sousgroupe_id", { ascending: true })
        .order("position", { ascending: true }),
    ),
  ]);

  const accosById = new Map();
  for (const row of accosRows) {
    accosById.set(row.id, {
      id: row.id,
      nom: row.nom,
      specialites: [],
    });
  }

  for (const row of accoSpecialitesRows) {
    const acco = accosById.get(row.acco_id);
    if (!acco || acco.specialites.includes(row.specialite)) {
      continue;
    }
    acco.specialites.push(row.specialite);
  }

  const enfantsById = new Map();
  for (const row of enfantsRows) {
    enfantsById.set(row.id, {
      id: row.id,
      nom: row.nom,
      age: row.age,
      ratioMax: row.ratio_max,
      incompatiblesEnfants: [],
      incompatiblesAccos: [],
    });
  }

  for (const row of incompatEnfantsRows) {
    const enfant = enfantsById.get(row.enfant_id);
    if (!enfant || enfant.incompatiblesEnfants.includes(row.incompatible_enfant_id)) {
      continue;
    }
    enfant.incompatiblesEnfants.push(row.incompatible_enfant_id);
  }

  for (const row of incompatAccosRows) {
    const enfant = enfantsById.get(row.enfant_id);
    if (!enfant || enfant.incompatiblesAccos.includes(row.acco_id)) {
      continue;
    }
    enfant.incompatiblesAccos.push(row.acco_id);
  }

  const groupesById = new Map();
  for (const row of groupesRows) {
    groupesById.set(row.id, {
      id: row.id,
      nom: row.nom,
      ageMin: row.age_min,
      ageMax: row.age_max,
      responsableId: row.responsable_id || "",
      enfantIds: [],
      accoIds: [],
      sousgroupes: [],
    });
  }

  for (const row of groupesAccosRows) {
    const group = groupesById.get(row.groupe_id);
    if (!group || group.accoIds.includes(row.acco_id)) {
      continue;
    }
    group.accoIds.push(row.acco_id);
  }

  for (const row of groupesEnfantsRows) {
    const group = groupesById.get(row.groupe_id);
    if (!group || group.enfantIds.includes(row.enfant_id)) {
      continue;
    }
    group.enfantIds.push(row.enfant_id);
  }

  const sousgroupesById = new Map();
  for (const row of sousgroupesRows) {
    const group = groupesById.get(row.groupe_id);
    if (!group) {
      continue;
    }

    const sg = {
      id: row.id,
      accoId: row.acco_id,
      enfantIds: [],
    };

    sousgroupesById.set(row.id, sg);
    group.sousgroupes.push(sg);
  }

  for (const row of sousgroupesEnfantsRows) {
    const sg = sousgroupesById.get(row.sousgroupe_id);
    const group = groupesById.get(row.groupe_id);

    if (!sg || !group) {
      continue;
    }

    if (!sg.enfantIds.includes(row.enfant_id)) {
      sg.enfantIds.push(row.enfant_id);
    }

    if (!group.enfantIds.includes(row.enfant_id)) {
      group.enfantIds.push(row.enfant_id);
    }
  }

  return {
    children: [...enfantsById.values()],
    supportWorkers: [...accosById.values()],
    groups: [...groupesById.values()],
  };
}

async function listSnapshotNames(client) {
  const rows = await fetchRows(
    "group_layout_snapshots.selectNames",
    client
      .from("group_layout_snapshots")
      .select("name"),
  );

  return rows
    .map((row) => normalizeSnapshotName(row.name))
    .filter(Boolean);
}

function buildCopySnapshotName(baseName, existingNames) {
  const normalizedExisting = new Set(existingNames.map((name) => normalizeSnapshotNameKey(name)));
  const baseKey = normalizeSnapshotNameKey(baseName);

  if (!normalizedExisting.has(baseKey)) {
    return {
      name: baseName,
      copiedFromName: null,
    };
  }

  let index = 1;
  while (index < 5000) {
    const candidate = index === 1 ? `${baseName} (copy)` : `${baseName} (copy ${index})`;
    const candidateKey = normalizeSnapshotNameKey(candidate);
    if (!normalizedExisting.has(candidateKey)) {
      return {
        name: candidate,
        copiedFromName: baseName,
      };
    }
    index += 1;
  }

  throw new Error("Unable to generate a unique snapshot copy name.");
}

function schedulePersist() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  return new Promise((resolve, reject) => {
    pendingWaiters.push({ resolve, reject });
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      flushPendingSave();
    }, SAVE_DEBOUNCE_MS);
  });
}

async function flushPendingSave() {
  const stateToPersist = pendingState;
  pendingState = null;

  const waiters = pendingWaiters;
  pendingWaiters = [];

  if (!stateToPersist) {
    waiters.forEach(({ resolve }) => resolve(undefined));
    return;
  }

  persistQueue = persistQueue.then(async () => {
    const client = await getAuthenticatedClient();
    if (!client) {
      return;
    }
    await persistStateToSupabase(client, stateToPersist);
  });

  try {
    await persistQueue;
    waiters.forEach(({ resolve }) => resolve(undefined));
  } catch (error) {
    waiters.forEach(({ reject }) => reject(error));
  }

  if (pendingState) {
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      flushPendingSave();
    }, SAVE_DEBOUNCE_MS);
  }
}

export const groupsDataService = {
  async loadInitialState() {
    if (!isSupabaseConfigured()) {
      return createEmptyState();
    }

    const client = await getAuthenticatedClient();
    if (!client) {
      return createEmptyState();
    }

    return loadStateFromSupabase(client);
  },

  async loadDemoState() {
    return createDemoState();
  },

  async saveState(state) {
    if (!isSupabaseConfigured()) {
      return undefined;
    }

    pendingState = normalizeState(state);
    return schedulePersist();
  },

  async listGroupSnapshots() {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const client = await getAuthenticatedClient();
    if (!client) {
      return [];
    }

    const rows = await fetchRows(
      "group_layout_snapshots.select",
      client
        .from("group_layout_snapshots")
        .select("id, name, created_at, updated_at")
        .order("updated_at", { ascending: false })
        .order("name", { ascending: true }),
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async saveGroupSnapshot({ name, groups }) {
    const normalizedName = normalizeSnapshotName(name);
    if (!normalizedName) {
      throw new Error("Snapshot name is required.");
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const client = await getAuthenticatedClient();
    if (!client) {
      throw new Error("You must be signed in to save snapshots.");
    }

    const {
      data: { user },
    } = await client.auth.getUser();

    const existingNames = await listSnapshotNames(client);
    const resolvedName = buildCopySnapshotName(normalizedName, existingNames);
    const payload = {
      name: resolvedName.name,
      groups_state: cloneGroups(groups),
    };

    if (user && user.id) {
      payload.created_by = user.id;
    }

    const { data, error } = await client
      .from("group_layout_snapshots")
      .insert(payload)
      .select("id, name")
      .single();

    if (error) {
      throw new Error(`group_layout_snapshots.insert: ${error.message}`);
    }

    return {
      status: "created",
      id: data.id,
      name: data.name,
      copiedFromName: resolvedName.copiedFromName,
    };
  },

  async restoreGroupSnapshot(snapshotId) {
    if (!snapshotId) {
      throw new Error("Snapshot id is required.");
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const client = await getAuthenticatedClient();
    if (!client) {
      throw new Error("You must be signed in to restore snapshots.");
    }

    const { data, error } = await client
      .from("group_layout_snapshots")
      .select("id, name, groups_state")
      .eq("id", snapshotId)
      .single();

    if (error) {
      throw new Error(`group_layout_snapshots.selectOne: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      groups: cloneGroups(data.groups_state),
    };
  },

  async deleteGroupSnapshot(snapshotId) {
    if (!snapshotId) {
      throw new Error("Snapshot id is required.");
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const client = await getAuthenticatedClient();
    if (!client) {
      throw new Error("You must be signed in to delete snapshots.");
    }

    const { error } = await client
      .from("group_layout_snapshots")
      .delete()
      .eq("id", snapshotId);

    if (error) {
      throw new Error(`group_layout_snapshots.delete: ${error.message}`);
    }

    return undefined;
  },
};
