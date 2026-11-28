// ============================================
// TASKLYN — Local, deterministic parser for pasted task lists
//
// Turns text copied from WhatsApp, Word, Excel, Google Docs, notes,
// ChatGPT/Claude, etc. into independent tasks. No network, no AI:
// same input → same output.
//
// It recognises:
//  • one task per line (\n, \r\n, \r, U+2028/2029)
//  • numbered lists (1. 1) (1) 1- 1\ufe0f\u20e3 a) …), bullets (• - – — * + · ▪ ► ✓ ☐ …),
//    markdown checkboxes (- [ ] / - [x])
//  • WhatsApp/markdown emphasis (*negrita*, **negrita**, _cursiva_, ~tachado~, # títulos)
//  • WhatsApp exported message prefixes ("[27/11/26, 10:15] Ana: …")
//  • spreadsheet rows (tab-separated), with or without a header row
//  • labelled details under a task ("Descripción:", "Teléfono:", "Prioridad:",
//    "Ubicación:", "Fecha:", "Hora:", "Responsable:", "Maps:" …)
//
// Anything that cannot be interpreted with certainty is kept verbatim in the
// description and the result is flagged `ambiguous` so the UI asks first.
// It never invents dates, priorities or assignees.
// ============================================

export type ParsedPriority = "low" | "normal" | "medium" | "high" | "urgent";

export interface ParsedTask {
  title: string;
  description?: string;
  phoneNumbers?: string[];
  location?: string;
  locationUrl?: string;
  priority?: ParsedPriority;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM (24 h)
  /** Raw "Responsable:" value. The caller must resolve it against real members. */
  assigneeName?: string;
}

export interface ParseResult {
  tasks: ParsedTask[];
  /** True when the UI should show a preview before creating anything. */
  ambiguous: boolean;
  /** Human-readable (Spanish) reasons for the ambiguity. */
  warnings: string[];
  /** True when the text had real structure (list markers, fields, rows). */
  structured: boolean;
}

export interface ParseOptions {
  /** Reference date for "hoy"/"mañana" (defaults to now). */
  now?: Date;
  /** Max tasks created automatically without asking. */
  autoCreateLimit?: number;
}

export const MAX_TASKS_PER_PASTE = 500;
export const MAX_TITLE_LENGTH = 250;

// ---- Field dictionary ---------------------------------------------------

type FieldKey =
  | "title"
  | "description"
  | "phone"
  | "location"
  | "mapsUrl"
  | "priority"
  | "dueDate"
  | "dueTime"
  | "assignee";

const FIELD_ALIASES: Record<string, FieldKey> = {
  titulo: "title",
  tarea: "title",
  actividad: "title",
  nombre: "title",
  descripcion: "description",
  detalle: "description",
  detalles: "description",
  nota: "description",
  notas: "description",
  observacion: "description",
  observaciones: "description",
  comentario: "description",
  comentarios: "description",
  telefono: "phone",
  telefonos: "phone",
  tel: "phone",
  tlf: "phone",
  celular: "phone",
  cel: "phone",
  movil: "phone",
  whatsapp: "phone",
  contacto: "phone",
  ubicacion: "location",
  direccion: "location",
  lugar: "location",
  zona: "location",
  sector: "location",
  "google maps": "mapsUrl",
  maps: "mapsUrl",
  mapa: "mapsUrl",
  "enlace de google maps": "mapsUrl",
  "link de google maps": "mapsUrl",
  "enlace de maps": "mapsUrl",
  "link de maps": "mapsUrl",
  "enlace de ubicacion": "mapsUrl",
  "link de ubicacion": "mapsUrl",
  enlace: "mapsUrl",
  link: "mapsUrl",
  prioridad: "priority",
  urgencia: "priority",
  fecha: "dueDate",
  "fecha de vencimiento": "dueDate",
  "fecha limite": "dueDate",
  vencimiento: "dueDate",
  vence: "dueDate",
  "fecha de entrega": "dueDate",
  entrega: "dueDate",
  hora: "dueTime",
  "hora limite": "dueTime",
  "hora de vencimiento": "dueTime",
  responsable: "assignee",
  asignado: "assignee",
  "asignado a": "assignee",
  asignar: "assignee",
  "asignar a": "assignee",
  encargado: "assignee",
  tecnico: "assignee",
};

