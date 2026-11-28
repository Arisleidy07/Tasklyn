// Run with: npm run test:unit
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseTaskText,
  parseDate,
  parseTime,
  resolveAssignee,
} from "../../src/lib/taskPasteParser.ts";

const NOW = new Date(2026, 10, 27, 10, 0); // 27 nov 2026
const titles = (text: string) => parseTaskText(text, { now: NOW }).tasks.map((t) => t.title);

test("lista numerada → 5 tareas en orden, sin marcadores", () => {
  const r = parseTaskText(
    "1. Revisar inventario.\n2. Llamar al cliente.\n3. Instalar router.\n4. Verificar conexión.\n5. Preparar reporte técnico.",
    { now: NOW },
  );
  assert.deepEqual(r.tasks.map((t) => t.title), [
    "Revisar inventario.",
    "Llamar al cliente.",
    "Instalar router.",
    "Verificar conexión.",
    "Preparar reporte técnico.",
  ]);
  assert.equal(r.ambiguous, false);
});

test("viñetas y guiones de distintas apps", () => {
  assert.deepEqual(titles("• Uno\n◦ Dos\n▪ Tres\n- Cuatro\n– Cinco\n* Seis\n✅ Siete\n- [ ] Ocho\n- [x] Nueve"), [
    "Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve",
  ]);
});

test("formatos numéricos variados", () => {
  assert.deepEqual(titles("1) A\n(2) B\n3- C\n4.- D\n1️⃣ E\na) F"), ["A", "B", "C", "D", "E", "F"]);
});

test("saltos de línea Windows, Mac antiguo y líneas vacías", () => {
  assert.deepEqual(titles("Uno\r\n\r\nDos\rTres\u2028Cuatro\n\n   \n"), ["Uno", "Dos", "Tres", "Cuatro"]);
});

test("conserva números que forman parte del nombre", () => {
  assert.deepEqual(titles("1. Instalar 2 routers\n2. Cambiar cable de 1.5 m\n3. Revisar OT-2024-15\n4. 3 cámaras en local 12"), [
    "Instalar 2 routers",
    "Cambiar cable de 1.5 m",
    "Revisar OT-2024-15",
    "3 cámaras en local 12",
  ]);
  assert.deepEqual(titles("2024 cierre fiscal\n1.5 metros de cable"), ["2024 cierre fiscal", "1.5 metros de cable"]);
});

test("formato WhatsApp / markdown", () => {
  assert.deepEqual(titles("*Revisar inventario*\n_Llamar al cliente_\n**Instalar router**\n# Verificar conexión"), [
    "Revisar inventario",
    "Llamar al cliente",
    "Instalar router",
    "Verificar conexión",
  ]);
  assert.deepEqual(
    titles("[27/11/26, 10:15] Ana: Revisar inventario\n[27/11/26, 10:16] Ana: Llamar al cliente"),
    ["Revisar inventario", "Llamar al cliente"],
  );
});

test("bloques con información adicional → 2 tareas con sus campos", () => {
  const r = parseTaskText(
    `Instalar internet al cliente Manuel
Descripción: Instalar router y verificar la conexión.
Teléfono: 8090000000
Prioridad: Alta
Revisar avería del cliente Pedro
Descripción: Verificar el cableado.
Prioridad: Media`,
    { now: NOW },
  );
  assert.equal(r.tasks.length, 2);
  assert.deepEqual(r.tasks[0], {
    title: "Instalar internet al cliente Manuel",
    description: "Instalar router y verificar la conexión.",
    phoneNumbers: ["8090000000"],
    priority: "high",
  });
  assert.deepEqual(r.tasks[1], {
    title: "Revisar avería del cliente Pedro",
    description: "Verificar el cableado.",
    priority: "medium",
  });
  assert.equal(r.ambiguous, false);
  assert.ok(!r.tasks.some((t) => /Descripción|Teléfono|Prioridad/.test(t.title)));
});

test("ubicación, maps, fecha, hora y responsable", () => {
  const r = parseTaskText(
    `- Instalar fibra
  Ubicación: Calle 5 #12, Santiago
  Google Maps: https://maps.app.goo.gl/abc123
  Fecha: 15/12/2026
  Hora: 3:30 pm
  Responsable: Pedro`,
    { now: NOW },
  );
  assert.equal(r.tasks.length, 1);
  assert.deepEqual(r.tasks[0], {
    title: "Instalar fibra",
    location: "Calle 5 #12, Santiago",
    locationUrl: "https://maps.app.goo.gl/abc123",
    dueDate: "2026-12-15",
    dueTime: "15:30",
    assigneeName: "Pedro",
  });
});

