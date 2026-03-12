function localize(t, key, params) {
  if (typeof t !== "function") {
    return key;
  }
  return t(key, params);
}

export function validerSousGroupe(sg, _groupe, children, supportWorkers, t) {
  const conflicts = [];
  const acco = supportWorkers.find((item) => item.id === sg.accoId);
  const membres = children.filter((item) => sg.enfantIds.includes(item.id));

  if (membres.length > 0) {
    const ratioMax = Math.min(...membres.map((item) => item.ratioMax));
    if (membres.length > ratioMax) {
      conflicts.push({
        type: "ratio",
        msg: localize(t, "conflict.ratio", { count: membres.length, ratio: ratioMax }),
      });
    }
  }

  for (let indexA = 0; indexA < membres.length; indexA += 1) {
    for (let indexB = indexA + 1; indexB < membres.length; indexB += 1) {
      const enfantA = membres[indexA];
      const enfantB = membres[indexB];
      const incompatible = enfantA.incompatiblesEnfants.includes(enfantB.id)
        || enfantB.incompatiblesEnfants.includes(enfantA.id);
      if (incompatible) {
        conflicts.push({
          type: "enfant",
          msg: localize(t, "conflict.childChild", {
            nameA: enfantA.nom,
            nameB: enfantB.nom,
          }),
        });
      }
    }
  }

  if (acco) {
    for (const enfant of membres) {
      if (enfant.incompatiblesAccos.includes(acco.id)) {
        conflicts.push({
          type: "acco",
          msg: localize(t, "conflict.childAcco", {
            childName: enfant.nom,
            accoName: acco.nom,
          }),
        });
      }
    }
  }

  return conflicts;
}

export function validerGroupe(groupe, children, supportWorkers, t) {
  const conflicts = [];

  for (const enfantId of groupe.enfantIds) {
    const enfant = children.find((item) => item.id === enfantId);
    if (enfant && (enfant.age < groupe.ageMin || enfant.age > groupe.ageMax)) {
      conflicts.push({
        type: "age",
        scope: "groupe",
        msg: localize(t, "conflict.age", {
          childName: enfant.nom,
          age: enfant.age,
          ageMin: groupe.ageMin,
          ageMax: groupe.ageMax,
        }),
      });
    }
  }

  const assignes = new Set(groupe.sousgroupes.flatMap((sg) => sg.enfantIds));
  for (const enfantId of groupe.enfantIds) {
    if (!assignes.has(enfantId)) {
      const enfant = children.find((item) => item.id === enfantId);
      if (enfant) {
        conflicts.push({
          type: "nonassigne",
          scope: "groupe",
          msg: localize(t, "conflict.unassigned", { childName: enfant.nom }),
        });
      }
    }
  }

  for (const sg of groupe.sousgroupes) {
    const conflitsSousGroupe = validerSousGroupe(sg, groupe, children, supportWorkers, t);
    for (const conflict of conflitsSousGroupe) {
      conflicts.push({
        ...conflict,
        scope: "sousgroupe",
        sgId: sg.id,
      });
    }
  }

  return conflicts;
}
