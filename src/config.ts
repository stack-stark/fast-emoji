import * as vscode from "vscode";
import { ExtensionConfig } from "./constants/types";

let cachedConfig: ExtensionConfig;

export function initConfig(context: vscode.ExtensionContext): void {
  cachedConfig = readConfig();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("fast-emoji.prefix")) {
        cachedConfig = readConfig();
      }
    })
  );
}

export function getConfig(): ExtensionConfig {
  return cachedConfig;
}

function readConfig(): ExtensionConfig {
  return {
    prefix:
      vscode.workspace.getConfiguration().get("fast-emoji.prefix") || "000",
  };
}