test("datos que no se pueden interpretar quedan en la descripción y piden confirmación", () => {
  const r = parseTaskText("Revisar router\nFecha: el próximo martes\nPrioridad: cuando se pueda\nTeléfono: llamar a recepción", { now: NOW });
  assert.equal(r.tasks.length, 1);
  assert.equal(r.tasks[0].dueDate, undefined);
  assert.equal(r.tasks[0].priority, undefined);
  assert.equal(r.tasks[0].phoneNumbers, undefined);
  assert.match(r.tasks[0].description!, /Fecha: el próximo martes/);
  assert.match(r.tasks[0].description!, /Prioridad: cuando se pueda/);
  assert.equal(r.ambiguous, true);
});

test("fecha sin año no se asume", () => {
  assert.equal(parseDate("15/12", NOW), null);
  assert.equal(parseDate("31/02/2026", NOW), null);
  assert.equal(parseDate("2026-12-15", NOW), "2026-12-15");
  assert.equal(parseDate("15 de diciembre de 2026", NOW), "2026-12-15");
  assert.equal(parseDate("mañana", NOW), "2026-11-28");
});

test("horas", () => {
  assert.equal(parseTime("3:30 pm"), "15:30");
  assert.equal(parseTime("12:00 a. m."), "00:00");
  assert.equal(parseTime("15:45"), "15:45");
  assert.equal(parseTime("9h"), "09:00");
  assert.equal(parseTime("3"), null);
  assert.equal(parseTime("25:00"), null);
});

test("hoja de cálculo con encabezados", () => {
  const r = parseTaskText("Tarea\tTeléfono\tPrioridad\tCliente\nInstalar router\t809-555-1234\tAlta\tManuel\nRevisar avería\t\tBaja\tPedro", { now: NOW });
  assert.equal(r.tasks.length, 2);
  assert.deepEqual(r.tasks[0], {
    title: "Instalar router",
    phoneNumbers: ["809-555-1234"],
    priority: "high",
    description: "Cliente: Manuel",
  });
  assert.equal(r.tasks[1].priority, "low");
  assert.equal(r.ambiguous, false);
});

test("columna única de Excel", () => {
  assert.deepEqual(titles("Revisar inventario\nLlamar al cliente\nInstalar router"), [
    "Revisar inventario",
    "Llamar al cliente",
    "Instalar router",
  ]);
});

test("hoja sin encabezados → ambigua", () => {
  const r = parseTaskText("Instalar router\tManuel\nRevisar avería\tPedro", { now: NOW });
  assert.equal(r.tasks.length, 2);
  assert.equal(r.tasks[0].description, "Manuel");
  assert.equal(r.ambiguous, true);
});

test("encabezado de lista se omite y se avisa", () => {
  const r = parseTaskText("Pendientes para hoy:\n1. Uno\n2. Dos", { now: NOW });
  assert.deepEqual(r.tasks.map((t) => t.title), ["Uno", "Dos"]);
  assert.equal(r.ambiguous, true);
});

test("sub-viñetas indentadas van a la descripción", () => {
  const r = parseTaskText("1. Instalar router\n    - Verificar cable\n    - Probar wifi\n2. Llamar", { now: NOW });
  assert.equal(r.tasks.length, 2);
  assert.equal(r.tasks[0].description, "Verificar cable\nProbar wifi");
});

test("lista mixta (algunas con viñeta y otras no) → ambigua", () => {
  const r = parseTaskText("Comprar materiales\n- cable\n- conectores\nLlamar a Pedro", { now: NOW });
  assert.equal(r.ambiguous, true);
});

test("campo antes de cualquier tarea → ambiguo, sin tarea 'Teléfono'", () => {
  const r = parseTaskText("Teléfono: 8090000000\nInstalar router", { now: NOW });
  assert.equal(r.ambiguous, true);
  assert.deepEqual(r.tasks.map((t) => t.title), ["Instalar router"]);
  assert.match(r.tasks[0].description!, /Teléfono: 8090000000/);
});

test("texto vacío", () => {
  assert.deepEqual(parseTaskText("  \n\n ").tasks, []);
});

test("responsable: coincidencia única o nada", () => {
  const members = [
    { userId: "u1", name: "Pedro Martínez" },
    { userId: "u2", name: "Ana López" },
    { userId: "u3", name: "Ana Pérez" },
  ];
  assert.equal(resolveAssignee("pedro", members), "u1");
  assert.equal(resolveAssignee("Pedro Martinez", members), "u1");
  assert.equal(resolveAssignee("Ana", members), null); // ambiguous
  assert.equal(resolveAssignee("Luis", members), null);
});