const PRIORITY_WORDS: Record<string, ParsedPriority> = {
  baja: "low",
  bajo: "low",
  low: "low",
  normal: "normal",
  media: "medium",
  medio: "medium",
  moderada: "medium",
  medium: "medium",
  alta: "high",
  alto: "high",
  high: "high",
  urgente: "urgent",
  critica: "urgent",
  critico: "urgent",
  urgent: "urgent",
  maxima: "urgent",
};

// ---- Normalisation helpers ----------------------------------------------

/** Lowercase, strip accents and collapse spaces (for dictionary lookups). */
export function foldText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNewlines(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029\u0085\u000b\u000c]/g, "\n")
    .replace(/[\u200b-\u200d\u2060\ufeff]/g, "") // zero-width chars
    .replace(/\u00a0/g, " "); // NBSP from Word / web
}

const BULLET_RE =
  /^(?:[-–—−*+•◦▪▫●○■□►▸▹▶‣⁃∙·→⇒>✓✔✗✘☐☑☒✅❌⭐🔹🔸🔷🔶▪\ufe0f➤➔➢➜]|-\s*\[[ xX✓]\]|\[[ xX✓]\])\s*/u;
// "1." "1)" "(1)" "1-" "1:" "1.-" — require whitespace after so that "1.5 m" or "2024-10" stay intact
const NUMBER_RE = /^(?:\(\d{1,3}\)|\d{1,3}(?:\.-|[.)\-:–]))\s+/;
// "a)" "b." (single letter list markers) — lowercase or with ")" only
const LETTER_RE = /^(?:[a-z][.)]|[A-Z]\))\s+/;
// Keycap emoji numbers 1\ufe0f\u20e3 2\ufe0f\u20e3 … 🔟
const KEYCAP_RE = /^(?:\d\ufe0f?\u20e3|🔟)\s*/u;
// WhatsApp export: "[27/11/26, 10:15] Ana: " or "27/11/26 10:15 - Ana: "
const WHATSAPP_PREFIX_RE =
  /^(?:\[\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?\s?m\.?)?\]\s*|\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}\s*(?:[ap]\.?\s?m\.?)?\s+-\s+)[^:]{1,40}:\s+/i;

interface MarkerInfo {
  text: string;
  hadMarker: boolean;
}

