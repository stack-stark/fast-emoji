import * as vscode from "vscode";
import { EMOJI_DATA } from "./constants/emoji";
import { escapeRegex } from "./matcher";
import { getConfig } from "./config";

export class EmojiCompletionProvider implements vscode.CompletionItemProvider {
  get triggerCharacters(): string[] {
    const prefix = getConfig().prefix;
    return prefix.split("");
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const prefix = getConfig().prefix;
    const linePrefix = document
      .lineAt(position)
      .text.substring(0, position.character);
    const escaped = escapeRegex(prefix);
    const match = linePrefix.match(
      new RegExp(`${escaped}([\\u4e00-\\u9fa5a-zA-Z]*)$`)
    );

    if (!match) {
      return undefined;
    }

    const query = match[1];

    return EMOJI_DATA.filter(
      (item) => query === "" || item.name.startsWith(query)
    ).map((item) => {
      const completionItem = new vscode.CompletionItem(
        `${prefix}${item.name}`,
        vscode.CompletionItemKind.Text
      );
      completionItem.insertText = item.emoji;
      completionItem.detail = item.emoji;
      completionItem.documentation = new vscode.MarkdownString(
        `${item.emoji} **${item.name}**`
      );
      completionItem.sortText = `0${item.name}`;
      return completionItem;
    });
  }
}
