function localize(t, key, params) {
  if (typeof t !== "function") {
    return key;
  }
  return t(key, params);
}

let sgCounter = 0;

export function resetSubgroupCounter(groups = []) {
  sgCounter = 0;

  for (const group of groups) {
    for (const sg of group.sousgroupes || []) {
      const match = String(sg.id || "").match(/^sg_auto_(\d+)$/);
      if (!match) {
        continue;
      }
      const value = Number(match[1]);
      if (Number.isFinite(value)) {
        sgCounter = Math.max(sgCounter, value);
      }
    }
  }
}

export function newSgId() {
  sgCounter += 1;
  return `sg_auto_${sgCounter}`;
}

export function diagnostiquerEnfant(enfant, groupe, children, supportWorkers, sgsOuGroupes, modeGlobal, t) {
  const raisons = [];

  if (modeGlobal) {
    const groupesDispos = sgsOuGroupes.filter((item) => enfant.age >= item.ageMin && enfant.age <= item.ageMax);
    if (groupesDispos.length === 0) {
      raisons.push(localize(t, "diagnostic.noAgeGroup", { age: enfant.age }));
      return raisons;
    }

    for (const g of groupesDispos) {
      const accosGroupe = supportWorkers.filter((item) => g.accoIds.includes(item.id));
      if (accosGroupe.length > 0 && accosGroupe.every((item) => enfant.incompatiblesAccos.includes(item.id))) {
        raisons.push(localize(t, "diagnostic.incompatibleWithAllGroupAccos", { groupName: g.nom }));
      }
    }
  } else {
    const accosDuGroupe = supportWorkers.filter((item) => groupe.accoIds.includes(item.id));
    const accosIncompatibles = accosDuGroupe.filter((item) => enfant.incompatiblesAccos.includes(item.id));
    if (accosIncompatibles.length === accosDuGroupe.length && accosDuGroupe.length > 0) {
      raisons.push(localize(t, "diagnostic.incompatibleWithAllCurrentAccos"));
    } else if (accosIncompatibles.length > 0) {
      raisons.push(localize(t, "diagnostic.incompatibleWithSomeAccos", {
        names: accosIncompatibles.map((item) => item.nom).join(", "),
      }));
    }

    for (const sg of sgsOuGroupes) {
      for (const enfantId of sg.enfantIds) {
        const autreEnfant = children.find((item) => item.id === enfantId);
        if (!autreEnfant) {
          continue;
        }

        const incompatible = enfant.incompatiblesEnfants.includes(enfantId)
          || autreEnfant.incompatiblesEnfants.includes(enfant.id);
        if (incompatible) {
          const acco = supportWorkers.find((item) => item.id === sg.accoId);
          raisons.push(localize(t, "diagnostic.incompatibleWithChildInSubgroup", {
            childName: autreEnfant.nom,
            accoName: acco ? acco.nom : "-",
          }));
        }
      }
    }

    const sousGroupesSatures = sgsOuGroupes.filter((sg) => {
      const enfantsFuturs = [...sg.enfantIds, enfant.id];
      const ratioMin = Math.min(...enfantsFuturs.map((enfantId) => {
        const child = children.find((item) => item.id === enfantId);
        return child ? child.ratioMax : 99;
      }));
      return enfantsFuturs.length > ratioMin;
    });

    if (sousGroupesSatures.length === sgsOuGroupes.length && sgsOuGroupes.length > 0) {
      raisons.push(localize(t, "diagnostic.ratioBlocksAll", { ratio: enfant.ratioMax }));
    }
  }

  if (raisons.length === 0) {
    raisons.push(localize(t, "diagnostic.combined"));
  }

  return raisons;
}

export function repartirAuto(groupe, children, supportWorkers, t, sgsExistants = null) {
  const membresAccos = supportWorkers.filter((item) => groupe.accoIds.includes(item.id));
  if (membresAccos.length === 0) {
    return {
      ok: false,
      msg: localize(t, "algo.noAcco"),
      sousgroupes: groupe.sousgroupes || [],
      nonPlaces: [],
    };
  }

  const sousGroupes = sgsExistants
    ? sgsExistants.map((sg) => ({ ...sg, enfantIds: [...sg.enfantIds] }))
    : membresAccos.map((item) => ({ id: newSgId(), accoId: item.id, enfantIds: [] }));

  for (const acco of membresAccos) {
    if (!sousGroupes.find((sg) => sg.accoId === acco.id)) {
      sousGroupes.push({ id: newSgId(), accoId: acco.id, enfantIds: [] });
    }
  }

  const dejaDansSousGroupe = new Set(sousGroupes.flatMap((sg) => sg.enfantIds));
  const enfantsAPlacer = children
    .filter((item) => groupe.enfantIds.includes(item.id) && !dejaDansSousGroupe.has(item.id))
    .sort((a, b) => a.ratioMax - b.ratioMax);

  const nonPlaces = [];

  for (const enfant of enfantsAPlacer) {
    const candidats = sousGroupes.filter((sg) => {
      if (enfant.incompatiblesAccos.includes(sg.accoId)) {
        return false;
      }

      for (const enfantId of sg.enfantIds) {
        const enfantPresent = children.find((item) => item.id === enfantId);
        if (!enfantPresent) {
          continue;
        }
        const incompatible = enfant.incompatiblesEnfants.includes(enfantId)
          || enfantPresent.incompatiblesEnfants.includes(enfant.id);
        if (incompatible) {
          return false;
        }
      }

      const enfantsFuturs = [...sg.enfantIds, enfant.id];
      const ratioMin = Math.min(...enfantsFuturs.map((enfantId) => {
        const child = children.find((item) => item.id === enfantId);
        return child ? child.ratioMax : 99;
      }));
      if (enfantsFuturs.length > ratioMin) {
        return false;
      }

      return true;
    });

    if (candidats.length === 0) {
      nonPlaces.push({
        enfant,
        raisons: diagnostiquerEnfant(enfant, groupe, children, supportWorkers, sousGroupes, false, t),
      });
      continue;
    }

    candidats.sort((a, b) => a.enfantIds.length - b.enfantIds.length);
    candidats[0].enfantIds.push(enfant.id);
  }

  return { ok: nonPlaces.length === 0, sousgroupes: sousGroupes, nonPlaces };
}

