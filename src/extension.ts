import * as vscode from "vscode";
import { EMOJI_DATA } from "./constants/emoji";

function getPrefix(): string {
  return vscode.workspace.getConfiguration().get("fast-emoji.prefix") || "000";
}

function insertEmoji(editor: vscode.TextEditor, emojiName: string): void {
  console.log(emojiName);

  const emoji = EMOJI_DATA.find((item) => item.name === emojiName);
  if (!emoji) {
    return;
  }

  // 使用正则表达式找到 '000' 后面跟随的emoji名称
  const regex = new RegExp(`${getPrefix()}${emojiName}(?=\\s|$)`);
  const match = editor.document.getText().match(regex);

  if (match) {
    // 构建一个替换范围，匹配 '000' 后面的emoji名称
    const replaceRange = new vscode.Range(
      editor.document.positionAt(
        editor.document.getText().lastIndexOf(match[0])
      ),
      editor.selection.start
    );

    // 使用editBuilder替换文本
    editor
      .edit((editBuilder) => {
        editBuilder.replace(replaceRange, emoji.emoji); // 插入emoji
      })
      .then(() => {
        //vscode.window.showInformationMessage(`Inserted: ${emoji}`);
      });
  }
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.window.onDidChangeTextEditorSelection((event) => {
    const editor = event.textEditor;
    if (!editor) {
      return;
    }
    if (event.selections.length === 1) {
      const selection = event.selections[0];
      const lineText = editor.document.lineAt(selection.start.line).text;
      const prefix = getPrefix();
      //const match = lineText.match(/prefix([\u4e00-\u9fa5]+)(?=\s|$)/);
      const match = lineText.match(
        new RegExp(`${prefix}([\\u4e00-\\u9fa5]+)(?=\\s|$)`)
      );
      if (match && match[1]) {
        const emojiName = match[1];
        insertEmoji(editor, emojiName);
        return;
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
