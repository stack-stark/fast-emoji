import { MatchResult } from "./constants/types";
import { getConfig } from "./config";

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchLine(lineText: string): MatchResult | null {
  const prefix = getConfig().prefix;
  const escaped = escapeRegex(prefix);
  const regex = new RegExp(`${escaped}([\\u4e00-\\u9fa5a-zA-Z]+)(?=\\s|$)`);
  const match = lineText.match(regex);

  if (!match || !match[1]) {
    return null;
  }

  const startIndex = match.index!;
  const endIndex = startIndex + match[0].length;

  return {
    name: match[1],
    startIndex,
    endIndex,
  };
}
