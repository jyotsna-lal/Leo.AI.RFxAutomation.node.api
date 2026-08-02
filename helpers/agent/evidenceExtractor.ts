import {
  AgentEvent,
  JourneyEvidence,
  LineItem,
  Supplier
} from "./responseTypes";

export function emptyEvidence(): JourneyEvidence {
  return {
    scopeConfirmed: false,
    finalReviewConfirmed: false,
    items: [],
    suppliers: [],
    messages: []
  };
}

export function extractEvidence(
  events: AgentEvent[],
  current: JourneyEvidence = emptyEvidence()
): JourneyEvidence {
  const next: JourneyEvidence = {
    ...current,
    items: [...current.items],
    suppliers: [...current.suppliers],
    messages: [...current.messages]
  };

  for (const event of events) {
    if (event.text) {
      next.messages.push(event.text);

      const text = event.text.toLowerCase();
      if (text.includes("scope confirmed") || text.includes("selected scope")) {
        next.scopeConfirmed = true;
      }
      if (text.includes("final review confirmed")) {
        next.finalReviewConfirmed = true;
      }
    }

    const data = asRecord(event.data);
    if (!data) continue;

    for (const item of readItems(data)) {
      if (!next.items.some(existing => existing.name === item.name)) {
        next.items.push(item);
      }
    }

    for (const supplier of readSuppliers(data)) {
      if (!next.suppliers.some(existing => existing.name === supplier.name)) {
        next.suppliers.push(supplier);
      }
    }

    const documentId = readString(data, ["documentId", "document_id"]);
    const rfxNumber = readString(data, ["rfxNumber", "rfx_number"]);
    const status = readString(data, ["status", "documentStatus"]);

    if (documentId) next.documentId = documentId;
    if (rfxNumber) next.rfxNumber = rfxNumber;
    if (status) next.status = status;
  }

  return next;
}

function readItems(data: Record<string, unknown>): LineItem[] {
  const candidate = data.items ?? data.lineItems ?? data.recommendedItems;
  if (!Array.isArray(candidate)) return [];

  return candidate.flatMap(value => {
    const item = asRecord(value);
    if (!item) return [];

    const name = readString(item, ["name", "description", "itemName"]);
    if (!name) return [];

    const quantity = readNumber(item, ["quantity", "qty"]);
    const unit = readString(item, ["unit", "uom"]);

    return [{ name, quantity, unit }];
  });
}

function readSuppliers(data: Record<string, unknown>): Supplier[] {
  const candidate = data.suppliers ?? data.recommendedSuppliers;
  if (!Array.isArray(candidate)) return [];

  return candidate.flatMap(value => {
    const supplier = asRecord(value);
    if (!supplier) return [];

    const name = readString(supplier, ["name", "supplierName"]);
    if (!name) return [];

    return [{ name, score: readNumber(supplier, ["score", "confidence"]) }];
  });
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function readString(
  record: Record<string, unknown>,
  keys: string[]
): string | undefined {
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key]!.trim()) {
      return (record[key] as string).trim();
    }
  }
  return undefined;
}

function readNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    if (typeof record[key] === "number") return record[key] as number;
  }
  return undefined;
}