export function repartirGlobal(groups, children, supportWorkers, mode, t) {
  let groupesCopie = groups.map((group) => ({
    ...group,
    enfantIds: mode === "tout" ? [] : [...group.enfantIds],
    sousgroupes: mode === "tout"
      ? []
      : group.sousgroupes.map((sg) => ({ ...sg, enfantIds: [...sg.enfantIds] })),
  }));

  const enfantsARepartir = mode === "tout"
    ? [...children]
    : children.filter((enfant) => !groups.some((group) => group.enfantIds.includes(enfant.id)));

  const tries = [...enfantsARepartir].sort((a, b) => a.ratioMax - b.ratioMax);
  const nonPlaces = [];

  for (const enfant of tries) {
    const groupesCandidats = groupesCopie.filter((group) => {
      if (enfant.age < group.ageMin || enfant.age > group.ageMax) {
        return false;
      }

      const accosGroupe = supportWorkers.filter((item) => group.accoIds.includes(item.id));
      if (accosGroupe.length > 0 && accosGroupe.every((item) => enfant.incompatiblesAccos.includes(item.id))) {
        return false;
      }

      return true;
    });

    if (groupesCandidats.length === 0) {
      nonPlaces.push({
        enfant,
        raisons: diagnostiquerEnfant(enfant, null, children, supportWorkers, groupesCopie, true, t),
      });
      continue;
    }

    groupesCandidats.sort((a, b) => a.enfantIds.length - b.enfantIds.length);
    groupesCandidats[0].enfantIds.push(enfant.id);
  }

  groupesCopie = groupesCopie.map((group) => {
    const sgsExistants = mode === "nonplaces" ? group.sousgroupes : null;
    const result = repartirAuto(group, children, supportWorkers, t, sgsExistants);
    return { ...group, sousgroupes: result.sousgroupes };
  });

  return { groups: groupesCopie, nonPlaces };
}

export function calcCompatibilite(enfant, groups, children, supportWorkers, t) {
  const result = {};

  for (const group of groups) {
    const conflitsGroupe = [];
    if (enfant.age < group.ageMin || enfant.age > group.ageMax) {
      conflitsGroupe.push(localize(t, "compat.ageRange", {
        age: enfant.age,
        ageMin: group.ageMin,
        ageMax: group.ageMax,
      }));
    }

    const sgs = {};
    for (const sg of group.sousgroupes) {
      const conflitsSousGroupe = [...conflitsGroupe];
      const acco = supportWorkers.find((item) => item.id === sg.accoId);

      if (acco && enfant.incompatiblesAccos.includes(acco.id)) {
        conflitsSousGroupe.push(localize(t, "compat.acco", { accoName: acco.nom }));
      }

      for (const enfantId of sg.enfantIds) {
        if (enfantId === enfant.id) {
          continue;
        }
        const autreEnfant = children.find((item) => item.id === enfantId);
        if (!autreEnfant) {
          continue;
        }
        const incompatible = enfant.incompatiblesEnfants.includes(enfantId)
          || autreEnfant.incompatiblesEnfants.includes(enfant.id);
        if (incompatible) {
          conflitsSousGroupe.push(localize(t, "compat.child", { childName: autreEnfant.nom }));
        }
      }

      const enfantsFuturs = [...sg.enfantIds.filter((id) => id !== enfant.id), enfant.id];
      const ratioMin = Math.min(...enfantsFuturs.map((enfantId) => {
        const child = children.find((item) => item.id === enfantId);
        return child ? child.ratioMax : 99;
      }));
      if (enfantsFuturs.length > ratioMin) {
        conflitsSousGroupe.push(localize(t, "compat.ratio", {
          count: enfantsFuturs.length,
          ratio: ratioMin,
        }));
      }

      sgs[sg.id] = { ok: conflitsSousGroupe.length === 0, conflicts: conflitsSousGroupe };
    }

    result[group.id] = { ok: conflitsGroupe.length === 0, conflicts: conflitsGroupe, sgs };
  }

  return result;
}

export function calcCompatibiliteAcco(acco, groups, t) {
  const result = {};

  for (const group of groups) {
    if (group.id === acco.fromGroupeId) {
      result[group.id] = { ok: false, conflicts: [localize(t, "compat.sourceGroup")] };
      continue;
    }

    const conflicts = group.accoIds.includes(acco.id)
      ? [localize(t, "compat.alreadyInGroup")]
      : [];
    result[group.id] = { ok: conflicts.length === 0, conflicts };
  }

  return result;
}
