import * as vscode from 'vscode';

export function addInlineHints(profileData: string, filePath: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const lines = profileData.split('\n');

    lines.forEach(line => {
        const match = line.match(/(\d+\.\d+)\s+(\S+)\s+(\S+)\s+(\d+)/);
        if (match) {
            const [_, time, functionName, filename, line] = match;
            if (filename !== filePath) {
                return;
            }
            const executionTime = parseFloat(time);
            const roundedTime = executionTime.toFixed(3);
            const color = getColorForExecutionTime(executionTime);
            const lineNum = parseInt(line) - 1;

            const decorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: color,
                after: {
                    contentText: ` ${roundedTime}s`,
                    color: 'white',
                    margin: '0 0 0 1em'
                }
            });

            const lineText = editor.document.lineAt(lineNum).text;
            const range = new vscode.Range(lineNum, 0, lineNum, lineText.length);
            const decorations: vscode.DecorationOptions[] = [];
            decorations.push({ range });
            editor.setDecorations(decorationType, decorations);
        }
    });
}

function getColorForExecutionTime(time: number): string {
    if (time > 1) {
        return 'rgba(255, 0, 0, 0.5)'; // Red for high execution time
    } else if (time > 0.5) {
        return 'rgba(255, 165, 0, 0.5)'; // Orange for medium execution time
    } else {
        return 'rgba(0, 255, 0, 0.5)'; // Green for low execution time
    }
}