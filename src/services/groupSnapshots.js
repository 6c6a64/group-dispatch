function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueFilteredIds(ids, validIds, counter) {
  const seen = new Set();
  const next = [];

  for (const id of toArray(ids)) {
    if (typeof id !== "string" || !validIds.has(id) || seen.has(id)) {
      counter.count += 1;
      continue;
    }
    seen.add(id);
    next.push(id);
  }

  return next;
}

export function cloneGroups(groups) {
  return toArray(groups).map((group) => ({
    ...group,
    enfantIds: [...toArray(group.enfantIds)],
    accoIds: [...toArray(group.accoIds)],
    sousgroupes: toArray(group.sousgroupes).map((subgroup) => ({
      ...subgroup,
      enfantIds: [...toArray(subgroup.enfantIds)],
    })),
  }));
}

export function normalizeSnapshotName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

export function normalizeSnapshotNameKey(name) {
  return normalizeSnapshotName(name).toLowerCase();
}

export function sanitizeGroupsSnapshot(groups, children, supportWorkers) {
  const validChildIds = new Set(toArray(children).map((child) => child.id));
  const validSupportWorkerIds = new Set(toArray(supportWorkers).map((worker) => worker.id));

  const removedCounter = { count: 0 };
  const sanitizedGroups = [];
  const seenGroupIds = new Set();

  for (const group of toArray(groups)) {
    if (!group || typeof group.id !== "string" || seenGroupIds.has(group.id)) {
      removedCounter.count += 1;
      continue;
    }

    seenGroupIds.add(group.id);

    const enfantIds = uniqueFilteredIds(group.enfantIds, validChildIds, removedCounter);
    const accoIds = uniqueFilteredIds(group.accoIds, validSupportWorkerIds, removedCounter);
    const accoIdSet = new Set(accoIds);
    const enfantIdSet = new Set(enfantIds);

    const seenSubgroupIds = new Set();
    const seenSubgroupAccos = new Set();
    const assignedChildren = new Set();

    const sousgroupes = [];
    for (const subgroup of toArray(group.sousgroupes)) {
      if (!subgroup || typeof subgroup.id !== "string") {
        removedCounter.count += 1;
        continue;
      }

      if (seenSubgroupIds.has(subgroup.id)) {
        removedCounter.count += 1;
        continue;
      }
      seenSubgroupIds.add(subgroup.id);

      if (typeof subgroup.accoId !== "string" || !accoIdSet.has(subgroup.accoId) || seenSubgroupAccos.has(subgroup.accoId)) {
        removedCounter.count += 1;
        continue;
      }
      seenSubgroupAccos.add(subgroup.accoId);

      const subgroupChildren = [];
      for (const childId of toArray(subgroup.enfantIds)) {
        if (
          typeof childId !== "string"
          || !enfantIdSet.has(childId)
          || assignedChildren.has(childId)
        ) {
          removedCounter.count += 1;
          continue;
        }

        assignedChildren.add(childId);
        subgroupChildren.push(childId);
      }

      sousgroupes.push({
        id: subgroup.id,
        accoId: subgroup.accoId,
        enfantIds: subgroupChildren,
      });
    }

    let responsableId = typeof group.responsableId === "string" ? group.responsableId : "";
    if (!accoIdSet.has(responsableId)) {
      if (responsableId) {
        removedCounter.count += 1;
      }
      responsableId = "";
    }

    sanitizedGroups.push({
      id: group.id,
      nom: typeof group.nom === "string" ? group.nom : group.id,
      ageMin: Number.isFinite(group.ageMin) ? group.ageMin : 0,
      ageMax: Number.isFinite(group.ageMax) ? group.ageMax : 0,
      responsableId,
      enfantIds,
      accoIds,
      sousgroupes,
    });
  }

  return { groups: sanitizedGroups, removedCount: removedCounter.count };
}