function stripMarkers(line: string): MarkerInfo {
  let s = line.trim();
  let hadMarker = false;
  const wa = s.match(WHATSAPP_PREFIX_RE);
  if (wa) {
    s = s.slice(wa[0].length);
    hadMarker = true;
  }
  // Markdown headings
  const heading = s.match(/^#{1,6}\s+/);
  if (heading) s = s.slice(heading[0].length);
  // A line fully wrapped in emphasis ("*Revisar*", "**Revisar**") is not a
  // bullet: unwrap it before looking for list markers.
  const wrapped = s.match(/^(\*\*|\*|__|_|~~|~)(\S(?:.*\S)?)\1$/);
  if (wrapped) s = wrapped[2];

  for (let i = 0; i < 2; i++) {
    const m =
      s.match(KEYCAP_RE) ||
      s.match(NUMBER_RE) ||
      s.match(LETTER_RE) ||
      s.match(BULLET_RE);
    if (!m || m[0].length === 0) break;
    s = s.slice(m[0].length);
    hadMarker = true;
  }
  return { text: stripEmphasis(s.trim()), hadMarker };
}

/** Removes WhatsApp/markdown emphasis wrappers without touching inner text. */
function stripEmphasis(s: string): string {
  let out = s
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/~~(.+?)~~/g, "$1");
  // Whole-line single wrappers *texto* _texto_ ~texto~ `texto`
  const wrap = out.match(/^([*_~`])(.+)\1$/);
  if (wrap) out = wrap[2];
  // Inline WhatsApp *bold* (only when clearly wrapped by spaces/edges)
  out = out.replace(/(^|\s)\*([^*\s][^*]*?[^*\s]|[^*\s])\*(?=\s|$|[.,;:!?])/g, "$1$2");
  return out.replace(/\s+/g, " ").trim();
}

// ---- Value parsers ------------------------------------------------------

const MAPS_URL_RE =
  /\bhttps?:\/\/(?:www\.)?(?:google\.[a-z.]+\/maps|maps\.google\.[a-z.]+|maps\.app\.goo\.gl|goo\.gl\/maps)\S*/i;

export function extractMapsUrl(s: string): string | null {
  const m = s.match(MAPS_URL_RE);
  return m ? m[0].replace(/[),.;]+$/, "") : null;
}

function parsePhones(value: string): string[] | null {
  const parts = value
    .split(/\s*(?:[,;/|]| y | o )\s*/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const phones: string[] = [];
  for (const p of parts) {
    const digits = p.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return null;
    if (!/^[+\d\s().-]+$/.test(p)) return null;
    phones.push(p.replace(/\s+/g, " "));
  }
  return phones.length ? phones : null;
}

function parsePriority(value: string): ParsedPriority | null {
  const v = foldText(value).replace(/[.!¡]/g, "").trim();
  if (PRIORITY_WORDS[v]) return PRIORITY_WORDS[v];
  const first = v.split(/[\s(,-]/)[0];
  if (PRIORITY_WORDS[first] && v.split(" ").length <= 2) return PRIORITY_WORDS[first];
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoDate(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return `${y}-${pad(m)}-${pad(d)}`;
}

const MONTHS: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9,
  oct: 10, nov: 11, dic: 12,
};

/**
 * Only unambiguous dates are accepted: full dates with a year (DD/MM/AAAA,
 * AAAA-MM-DD, "15 de diciembre de 2026") and "hoy"/"mañana"/"pasado mañana".
 * Dates without a year are rejected (kept in the description) so nothing is
 * assumed.
 */
export function parseDate(value: string, now: Date): string | null {
  const v = foldText(value).replace(/[.,]$/, "");
  const local = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  if (v === "hoy") return local(0);
  if (v === "manana") return local(1);
  if (v === "pasado manana") return local(2);

  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return isoDate(+m[1], +m[2], +m[3]);
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) return isoDate(+m[3], +m[2], +m[1]); // DD/MM/AAAA (es-DO / es-ES)
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (m) return isoDate(2000 + +m[3], +m[2], +m[1]);
  m = v.match(/^(?:[a-z]+\s+)?(\d{1,2})\s+(?:de\s+)?([a-z]+)\.?\s+(?:de\s+|del\s+)?(\d{4})$/);
  if (m && MONTHS[m[2]]) return isoDate(+m[3], MONTHS[m[2]], +m[1]);
  return null;
}

export function parseTime(value: string): string | null {
  const v = foldText(value).replace(/\s+/g, " ").replace(/\.$/, "");
  const m = v.match(/^(\d{1,2})(?:(?::|h|\.)(\d{2}))?\s*(a\.?\s?m\.?|p\.?\s?m\.?|hrs?|h)?$/);
  if (!m) return null;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0;
  const suffix = (m[3] || "").replace(/[.\s]/g, "");
  if (!m[2] && !suffix) return null; // "3" alone is ambiguous
  if (min > 59) return null;
  if (suffix === "am" || suffix === "pm") {
    if (h < 1 || h > 12) return null;
    if (suffix === "am" && h === 12) h = 0;
    if (suffix === "pm" && h !== 12) h += 12;
  } else if (h > 23) {
    return null;
  }
  return `${pad(h)}:${pad(min)}`;
}

// ---- Field-line detection -----------------------------------------------

interface FieldLine {
  key: FieldKey;
  label: string;
  value: string;
}

function matchField(text: string): FieldLine | null {
  const m = text.match(/^([\p{L}][\p{L} ]{0,28}?)\s*[:：=]\s*(.*)$/u);
  if (!m) return null;
  const key = FIELD_ALIASES[foldText(m[1])];
  if (!key) return null;
  // "Link" / "Enlace" only count as maps fields when the value is a maps URL
  if (key === "mapsUrl" && m[2] && !extractMapsUrl(m[2])) {
    const folded = foldText(m[1]);
    if (folded === "link" || folded === "enlace") return null;
  }
  return { key, label: m[1].trim(), value: m[2].trim() };
}

// ---- Spreadsheet (TSV) handling -----------------------------------------

function parseSpreadsheet(lines: string[], ctx: Ctx): boolean {
  const rows = lines.map((l) => l.split("\t").map((c) => c.trim()));
  const multiCol = rows.filter((r) => r.filter(Boolean).length > 1).length;
  if (multiCol < Math.max(1, Math.ceil(rows.length / 2))) return false;

  ctx.structured = true;
  const header = rows[0].map((c) => FIELD_ALIASES[foldText(c.replace(/[:*]$/, ""))] || null);
  const hasHeader = header.filter(Boolean).length >= 1 && header.includes("title");

  const body = hasHeader ? rows.slice(1) : rows;
  if (!hasHeader) {
    ctx.warn("Las columnas de la hoja de cálculo no tienen encabezados reconocibles; la primera columna se usará como título.");
  }
  for (const row of body) {
    const cells = row.map((c) => c.trim());
    if (!cells.some(Boolean)) continue;
    if (hasHeader) {
      const titleIdx = header.indexOf("title");
      const title = stripMarkers(cells[titleIdx] || "").text;
      if (!title) {
        ctx.warn("Una fila no tiene título y se omitió.");
        continue;
      }
      ctx.startTask(title);
      header.forEach((key, i) => {
        if (!key || key === "title" || !cells[i]) return;
        ctx.applyField({ key, label: rows[0][i], value: cells[i] });
      });
      // Unknown columns → description
      rows[0].forEach((label, i) => {
        if (!header[i] && cells[i]) ctx.appendDescription(label ? `${label}: ${cells[i]}` : cells[i]);
      });
    } else {
      const nonEmpty = cells.filter(Boolean);
      ctx.startTask(stripMarkers(nonEmpty[0]).text);
      if (nonEmpty.length > 1) ctx.appendDescription(nonEmpty.slice(1).join(" · "));
    }
  }
  return true;
}

// ---- Main parser --------------------------------------------------------

interface Ctx {
  structured: boolean;
  warn: (w: string) => void;
  startTask: (title: string) => void;
  applyField: (f: FieldLine) => void;
  appendDescription: (s: string) => void;
}

export function parseTaskText(raw: string, options: ParseOptions = {}): ParseResult {
  const now = options.now ?? new Date();
  const autoCreateLimit = options.autoCreateLimit ?? 100;
  const warnings = new Set<string>();
  const tasks: ParsedTask[] = [];
  let current: ParsedTask | null = null;
  let currentIndent = 0;
  let pendingOrphans: string[] = [];
  let sawFieldBlock = false;

  const ctx: Ctx = {
    structured: false,
    warn: (w) => warnings.add(w),
    startTask: (title) => {
      let t = title;
      if (t.length > MAX_TITLE_LENGTH) {
        warnings.add("Algunas tareas tienen títulos muy largos; revisa cómo se dividieron.");
        t = t.slice(0, MAX_TITLE_LENGTH).trim();
      }
      current = { title: t };
      if (pendingOrphans.length) {
        current.description = pendingOrphans.join("\n");
        pendingOrphans = [];
      }
      tasks.push(current);
    },
    appendDescription: (s) => {
      if (!current) {
        pendingOrphans.push(s);
        return;
      }
      current.description = current.description ? `${current.description}\n${s}` : s;
    },
    applyField: (f) => {
      if (f.key === "title") {
        if (f.value) ctx.startTask(stripEmphasis(f.value));
        return;
      }
      if (!current) {
        warnings.add(`Se encontró "${f.label}" antes de cualquier tarea.`);
        pendingOrphans.push(`${f.label}: ${f.value}`);
        return;
      }
      const task: ParsedTask = current;
      const keep = (reason: string) => {
        warnings.add(reason);
        ctx.appendDescription(`${f.label}: ${f.value}`);
      };
      if (!f.value) return;
      switch (f.key) {
        case "description":
          ctx.appendDescription(f.value);
          break;
        case "phone": {
          const phones = parsePhones(f.value);
          if (phones) task.phoneNumbers = [...(task.phoneNumbers || []), ...phones];
          else keep(`No se reconoció el teléfono "${f.value}"; se dejó en la descripción.`);
          break;
        }
        case "location": {
          const url = extractMapsUrl(f.value);
          if (url) {
            task.locationUrl = task.locationUrl || url;
            const rest = f.value.replace(url, "").trim();
            if (rest) task.location = rest;
          } else {
            task.location = task.location ? `${task.location}, ${f.value}` : f.value;
          }
          break;
        }
        case "mapsUrl": {
          const url = extractMapsUrl(f.value);
          if (url) task.locationUrl = url;
          else keep(`El enlace "${f.value}" no parece de Google Maps; se dejó en la descripción.`);
          break;
        }
        case "priority": {
          const p = parsePriority(f.value);
          if (p) task.priority = p;
          else keep(`No se reconoció la prioridad "${f.value}"; se dejó en la descripción.`);
          break;
        }
        case "dueDate": {
          // "Fecha: 15/12/2026 3:00 pm"
          const parts = f.value.match(/^(.+?)(?:\s+(?:a\s+las\s+)?(\d{1,2}(?::\d{2})?\s*(?:[ap]\.?\s?m\.?)?))?$/i);
          const date = parseDate(f.value, now) ?? (parts ? parseDate(parts[1], now) : null);
          if (date) {
            task.dueDate = date;
            if (!parseDate(f.value, now) && parts?.[2]) {
              const time = parseTime(parts[2]);
              if (time) task.dueTime = time;
            }
          } else {
            keep(`No se pudo interpretar la fecha "${f.value}" sin riesgo; se dejó en la descripción.`);
          }
          break;
        }
        case "dueTime": {
          const time = parseTime(f.value);
          if (time) task.dueTime = time;
          else keep(`No se pudo interpretar la hora "${f.value}"; se dejó en la descripción.`);
          break;
        }
        case "assignee":
          task.assigneeName = f.value;
          break;
      }
    },
  };

  const text = normalizeNewlines(raw || "");
  const rawLines = text.split("\n");
  const lines = rawLines.filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { tasks: [], ambiguous: false, warnings: [], structured: false };
  }

  const isSpreadsheet = lines.some((l) => l.includes("\t")) && parseSpreadsheet(lines, ctx);

  if (!isSpreadsheet) {
    const markerCount = lines.filter((l) => stripMarkers(l).hadMarker).length;
    const fieldCount = lines.filter((l) => matchField(stripMarkers(l).text)).length;
    if (markerCount > 0 || fieldCount > 0) ctx.structured = true;

    let prevWasHeading = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.match(/^[ \t]*/)![0].replace(/\t/g, "    ").length;
      const { text: content, hadMarker } = stripMarkers(line);
      if (!content) continue;

      const field = matchField(content);
      if (field) {
        sawFieldBlock = true;
        ctx.applyField(field);
        prevWasHeading = false;
        continue;
      }

      // In labelled blocks, an unknown "Cliente: Manuel" style line under a
      // task is a detail, not a new task. Keep it verbatim in the description.
      if (
        fieldCount > 0 &&
        current &&
        !hadMarker &&
        /^[\p{L}][\p{L} ]{0,24}[:：]\s*\S/u.test(content) &&
        content.split(/[:：]/)[0].trim().split(/\s+/).length <= 3
      ) {
        ctx.appendDescription(content);
        continue;
      }

      // A bare Google Maps URL line belongs to the current task
      const bareUrl = extractMapsUrl(content);
      if (bareUrl && bareUrl.length >= content.length - 1 && current) {
        (current as ParsedTask).locationUrl = (current as ParsedTask).locationUrl || bareUrl;
        continue;
      }

      // Heading like "Pendientes para hoy:" followed by a list → skip it
      const nextHasMarker = i + 1 < lines.length && stripMarkers(lines[i + 1]).hadMarker;
      if (!hadMarker && /[:：]$/.test(content) && nextHasMarker && markerCount > 0) {
        warnings.add(`Se omitió el encabezado "${content}".`);
        prevWasHeading = true;
        continue;
      }

      // Indented line (sub-bullet / continuation) under a task → detail
      if (current && indent > currentIndent && (indent - currentIndent >= 2)) {
        ctx.appendDescription(content);
        continue;
      }

      ctx.startTask(content);
      currentIndent = indent;
      prevWasHeading = false;
    }
    void prevWasHeading;

    // Mixed list: some lines numbered/bulleted, others plain, and no field
    // structure → could be titles + loose notes. Ask first.
    if (!sawFieldBlock && markerCount > 0 && markerCount < tasks.length) {
      warnings.add("Algunas líneas tienen viñetas o números y otras no; revisa cómo se dividieron las tareas.");
    }
  }

  if (pendingOrphans.length) {
    warnings.add("Hay información que no pertenece a ninguna tarea.");
    if (tasks.length) {
      const last = tasks[tasks.length - 1];
      last.description = [last.description, ...pendingOrphans].filter(Boolean).join("\n");
    }
  }

  let finalTasks = tasks.filter((t) => t.title.trim().length > 0);
  if (finalTasks.length > MAX_TASKS_PER_PASTE) {
    warnings.add(`Solo se pueden crear ${MAX_TASKS_PER_PASTE} tareas a la vez; se tomarán las primeras ${MAX_TASKS_PER_PASTE}.`);
    finalTasks = finalTasks.slice(0, MAX_TASKS_PER_PASTE);
  }
  if (finalTasks.length > autoCreateLimit) {
    warnings.add(`Se van a crear ${finalTasks.length} tareas; confirma antes de continuar.`);
  }
  // Prose: a single long line that reads like sentences is probably one task
  // description, not a list — ask.
  const longLines = finalTasks.filter((t) => t.title.length > 160).length;
  if (longLines > 0 && finalTasks.length > 1) {
    warnings.add("Algunas líneas son muy largas y podrían ser párrafos en lugar de tareas.");
  }

  return {
    tasks: finalTasks,
    ambiguous: warnings.size > 0,
    warnings: [...warnings],
    structured: ctx.structured,
  };
}

/** Accent/case-insensitive unique member match. Returns userId or null. */
export function resolveAssignee(
  name: string,
  members: Array<{ userId: string; name: string }>,
): string | null {
  const target = foldText(name).replace(/^@/, "");
  if (!target) return null;
  const exact = members.filter((m) => foldText(m.name) === target);
  if (exact.length === 1) return exact[0].userId;
  if (exact.length > 1) return null;
  // Unique first-name / prefix match ("Pedro" → "Pedro Martínez")
  const partial = members.filter((m) => {
    const folded = foldText(m.name);
    return folded.split(" ").includes(target) || folded.startsWith(`${target} `);
  });
  return partial.length === 1 ? partial[0].userId : null;
}
