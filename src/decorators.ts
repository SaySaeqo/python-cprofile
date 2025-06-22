import * as vscode from 'vscode';
import * as path from 'path';

let decorationTypes: vscode.TextEditorDecorationType[] = [];

function findClosestLineNum(functionName: string, document: vscode.TextDocument, i: number): number {
    const includesFunctionDef = (num: number) => document.lineAt(num).text.includes(`def ${functionName}(`);
    if (includesFunctionDef(i)){ return i; }
    let b = i;
    let a = i;
    while (b > 0 || a < document.lineCount - 1) {
        if (b > 0) {
            b = b-1;
            if (includesFunctionDef(b)) { return b; }
        }
        if (a < document.lineCount - 1) {
            a = a+1;
            if (includesFunctionDef(a)) { return a; }
        }
    }
    return -1;
}

export function addInlineHints(profileData: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const filePath = editor.document.fileName;
    const thisFileData = profileData.split('\n')
                                .filter(line => line.startsWith(filePath))
                                .map(line => line.substring(filePath.length+1).split(' '));
    if (!thisFileData) {
        return;
    }
    const thisFileMaxTime = Math.max(...thisFileData.map(data => parseFloat(data[2])));

    decorationTypes.forEach(decorationType => decorationType.dispose());
    thisFileData.forEach(data => {
        const [functionName, lineNumText, time] = data;
        const lineNum = parseInt(lineNumText) - 1;
        const executionTime = parseFloat(time);
        const roundedTime = executionTime.toFixed(3);
        const color = getColorForExecutionTime(executionTime, thisFileMaxTime);

        const closestLineNum = findClosestLineNum(functionName, editor.document, lineNum);
        if (closestLineNum === -1) {
            return;
        }

        const decorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            isWholeLine: true,
            after: {
                contentText: `${roundedTime}s (${functionName})`,
                color: '(255,255,255,0.4)',
                margin: '0 0 0 1em'
            }
        });
        decorationTypes.push(decorationType);
        
        const range = new vscode.Range(closestLineNum, 0, closestLineNum, 0);
        const options: vscode.DecorationOptions[] = [{ range }];
        editor.setDecorations(decorationType, options);
    });
}

function getColorForExecutionTime(time: number, maxTime: number): string {
    const MAX_ALPHA = 0.8;
    const alpha = Math.min(time / maxTime, MAX_ALPHA);
    return `rgba(255, 0, 0, ${alpha})`;
}