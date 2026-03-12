export const SPECIALITES = ["TSA", "TDAH", "Moteur", "Comportement", "Sensoriel", "Autre"];

export const DEMO_ACCOS = [
  { id: "a1", nom: "Marie F.", specialites: ["TSA", "TDAH"] },
  { id: "a2", nom: "Pierre G.", specialites: ["Moteur"] },
  { id: "a3", nom: "Sophie H.", specialites: ["TSA"] },
  { id: "a4", nom: "Jean M.", specialites: ["Comportement"] },
  { id: "a5", nom: "Lucie B.", specialites: ["TDAH", "Sensoriel"] },
  { id: "a6", nom: "Romain D.", specialites: ["TSA", "Moteur"] },
  { id: "a7", nom: "Camille T.", specialites: ["Comportement", "TDAH"] },
  { id: "a8", nom: "Antoine V.", specialites: ["TSA"] },
  { id: "a9", nom: "Nathalie P.", specialites: ["Sensoriel"] },
  { id: "a10", nom: "Julien R.", specialites: ["TDAH"] },
  { id: "a11", nom: "Claire S.", specialites: ["TSA", "Comportement"] },
  { id: "a12", nom: "Marc L.", specialites: ["Moteur", "Sensoriel"] },
  { id: "a13", nom: "Isabelle N.", specialites: ["TSA", "TDAH"] },
  { id: "a14", nom: "Thomas W.", specialites: ["Comportement"] },
  { id: "a15", nom: "Audrey C.", specialites: ["Sensoriel", "TSA"] },
];

