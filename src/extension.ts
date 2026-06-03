import * as vscode from "vscode";
import { initConfig } from "./config";
import { replaceEmoji } from "./replacer";
import { EmojiCompletionProvider } from "./provider";

export function activate(context: vscode.ExtensionContext) {
  initConfig(context);

  const selectionDisposable =
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const editor = event.textEditor;
      if (!editor) {
        return;
      }
      if (event.selections.length === 1) {
        replaceEmoji(editor, event.selections[0]);
      }
    });

  const provider = new EmojiCompletionProvider();
  const completionDisposable = vscode.languages.registerCompletionItemProvider(
    [{ scheme: "file" }, { scheme: "untitled" }],
    provider,
    ...provider.triggerCharacters
  );

  context.subscriptions.push(selectionDisposable, completionDisposable);
}

export function deactivate() {}
