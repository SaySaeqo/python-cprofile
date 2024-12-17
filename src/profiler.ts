import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { addInlineHints } from './decorators';

function getOutputFileName(): string {
    const output = vscode.workspace.getConfiguration('python-cprofile').get<string>('cprofileOutputFileName');
    if (!output) {
        throw new Error('Output file name not set');
    }
    return output;
}

async function getPythonPath() {
    const pythonExtension = vscode.extensions.getExtension('ms-python.python');
    if (!pythonExtension) {
        throw new Error('Python extension is not installed');
    }
    const pythonApi = await pythonExtension.activate();
    if (!pythonApi) {
        throw new Error('Failed to activate Python extension');
    }
    const selectedInterpreter = await pythonApi.environments.getActiveEnvironmentPath();
    if (!selectedInterpreter) {
        throw new Error('No active interpreter found');
    }
    return selectedInterpreter.path;
}

function goToFolderWithCProfileOutput() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error('No workspace folder is open');
    }
    let found = false;
    workspaceFolders.forEach(async (folder) => {
        const fullPath = path.join(folder.uri.fsPath, getOutputFileName());
        if (fs.existsSync(fullPath)) {
            process.chdir(folder.uri.fsPath);
            found = true;
            return;
        }
    });
    if (!found) {
        throw new Error('No profile data found');
    }
}

export async function parseCProfileOutput() {
    goToFolderWithCProfileOutput();
    const pythonPath = await getPythonPath();
    const parseScriptPath = path.join(__dirname, 'parse_profile.py');
    const parseCommand = `${pythonPath} ${parseScriptPath} ${getOutputFileName()}`;
    childProcess.exec(parseCommand, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error parsing profile data: ${stderr}`);
            console.error(`Error parsing profile data: ${stderr}`);
            return;
        }

        addInlineHints(stdout);
    });
}

export async function runCProfile(filePath: string) {
    process.chdir(path.dirname(filePath));
    const pythonPath = await getPythonPath();
    const command = `${pythonPath} -m cProfile -o ${getOutputFileName()} ${filePath}`;
    childProcess.exec(command, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error profiling file: ${stderr}`);
            console.error(`Error profiling file: ${stderr}`);
            return;
        }

        parseCProfileOutput();
    });
}