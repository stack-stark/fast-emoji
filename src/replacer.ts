import * as vscode from "vscode";
import { emojiMap } from "./constants/emoji";
import { matchLine } from "./matcher";

export function replaceEmoji(
  editor: vscode.TextEditor,
  selection: vscode.Selection
): void {
  const line = editor.document.lineAt(selection.start.line);
  const result = matchLine(line.text);

  if (!result) {
    return;
  }

  const emoji = emojiMap.get(result.name);
  if (!emoji) {
    return;
  }

  const replaceRange = new vscode.Range(
    new vscode.Position(selection.start.line, result.startIndex),
    new vscode.Position(selection.start.line, result.endIndex)
  );

  editor.edit((builder) => {
    builder.replace(replaceRange, emoji);
  });
}
