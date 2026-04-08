const FIELD_SPAN_PATTERN =
  '<span\\s+class="(?:coverpage|orderform|keyterms|sow)_link">([^<]+)</span>';

function normalizeName(raw: string): string {
  let name = raw.trim();
  if (name.endsWith("\u2019s")) name = name.slice(0, -2);
  else if (name.endsWith("'s")) name = name.slice(0, -2);
  return name;
}

export function extractFields(content: string): string[] {
  const re = new RegExp(FIELD_SPAN_PATTERN, "g");
  const seen = new Set<string>();
  const fields: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    const name = normalizeName(match[1]);
    if (!seen.has(name)) {
      // Skip plural/singular duplicates
      if (name.endsWith("s") && seen.has(name.slice(0, -1))) continue;
      if (seen.has(name + "s")) continue;
      seen.add(name);
      fields.push(name);
    }
  }
  return fields;
}

export function fillTemplate(
  content: string,
  fields: Record<string, string>
): string {
  // Build a lookup: normalized name -> value (including singular/plural variants)
  const lookup = new Map<string, string>();
  for (const [name, value] of Object.entries(fields)) {
    lookup.set(name, value);
    if (name.endsWith("s")) lookup.set(name.slice(0, -1), value);
    else lookup.set(name + "s", value);
  }

  const re = new RegExp(FIELD_SPAN_PATTERN, "g");
  let text = content.replace(re, (_match, rawName: string) => {
    const trimmed = rawName.trim();
    const isPossessive = trimmed.endsWith("'s") || trimmed.endsWith("\u2019s");
    const base = normalizeName(trimmed);
    const value = lookup.get(base);
    if (value) {
      return isPossessive ? `${value}'s` : value;
    }
    return "___________";
  });

  // Strip remaining structural spans (headers etc.)
  text = text.replace(/<span[^>]*>/g, "");
  text = text.replace(/<\/span>/g, "");
  return text;
}
