/** Parsed fields from a medicine package label (OCR or AI vision). */
export type ParsedLabel = {
  medicineName?: string;
  strength?: string;
  dosageForm?: string;
  batchNumber?: string;
  expiryDate?: string;
  category?: string;
};

const BATCH_PATTERNS = [
  /\b(BN\d{4,8})\b/i,
  /\b(BTH[-\s]?\d{4}[-\s]?\d{2,4})\b/i,
  /\b(LOT[-\s]?[A-Z0-9]{4,12})\b/i,
  /\bBATCH\s*[:#]?\s*([A-Z0-9-]{4,20})\b/i,
];

const EXPIRY_PATTERNS = [
  /(?:exp(?:iry)?|use\s*by|best\s*before)\s*[:.]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  /(?:exp(?:iry)?|use\s*by|best\s*before)\s*[:.]?\s*(\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2})/i,
  /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
];

const STRENGTH_PATTERN = /\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|iu)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:mg|g|ml))?)\b/i;

const DOSAGE_FORMS = ["Tablet", "Capsule", "Sachet", "Syrup", "Injection", "Cream", "Drops"];

const KNOWN_MEDICINES = [
  "Paracetamol", "Amoxicillin", "Cetirizine", "Ibuprofen", "Azithromycin",
  "Metformin", "Coartem", "Artemether", "Lumefantrine", "Vitamin C", "Omeprazole",
  "Ciprofloxacin", "ORS", "Oral Rehydration",
];

function toIsoDate(raw: string): string | undefined {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  const months: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };

  const named = cleaned.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (named) {
    const mon = months[named[2].slice(0, 3).toLowerCase()];
    if (mon) return `${named[3]}-${mon}-${named[1].padStart(2, "0")}`;
  }

  const parts = cleaned.split(/[\/\-.]/);
  if (parts.length === 3) {
    let [a, b, c] = parts.map((p) => p.trim());
    if (c.length === 2) c = `20${c}`;
    if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
    return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  return undefined;
}

export function isValidMedicineName(name: string): boolean {
  if (!name || name.length < 3) return false;
  const letters = (name.match(/[a-zA-Z]/g) || []).length;
  if (letters < 3) return false;
  if (/[=<>[\]{}|\\^`~]/.test(name)) return false;
  return letters / name.replace(/\s/g, "").length > 0.5;
}

/** Sanitize parsed OCR — drop garbage fields */
export function sanitizeParsed(parsed: ParsedLabel): ParsedLabel {
  const out: ParsedLabel = {};
  if (parsed.medicineName && isValidMedicineName(parsed.medicineName)) {
    out.medicineName = parsed.medicineName.trim();
  }
  if (parsed.strength && /\d/.test(parsed.strength)) out.strength = parsed.strength.trim();
  if (parsed.dosageForm) out.dosageForm = parsed.dosageForm.trim();
  if (parsed.batchNumber && /[A-Z0-9]{3,}/i.test(parsed.batchNumber)) {
    out.batchNumber = parsed.batchNumber.replace(/\s+/g, "").toUpperCase();
  }
  if (parsed.expiryDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.expiryDate)) {
    out.expiryDate = parsed.expiryDate;
  }
  if (parsed.category) out.category = parsed.category.trim();
  return out;
}

function parseLabelTextRaw(text: string): ParsedLabel {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const joined = lines.join(" ");

  let batchNumber: string | undefined;
  for (const pat of BATCH_PATTERNS) {
    const m = joined.match(pat);
    if (m) {
      batchNumber = (m[1] || m[0]).replace(/\s+/g, "").toUpperCase();
      break;
    }
  }

  let expiryDate: string | undefined;
  for (const pat of EXPIRY_PATTERNS) {
    const m = joined.match(pat);
    if (m?.[1]) {
      expiryDate = toIsoDate(m[1]);
      if (expiryDate) break;
    }
  }

  const strength = joined.match(STRENGTH_PATTERN)?.[1];

  let dosageForm: string | undefined;
  for (const form of DOSAGE_FORMS) {
    if (new RegExp(form, "i").test(joined)) {
      dosageForm = form;
      break;
    }
  }

  let medicineName: string | undefined;
  for (const med of KNOWN_MEDICINES) {
    if (new RegExp(med.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(joined)) {
      medicineName = strength ? `${med} ${strength}` : med;
      break;
    }
  }
  if (!medicineName) {
    const candidate = lines.find((l) => /[a-zA-Z]{4,}/.test(l) && !/exp|batch|lot|mg|manufact/i.test(l));
    if (candidate) medicineName = candidate.slice(0, 60);
  }

  return {
    medicineName,
    strength,
    dosageForm,
    batchNumber,
    expiryDate,
    category: guessCategory(medicineName || joined),
  };
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/paracetamol|ibuprofen/.test(n)) return "Analgesic";
  if (/amoxicillin|azithromycin|cipro/.test(n)) return "Antibiotic";
  if (/cetirizine/.test(n)) return "Antihistamine";
  if (/coartem|artemether|lumefantrine/.test(n)) return "Antimalarial";
  if (/metformin/.test(n)) return "Antidiabetic";
  if (/vitamin/.test(n)) return "Supplement";
  if (/ors|rehydration/.test(n)) return "Electrolyte";
  return "Other";
}

/** Parse raw OCR text into structured label fields. */
export function parseLabelText(text: string): ParsedLabel {
  return sanitizeParsed(parseLabelTextRaw(text));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Browser OCR via Tesseract.js — free, no API key. */
export async function ocrWithTesseract(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ text: string; parsed: ParsedLabel }> {
  const Tesseract = await import("tesseract.js");
  const result = await Tesseract.recognize(file, "eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  const text = result.data.text;
  return { text, parsed: sanitizeParsed(parseLabelTextRaw(text)) };
}
