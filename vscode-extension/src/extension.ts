import * as vscode from 'vscode';
import { sortImportsResult, SortImportsOptions } from 'react-import-sorter';

const SUPPORTED_LANGUAGES = new Set([
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
  'vue',
  'svelte',
]);

const MULTI_LANGUAGE_EXTENSIONS = ['.vue', '.svelte', '.component.ts'];

function getSorterOptions(): SortImportsOptions {
  const config = vscode.workspace.getConfiguration('reactImportSorter');
  const frameworkPriority = config.get<string[]>('frameworkPriority', []);
  const throwOnParseError = config.get<boolean>('throwOnParseError', false);

  return {
    frameworkPriority: frameworkPriority.length > 0 ? frameworkPriority : undefined,
    throwOnParseError,
  };
}

async function sortDocument(editor: vscode.TextEditor): Promise<boolean> {
  const document = editor.document;
  const text = document.getText();
  const fileName = document.fileName;

  // Use language-specific sorting if available
  let result;
  if (MULTI_LANGUAGE_EXTENSIONS.some((ext: string) => fileName.endsWith(ext))) {
    // For now, we'll use standard sorting for multi-language files
    // Full multi-language support will be available after core package build completes
    result = sortImportsResult(text, getSorterOptions());
  } else {
    result = sortImportsResult(text, getSorterOptions());
  }

  const errors = result.diagnostics.filter((d: any) => d.severity === 'error');
  if (errors.length > 0) {
    const first = errors[0];
    vscode.window.showErrorMessage(`React Import Sorter: ${first.message}`);
    return false;
  }

  if (!result.changed) {
    vscode.window.showInformationMessage('React Import Sorter: Imports are already sorted.');
    return false;
  }

  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(text.length)
  );

  await editor.edit((editBuilder) => {
    editBuilder.replace(fullRange, result.code);
  });

  await document.save();
  return true;
}

class ReactImportSorterActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    // Only provide code action for supported file types
    if (!SUPPORTED_LANGUAGES.has(document.languageId)) {
      return [];
    }

    // Check if there are unsorted imports
    const text = document.getText();
    const fileName = document.fileName;

    let result;
    if (MULTI_LANGUAGE_EXTENSIONS.some((ext: string) => fileName.endsWith(ext))) {
      result = sortImportsResult(text, getSorterOptions());
    } else {
      result = sortImportsResult(text, getSorterOptions());
    }

    // If there are parse errors, don't offer code action
    const errors = result.diagnostics.filter((d: any) => d.severity === 'error');
    if (errors.length > 0) {
      return [];
    }

    // Only offer code action if imports need sorting
    if (!result.changed) {
      return [];
    }
    const actions: vscode.CodeAction[] = [];
    
    // Main action with SourceFixAll kind for code actions palette
    const action = new vscode.CodeAction(
      'Sort imports',
      vscode.CodeActionKind.SourceFixAll
    );
    action.command = {
      title: 'Sort imports',
      command: 'reactImportSorter.sortImports',
    };
    action.isPreferred = true;
    actions.push(action);

    // Also provide source.fixAll.reactImportSorter for codeActionsOnSave
    const saveAction = new vscode.CodeAction(
      'Sort imports',
      vscode.CodeActionKind.SourceFixAll.append('reactImportSorter')
    );
    saveAction.command = {
      title: 'Sort imports',
      command: 'reactImportSorter.sortImports',
    };
    actions.push(saveAction);

    return actions;
  }
}

export function activate(context: vscode.ExtensionContext): void {
  // Register sort command
  const sortCommand = vscode.commands.registerCommand('reactImportSorter.sortImports', async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showWarningMessage('React Import Sorter: No active editor found.');
      return;
    }

    if (!SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
      vscode.window.showWarningMessage(
        `React Import Sorter: Unsupported file type \"${editor.document.languageId}\".`
      );
      return;
    }

    const sorted = await sortDocument(editor);
    if (sorted) {
      vscode.window.showInformationMessage('React Import Sorter: Imports sorted.');
    }
  });

  // Register code action provider
  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'javascript' },
    new ReactImportSorterActionProvider()
  );
  vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'javascriptreact' },
    new ReactImportSorterActionProvider()
  );
  vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'typescript' },
    new ReactImportSorterActionProvider()
  );
  vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'typescriptreact' },
    new ReactImportSorterActionProvider()
  );
  vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'vue' },
    new ReactImportSorterActionProvider()
  );
  vscode.languages.registerCodeActionsProvider(
    { scheme: 'file', language: 'svelte' },
    new ReactImportSorterActionProvider()
  );

  context.subscriptions.push(sortCommand, codeActionProvider);
}

export function deactivate(): void {
  // Nothing to clean up yet.
}
