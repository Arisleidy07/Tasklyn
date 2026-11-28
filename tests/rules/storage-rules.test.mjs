// ============================================================
// TASKLYN — Storage + Firestore rules integration test
//
// Runs against the LOCAL Firebase emulators with a demo project
// (never touches production):
//
//   npm run test:rules
//
// Seeds realistic data (including legacy shapes: tasks without
// teamId, teams without members/{uid} docs) and checks who can
// upload / read task attachments, report evidence and form files.
// ============================================================
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  getDocs,
  collection,
  doc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getBytes,
} from "firebase/storage";

const PROJECT = process.env.GCLOUD_PROJECT || "demo-tasklyn";
const BUCKET = `${PROJECT}.appspot.com`;
const FS_HOST = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8280";
const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST || "127.0.0.1:9299";
const STORAGE_HOST = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9399";
const hostPort = (h) => { const i = h.lastIndexOf(":"); return [h.slice(0, i), Number(h.slice(i + 1))]; };
const PASSWORD = "test-password-123";
const RUN = Date.now().toString(36);

// ---- Seeding (bypasses rules with the emulator "owner" token) ----
function toValue(v) {
  if (v === null) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return { integerValue: String(v) };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  return { mapValue: { fields: toFields(v) } };
}
function toFields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]));
}
async function seed(path, data) {
  const res = await fetch(
    `http://${FS_HOST}/v1/projects/${PROJECT}/databases/(default)/documents/${path}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
      body: JSON.stringify({ fields: toFields(data) }),
    },
  );
  if (!res.ok) throw new Error(`seed ${path}: ${res.status} ${await res.text()}`);
}

// ---- Sessions ----
const uids = {};
const sessions = {};

async function session(name) {
  if (sessions[name]) return sessions[name];
  const app = initializeApp({ apiKey: "demo-key", projectId: PROJECT, storageBucket: BUCKET }, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${AUTH_HOST}`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, ...hostPort(FS_HOST));
  const storage = getStorage(app);
  connectStorageEmulator(storage, ...hostPort(STORAGE_HOST));
  const email = `${name.toLowerCase()}-${RUN}@test.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, PASSWORD).catch(() =>
    signInWithEmailAndPassword(auth, email, PASSWORD),
  );
  uids[name] = cred.user.uid;
  sessions[name] = { app, auth, db, storage };
  return sessions[name];
}

async function upload(name, path, type = "image/jpeg") {
  const { storage } = await session(name);
  try {
    await uploadBytes(ref(storage, path), new Uint8Array([1, 2, 3, 4]), { contentType: type });
    return "allow";
  } catch (e) {
    if (e.code === "storage/unauthorized") return "deny";
    throw e;
  }
}

async function read(name, path) {
  const { storage } = await session(name);
  try {
    await getBytes(ref(storage, path));
    return "allow";
  } catch (e) {
    if (e.code === "storage/unauthorized") return "deny";
    if (e.code === "storage/object-not-found") return "allow";
    throw e;
  }
}

async function readAttachmentMeta(name, taskId) {
  const { db } = await session(name);
  try {
    await getDocs(collection(db, "tasks", taskId, "attachments"));
    return "allow";
  } catch (e) {
    if (e.code === "permission-denied") return "deny";
    throw e;
  }
}

async function writeAttachmentMeta(name, taskId) {
  const { db } = await session(name);
  try {
    await setDoc(doc(db, "tasks", taskId, "attachments", `m-${name}`), {
      name: "x.jpg",
      uploadedBy: uids[name],
    });
    return "allow";
  } catch (e) {
    if (e.code === "permission-denied") return "deny";
    throw e;
  }
}

const NAMES = ["owner", "member", "legacyMember", "viewer", "outsider", "listGuest"];

before(async () => {
  for (const n of NAMES) await session(n);
  const { owner, member, legacyMember, viewer, outsider, listGuest } = uids;

  // Personal list + task WITHOUT teamId (most common legacy shape)
  await seed("lists/personal", { name: "Personal", owner, memberIds: [owner, listGuest], type: "shared" });
  await seed("tasks/personalTask", { listId: "personal", title: "T", createdBy: owner, status: "pending" });

  // Legacy team: the OWNER has no members/{uid} doc, legacyMember neither.
  await seed("teams/team1", { name: "Equipo", owner, memberIds: [owner, member, legacyMember, viewer] });
  await seed(`teams/team1/members/${member}`, { userId: member, role: "member" });
  await seed(`teams/team1/members/${viewer}`, { userId: viewer, role: "viewer" });

  await seed("lists/teamList", { name: "Lista equipo", owner, memberIds: [owner], teamId: "team1", type: "team" });
  await seed("tasks/teamTask", { listId: "teamList", teamId: "team1", title: "T", createdBy: owner, status: "pending" });
  // Legacy team task: the list has teamId but the task does not
  await seed("tasks/legacyTeamTask", { listId: "teamList", title: "T", createdBy: owner, status: "pending" });

  await seed("reports/r1", { createdBy: member, createdByName: "M", teamId: "team1", declarationConfirmed: true });
  await seed("reports/rPersonal", { createdBy: outsider, createdByName: "O", declarationConfirmed: true });
  await seed("forms/f1", { createdBy: owner, createdByName: "O", teamId: "team1", title: "F" });

  await seed("tasks/teamTask/attachments/a1", { name: "x.jpg", uploadedBy: owner, url: "https://x" });
});

after(async () => {
  for (const s of Object.values(sessions)) await deleteApp(s.app);
});

// ---- Task attachments (Storage) ----
// Real app flow: 1) create metadata doc (status "uploading") through
// Firestore rules, 2) upload to tasks/{taskId}/attachments/{metaId}/file.
// Storage rules only read that metadata doc (production allows at most two
// Firestore document reads per Storage rules evaluation).
async function attach(name, taskId) {
  const { db } = await session(name);
  const id = `att-${name}-${taskId}-${Math.random().toString(36).slice(2, 7)}`;
  try {
    await setDoc(doc(db, "tasks", taskId, "attachments", id), {
      name: "x.jpg", type: "image/jpeg", size: 4, category: "image",
      url: "", storagePath: "", status: "uploading", uploadedBy: uids[name],
    });
  } catch (e) {
    if (e.code === "permission-denied") return "deny";
    throw e;
  }
  const res = await upload(name, `tasks/${taskId}/attachments/${id}/x.jpg`);
  if (res === "allow") {
    await updateDoc(doc(db, "tasks", taskId, "attachments", id), {
      url: "https://x", storagePath: `tasks/${taskId}/attachments/${id}/x.jpg`, status: "complete",
    });
  }
  return res;
}

const cases = [
  ["owner", "personalTask", "allow", "dueño · tarea personal sin teamId"],
  ["listGuest", "personalTask", "allow", "miembro de lista · tarea personal"],
  ["outsider", "personalTask", "deny", "cuenta ajena · tarea personal"],
  ["owner", "teamTask", "allow", "dueño de equipo sin doc members/{uid}"],
  ["member", "teamTask", "allow", "miembro del equipo"],
  ["legacyMember", "teamTask", "allow", "miembro legado (solo memberIds)"],
  ["viewer", "teamTask", "deny", "rol Solo lectura"],
  ["outsider", "teamTask", "deny", "cuenta ajena · tarea de equipo"],
  ["member", "legacyTeamTask", "allow", "miembro · tarea legada sin teamId"],
  ["owner", "missingTask", "deny", "tarea inexistente"],
];

for (const [who, task, expected, label] of cases) {
  test(`adjunto: subir — ${label}`, async () => {
    assert.equal(await attach(who, task), expected);
  });
}

test("adjunto: sin metadatos previos o con metadatos ajenos se deniega", async () => {
  // No metadata doc → deny, even for the owner
  assert.equal(await upload("owner", "tasks/teamTask/attachments/noMeta/x.jpg"), "deny");
  // Outsider can't piggy-back on someone else's placeholder
  const { db } = await session("member");
  await setDoc(doc(db, "tasks", "teamTask", "attachments", "pending1"), {
    name: "x.jpg", type: "image/jpeg", size: 4, category: "image",
    url: "", storagePath: "", status: "uploading", uploadedBy: uids.member,
  });
  assert.equal(await upload("outsider", "tasks/teamTask/attachments/pending1/x.jpg"), "deny");
  assert.equal(await upload("owner", "tasks/teamTask/attachments/pending1/x.jpg"), "deny");
  // Completed placeholder can no longer receive new objects
  assert.equal(await upload("member", "tasks/teamTask/attachments/pending1/x.jpg"), "allow");
  await updateDoc(doc(db, "tasks", "teamTask", "attachments", "pending1"), { status: "complete", url: "https://x" });
  assert.equal(await upload("member", "tasks/teamTask/attachments/pending1/other.jpg"), "deny");
  // Spoofing uploadedBy in Firestore is rejected
  const o = await session("outsider");
  await assert.rejects(setDoc(doc(o.db, "tasks", "teamTask", "attachments", "spoof"), {
    name: "x", uploadedBy: uids.outsider, status: "uploading",
  }));
});

test("adjunto: lectura (getDownloadURL) — quien subió y creador de la tarea; ajeno no", async () => {
  assert.equal(await read("member", "tasks/teamTask/attachments/pending1/x.jpg"), "allow");
  assert.equal(await read("owner", "tasks/teamTask/attachments/pending1/x.jpg"), "allow");
  assert.equal(await read("outsider", "tasks/teamTask/attachments/pending1/x.jpg"), "deny");
});

test("adjunto legado (ruta antigua): miembros de la lista leen, ajeno no, nadie sube", async () => {
  // Rules allow the read → the emulator answers "object-not-found" (no file)
  assert.equal(await read("listGuest", "tasks/personalTask/attachments/old.jpg"), "allow");
  assert.equal(await upload("owner", "tasks/personalTask/attachments/new-legacy.jpg"), "deny");
  assert.equal(await read("outsider", "tasks/personalTask/attachments/old.jpg"), "deny");
});

// ---- Attachment metadata (Firestore) ----
test("metadatos de adjuntos (Firestore)", async () => {
  assert.equal(await readAttachmentMeta("member", "teamTask"), "allow");
  assert.equal(await readAttachmentMeta("legacyMember", "legacyTeamTask"), "allow");
  assert.equal(await readAttachmentMeta("outsider", "teamTask"), "deny");
  assert.equal(await writeAttachmentMeta("member", "teamTask"), "allow");
  assert.equal(await writeAttachmentMeta("owner", "personalTask"), "allow");
  assert.equal(await writeAttachmentMeta("viewer", "teamTask"), "deny");
  assert.equal(await writeAttachmentMeta("outsider", "teamTask"), "deny");
});

// ---- Technician reports ----
test("reportes: creador sube, equipo lee, ajeno no", async () => {
  assert.equal(await upload("member", "reports/r1/location_photo/a.jpg"), "allow");
  assert.equal(await upload("member", "reports/r1/work_evidence/v.mp4", "video/mp4"), "allow");
  assert.equal(await upload("owner", "reports/r1/work_evidence/x.jpg"), "deny");
  assert.equal(await read("owner", "reports/r1/location_photo/a.jpg"), "allow");
  assert.equal(await read("viewer", "reports/r1/location_photo/a.jpg"), "allow");
  assert.equal(await read("outsider", "reports/r1/location_photo/a.jpg"), "deny");
  // Report without teamId (personal) — creator can upload
  assert.equal(await upload("outsider", "reports/rPersonal/location_photo/a.jpg"), "allow");
  assert.equal(await read("member", "reports/rPersonal/location_photo/a.jpg"), "deny");
  // Report that does not exist yet
  assert.equal(await upload("member", "reports/nope/location_photo/a.jpg"), "deny");
});

// ---- Forms ----
test("formularios: miembro sube su respuesta, ajeno no, cabecera solo el creador", async () => {
  assert.equal(await upload("member", `forms/f1/responses/${uids.member}/q1/a.jpg`), "allow");
  assert.equal(await upload("legacyMember", `forms/f1/responses/${uids.legacyMember}/q1/a.jpg`), "allow");
  assert.equal(await upload("owner", `forms/f1/header/h.jpg`), "allow");
  // Each respondent writes only inside their own folder
  assert.equal(await upload("member", `forms/f1/responses/${uids.owner}/q1/a.jpg`), "deny");
  assert.equal(await upload("outsider", `forms/f1/responses/${uids.outsider}/q1/a.jpg`), "deny");
  assert.equal(await upload("member", `forms/f1/header/h.jpg`), "deny");
  assert.equal(await read("outsider", `forms/f1/responses/${uids.member}/q1/a.jpg`), "deny");
  assert.equal(await read("owner", `forms/f1/responses/${uids.member}/q1/a.jpg`), "allow");
});

// ---- Catch-all ----
test("rutas desconocidas denegadas", async () => {
  assert.equal(await read("owner", "random/thing.jpg"), "deny");
  assert.equal(await upload("owner", "random/thing.jpg"), "deny");
});

// ---- Attachment summary on the task doc (cards) ----
async function updateTask(name, taskId, data) {
  const { db } = await session(name);
  try {
    await updateDoc(doc(db, "tasks", taskId), data);
    return "allow";
  } catch (e) {
    if (e.code === "permission-denied") return "deny";
    throw e;
  }
}

test("resumen de adjuntos: miembro del equipo sí, solo esos campos; ajeno y viewer no", async () => {
  const summary = { attachmentCount: 1, attachmentPreviews: [{ id: "a1", name: "x.jpg", type: "image/jpeg", category: "image", url: "https://x" }] };
  // member is not in list.memberIds and not admin → may only touch summary fields
  assert.equal(await updateTask("member", "teamTask", summary), "allow");
  assert.equal(await updateTask("member", "teamTask", { ...summary, title: "hack" }), "deny");
  assert.equal(await updateTask("viewer", "teamTask", summary), "deny");
  assert.equal(await updateTask("outsider", "teamTask", summary), "deny");
});
