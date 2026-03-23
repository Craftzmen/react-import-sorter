"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const react_import_sorter_1 = require("react-import-sorter");
const SUPPORTED_LANGUAGES = new Set([
    'javascript',
    'javascriptreact',
    'typescript',
    'typescriptreact',
    'vue',
    'svelte',
]);
const MULTI_LANGUAGE_EXTENSIONS = ['.vue', '.svelte', '.component.ts'];
function getSorterOptions() {
    const config = vscode.workspace.getConfiguration('reactImportSorter');
    const frameworkPriority = config.get('frameworkPriority', []);
    const throwOnParseError = config.get('throwOnParseError', false);
    return {
        frameworkPriority: frameworkPriority.length > 0 ? frameworkPriority : undefined,
        throwOnParseError,
    };
}
async function sortDocument(editor) {
    const document = editor.document;
    const text = document.getText();
    const fileName = document.fileName;
    // Use language-specific sorting if available
    let result;
    if (MULTI_LANGUAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
        // For now, we'll use standard sorting for multi-language files
        // Full multi-language support will be available after core package build completes
        result = (0, react_import_sorter_1.sortImportsResult)(text, getSorterOptions());
    }
    else {
        result = (0, react_import_sorter_1.sortImportsResult)(text, getSorterOptions());
    }
    const errors = result.diagnostics.filter((d) => d.severity === 'error');
    if (errors.length > 0) {
        const first = errors[0];
        vscode.window.showErrorMessage(`React Import Sorter: ${first.message}`);
        return false;
    }
    if (!result.changed) {
        vscode.window.showInformationMessage('React Import Sorter: Imports are already sorted.');
        return false;
    }
    const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
    await editor.edit((editBuilder) => {
        editBuilder.replace(fullRange, result.code);
    });
    await document.save();
    return true;
}
class ReactImportSorterActionProvider {
    provideCodeActions(document, range, context) {
        // Only provide code action for supported file types
        if (!SUPPORTED_LANGUAGES.has(document.languageId)) {
            return [];
        }
        // Check if there are unsorted imports
        const text = document.getText();
        const fileName = document.fileName;
        let result;
        if (MULTI_LANGUAGE_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
            result = (0, react_import_sorter_1.sortImportsResult)(text, getSorterOptions());
        }
        else {
            result = (0, react_import_sorter_1.sortImportsResult)(text, getSorterOptions());
        }
        // If there are parse errors, don't offer code action
        const errors = result.diagnostics.filter((d) => d.severity === 'error');
        if (errors.length > 0) {
            return [];
        }
        // Only offer code action if imports need sorting
        if (!result.changed) {
            return [];
        }
        const actions = [];
        // Main action with SourceFixAll kind for code actions palette
        const action = new vscode.CodeAction('Sort imports', vscode.CodeActionKind.SourceFixAll);
        action.command = {
            title: 'Sort imports',
            command: 'reactImportSorter.sortImports',
        };
        action.isPreferred = true;
        actions.push(action);
        // Also provide source.fixAll.reactImportSorter for codeActionsOnSave
        const saveAction = new vscode.CodeAction('Sort imports', vscode.CodeActionKind.SourceFixAll.append('reactImportSorter'));
        saveAction.command = {
            title: 'Sort imports',
            command: 'reactImportSorter.sortImports',
        };
        actions.push(saveAction);
        return actions;
    }
}
function activate(context) {
    // Register sort command
    const sortCommand = vscode.commands.registerCommand('reactImportSorter.sortImports', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('React Import Sorter: No active editor found.');
            return;
        }
        if (!SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
            vscode.window.showWarningMessage(`React Import Sorter: Unsupported file type \"${editor.document.languageId}\".`);
            return;
        }
        const sorted = await sortDocument(editor);
        if (sorted) {
            vscode.window.showInformationMessage('React Import Sorter: Imports sorted.');
        }
    });
    // Register code action provider
    const codeActionProvider = vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'javascript' }, new ReactImportSorterActionProvider());
    vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'javascriptreact' }, new ReactImportSorterActionProvider());
    vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'typescript' }, new ReactImportSorterActionProvider());
    vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'typescriptreact' }, new ReactImportSorterActionProvider());
    vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'vue' }, new ReactImportSorterActionProvider());
    vscode.languages.registerCodeActionsProvider({ scheme: 'file', language: 'svelte' }, new ReactImportSorterActionProvider());
    context.subscriptions.push(sortCommand, codeActionProvider);
}
function deactivate() {
    // Nothing to clean up yet.
}
//# sourceMappingURL=extension.js.map