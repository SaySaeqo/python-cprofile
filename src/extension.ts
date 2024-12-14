import * as vscode from 'vscode';
import { runProfiler, parseAndAddInlineHints } from './profiler';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "python-cprofiler" is now active!');

    let disposable = vscode.commands.registerCommand('python-cprofiler.profileCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const document = editor.document;
            const filePath = document.fileName;
            await runProfiler(filePath);
        }
    });

    context.subscriptions.push(disposable);

    // Register an event listener for changing active editor
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
        if (editor && editor.document.languageId === 'python') {
            await parseAndAddInlineHints();
        }
    });
}

export function deactivate() {}