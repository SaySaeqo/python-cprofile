import * as vscode from 'vscode';
import { runProfiler, parseCProfilerOutput } from './profiler';

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
    context.subscriptions.push(vscode.commands.registerCommand('python-cprofiler.profileCode', async () => {
        const editor = requirePythonEditor();
        runProfiler(editor.document.fileName);
    }
    ));
    context.subscriptions.push(vscode.commands.registerCommand('python-cprofiler.addInlineHints', async () => {
        requirePythonEditor();
        parseCProfilerOutput();
    }));

    vscode.window.onDidChangeActiveTextEditor(async (editor?: vscode.TextEditor) => {
        if (editor && editor.document.languageId === 'python') {
            parseCProfilerOutput();
        }
    });
}

export function deactivate() {}