export const DEMO_ENFANTS = [
  { id: "e1", nom: "Lea M.", age: 7, ratioMax: 2, incompatiblesEnfants: ["e3"], incompatiblesAccos: [] },
  { id: "e2", nom: "Tom B.", age: 7, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: ["a2"] },
  { id: "e3", nom: "Jade R.", age: 8, ratioMax: 1, incompatiblesEnfants: ["e1"], incompatiblesAccos: [] },
  { id: "e4", nom: "Noah L.", age: 8, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e5", nom: "Emma D.", age: 7, ratioMax: 2, incompatiblesEnfants: ["e6"], incompatiblesAccos: [] },
  { id: "e6", nom: "Lucas P.", age: 8, ratioMax: 3, incompatiblesEnfants: ["e5"], incompatiblesAccos: ["a1"] },
  { id: "e7", nom: "Chloe V.", age: 7, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: ["a3"] },
  { id: "e8", nom: "Theo K.", age: 8, ratioMax: 2, incompatiblesEnfants: ["e10"], incompatiblesAccos: [] },
  { id: "e9", nom: "Ines B.", age: 9, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e10", nom: "Maxime C.", age: 10, ratioMax: 2, incompatiblesEnfants: ["e8"], incompatiblesAccos: [] },
  { id: "e11", nom: "Zoe A.", age: 9, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: ["a7"] },
  { id: "e12", nom: "Hugo N.", age: 10, ratioMax: 1, incompatiblesEnfants: ["e13"], incompatiblesAccos: [] },
  { id: "e13", nom: "Camille R.", age: 9, ratioMax: 2, incompatiblesEnfants: ["e12"], incompatiblesAccos: [] },
  { id: "e14", nom: "Lola T.", age: 10, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e15", nom: "Nathan S.", age: 9, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: ["a9"] },
  { id: "e16", nom: "Manon G.", age: 11, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e17", nom: "Axel P.", age: 11, ratioMax: 2, incompatiblesEnfants: ["e19"], incompatiblesAccos: [] },
  { id: "e18", nom: "Clara W.", age: 12, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e19", nom: "Raphael D.", age: 11, ratioMax: 2, incompatiblesEnfants: ["e17"], incompatiblesAccos: ["a11"] },
  { id: "e20", nom: "Lucie V.", age: 12, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e21", nom: "Antoine M.", age: 11, ratioMax: 1, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e22", nom: "Sarah B.", age: 12, ratioMax: 2, incompatiblesEnfants: ["e24"], incompatiblesAccos: [] },
  { id: "e23", nom: "Ethan L.", age: 13, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: ["a14"] },
  { id: "e24", nom: "Juliette F.", age: 13, ratioMax: 2, incompatiblesEnfants: ["e22"], incompatiblesAccos: [] },
  { id: "e25", nom: "Enzo C.", age: 12, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e26", nom: "Mathilde K.", age: 13, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: ["a15"] },
  { id: "e27", nom: "Bastien R.", age: 13, ratioMax: 3, incompatiblesEnfants: ["e28"], incompatiblesAccos: [] },
  { id: "e28", nom: "Oceane T.", age: 14, ratioMax: 2, incompatiblesEnfants: ["e27"], incompatiblesAccos: [] },
  { id: "e29", nom: "Victor N.", age: 14, ratioMax: 3, incompatiblesEnfants: [], incompatiblesAccos: [] },
  { id: "e30", nom: "Anais S.", age: 14, ratioMax: 2, incompatiblesEnfants: [], incompatiblesAccos: ["a12"] },
];

export const DEMO_GROUPES = [
  {
    id: "g1",
    nom: "Groupe Colibri",
    ageMin: 7,
    ageMax: 8,
    responsableId: "a3",
    enfantIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
    accoIds: ["a3", "a4", "a5"],
    sousgroupes: [
      { id: "sg1", accoId: "a3", enfantIds: ["e1", "e2"] },
      { id: "sg2", accoId: "a4", enfantIds: ["e4", "e6", "e8"] },
      { id: "sg3", accoId: "a5", enfantIds: ["e3", "e5", "e7"] },
    ],
  },
  {
    id: "g2",
    nom: "Groupe Panthere",
    ageMin: 9,
    ageMax: 10,
    responsableId: "a6",
    enfantIds: ["e9", "e10", "e11", "e12", "e13", "e14", "e15"],
    accoIds: ["a6", "a7", "a8"],
    sousgroupes: [
      { id: "sg4", accoId: "a6", enfantIds: ["e9", "e14"] },
      { id: "sg5", accoId: "a7", enfantIds: ["e10", "e13"] },
      { id: "sg6", accoId: "a8", enfantIds: ["e12", "e15"] },
    ],
  },
  {
    id: "g3",
    nom: "Groupe Lynx",
    ageMin: 11,
    ageMax: 12,
    responsableId: "a10",
    enfantIds: ["e16", "e17", "e18", "e19", "e20", "e21", "e22", "e25"],
    accoIds: ["a10", "a11", "a12"],
    sousgroupes: [
      { id: "sg7", accoId: "a10", enfantIds: ["e16", "e18", "e25"] },
      { id: "sg8", accoId: "a11", enfantIds: ["e20", "e22"] },
      { id: "sg9", accoId: "a12", enfantIds: ["e17", "e21"] },
    ],
  },
  {
    id: "g4",
    nom: "Groupe Faucon",
    ageMin: 13,
    ageMax: 14,
    responsableId: "a13",
    enfantIds: ["e23", "e24", "e26", "e27", "e28", "e29", "e30"],
    accoIds: ["a13", "a14", "a15"],
    sousgroupes: [
      { id: "sg10", accoId: "a13", enfantIds: ["e23"] },
      { id: "sg11", accoId: "a14", enfantIds: ["e24", "e29"] },
      { id: "sg12", accoId: "a15", enfantIds: ["e27", "e28", "e30"] },
    ],
  },
];

export function cloneState(state) {
  return {
    children: state.children.map((item) => ({
      ...item,
      incompatiblesEnfants: [...item.incompatiblesEnfants],
      incompatiblesAccos: [...item.incompatiblesAccos],
    })),
    supportWorkers: state.supportWorkers.map((item) => ({ ...item, specialites: [...item.specialites] })),
    groups: state.groups.map((group) => ({
      ...group,
      enfantIds: [...group.enfantIds],
      accoIds: [...group.accoIds],
      sousgroupes: group.sousgroupes.map((sg) => ({
        ...sg,
        enfantIds: [...sg.enfantIds],
      })),
    })),
  };
}

export function createEmptyState() {
  return { children: [], supportWorkers: [], groups: [] };
}

export function createDemoState() {
  return cloneState({
    children: DEMO_ENFANTS,
    supportWorkers: DEMO_ACCOS,
    groups: DEMO_GROUPES,
  });
}
