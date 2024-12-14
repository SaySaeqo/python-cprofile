import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import { addInlineHints } from './decorators';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getSelectedInterpreter() {
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (!pythonExtension) {
        throw new Error('Python extension is not installed');
    }

    // Activate the Python extension
    const pythonApi = await pythonExtension.activate();
    if (!pythonApi) {
        throw new Error('Failed to activate Python extension');
    }

    // Get the selected interpreter
    const interpreter = await pythonApi.environments.getActiveEnvironmentPath();
    if (!interpreter) {
        throw new Error('No active interpreter found');
    }

    return interpreter;
}

export async function parseAndAddInlineHints() {
    console.log('Parsing and adding inline hints');
    const outputFilePath = "cprofiler.prof";
    // return if the file does not exist
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return null;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    process.chdir(workspacePath);
    const fullPath = path.join(workspacePath, outputFilePath);
    if (!fs.existsSync(outputFilePath)) {
        return;
    }
    const pythonInterpreter = await getSelectedInterpreter();
    const pythonPath = pythonInterpreter.path;
    const parseScriptPath = path.join(__dirname, 'parse_profile.py');
    const parseCommand = `${pythonPath} ${parseScriptPath} ${outputFilePath}`;
    child_process.exec(parseCommand, (parseError, parseStdout, parseStderr) => {
        if (parseError) {
            vscode.window.showErrorMessage(`Error parsing profile data: ${parseStderr}`);
            console.error(`Error parsing profile data: ${parseStderr}`);
            return;
        }

        try {
            const editorPath = vscode.window.activeTextEditor?.document.fileName; 
            if (!editorPath) {
                return;
            }
            addInlineHints(parseStdout, editorPath);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Error adding inline hints: ${e.message}`);
            console.error(`Error adding inline hints: ${e.message}`);
        }
    });
    
}

export async function runProfiler(filePath: string) {
    const outputFilePath = `cprofiler.prof`;
    const pythonInterpreter = await getSelectedInterpreter();
    const pythonPath = pythonInterpreter.path;

    // move to the workspace folder
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder is open');
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    process.chdir(workspacePath);

    const command = `${pythonPath} -m cProfile -o ${outputFilePath} ${filePath}`;

    child_process.exec(command, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error profiling file: ${stderr}`);
            console.error(`Error profiling file: ${stderr}`);
            return;
        }

        parseAndAddInlineHints();
    });
}