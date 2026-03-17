function normalizeWhitespace(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

export function normalizeTag(value) {
  return normalizeWhitespace(value);
}

export function normalizeTagKey(value) {
  return normalizeTag(value).toLowerCase();
}

export function dedupeTags(tags) {
  const result = [];
  const seen = new Set();

  (tags || []).forEach((tag) => {
    const normalized = normalizeTag(tag);
    if (!normalized) {
      return;
    }

    const key = normalizeTagKey(normalized);
    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(normalized);
  });

  return result;
}
