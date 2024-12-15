import * as vscode from 'vscode';
import { runCProfile, parseCProfileOutput } from './profiler';

function requirePythonEditor(): vscode.TextEditor {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        throw new Error('No active text editor found');
    }
    if (editor.document.languageId !== 'python') {
        throw new Error('Active file is not a Python file');
    }
    return editor;
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('python-cprofile.profileCode', async () => {
        try {
            const editor = requirePythonEditor();
            runCProfile(editor.document.fileName);
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }
    ));
    context.subscriptions.push(vscode.commands.registerCommand('python-cprofile.addInlineHints', async () => {
        try {
            const editor = requirePythonEditor();
            parseCProfileOutput();
        } catch (error: any) {
            vscode.window.showErrorMessage(error.message);
        }
    }));

    vscode.window.onDidChangeActiveTextEditor(async (editor?: vscode.TextEditor) => {
        if (editor && editor.document.languageId === 'python') {
            try {
                parseCProfileOutput();
            } catch (error: any) {
                // Ignore errors
            }
        }
    });
}

export function deactivate() {}