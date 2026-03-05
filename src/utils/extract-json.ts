/**
 * Extracts a JSON string from text that may contain markdown code fences.
 * Handles:
 * - Raw JSON strings
 * - JSON wrapped in ```json ... ``` fences
 * - JSON wrapped in ``` ... ``` fences
 */
export function extractJson(text: string): string {
  const trimmed = text.trim();

  // Match ```json ... ``` or ``` ... ``` fences
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  return trimmed;
}
