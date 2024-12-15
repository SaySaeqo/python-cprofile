import * as vscode from 'vscode';
import * as path from 'path';

let decorationTypes: vscode.TextEditorDecorationType[] = [];

export function addInlineHints(profileData: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const filePath = editor.document.fileName;
    const thisFileData = profileData.split('\n')
                                .map(line => line.split(' '))
                                .filter(line => line[0] === filePath || line[0] === filePath.substring(filePath.lastIndexOf(path.delimiter + 1)));
    if (!thisFileData) {
        return;
    }
    const thisFileMaxTime = Math.max(...thisFileData.map(data => parseFloat(data[3])));

    decorationTypes.forEach(decorationType => decorationType.dispose());
    thisFileData.forEach(data => {
        const [filename, functionName, lineNumText, time] = data;
        const lineNum = parseInt(lineNumText) - 1;
        const executionTime = parseFloat(time);
        const roundedTime = executionTime.toFixed(3);
        const color = getColorForExecutionTime(executionTime, thisFileMaxTime);

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
        const range = new vscode.Range(lineNum, 0, lineNum, 0);
        const options: vscode.DecorationOptions[] = [{ range }];
        editor.setDecorations(decorationType, options);
    });
}

function getColorForExecutionTime(time: number, maxTime: number): string {
    const MAX_ALPHA = 0.8;
    const alpha = Math.min(time / maxTime, MAX_ALPHA);
    return `rgba(255, 0, 0, ${alpha})`;
}