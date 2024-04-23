import * as vscode from "vscode";
import { EMOJI_DATA } from "./constants/emoji";

function insertEmoji(editor: vscode.TextEditor, emojiName: string): void {
  console.log(emojiName);

  const emoji = EMOJI_DATA.find((item) => item.name === emojiName);
  if (!emoji) {
    return;
  }

  // 使用正则表达式找到 '000' 后面跟随的emoji名称
  const regex = new RegExp(`000${emojiName}(?=\\s|$)`);
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

    // 检查用户是否只做了一个选择
    if (event.selections.length === 1) {
      const selection = event.selections[0]; // 获取当前的选择

      // 获取当前选择的行文本
      const lineText = editor.document.lineAt(selection.start.line).text;
      // 检查当前行文本中是否包含 '000' 后面跟随一个单词
      // const match = lineText.match(/000(\w+)(?=\s|$)/);
      const match = lineText.match(/000([\u4e00-\u9fa5]+)(?=\s|$)/); // 匹配 '000' 后面跟随的中文emoji名称

      if (match && match[1]) {
        const emojiName = match[1];
        insertEmoji(editor, emojiName);
        return; // 找到匹配项后退出函数
      }
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
