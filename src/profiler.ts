import * as vscode from 'vscode';
import * as childProcess from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { addInlineHints } from './decorators';

const OUTPUT_FILE_NAME = "cProfile.prof";

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

function goToWorkspaceWithProfileFile() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        throw new Error('No workspace folder is open');
    }
    let found = false;
    workspaceFolders.forEach(async (folder) => {
        const fullPath = path.join(folder.uri.fsPath, OUTPUT_FILE_NAME);
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

export async function parseCProfilerOutput() {
    try {
        goToWorkspaceWithProfileFile();
        const pythonPath = await getPythonPath();
        const parseScriptPath = path.join(__dirname, 'parse_profile.py');
        const parseCommand = `${pythonPath} ${parseScriptPath} ${OUTPUT_FILE_NAME}`;
        childProcess.exec(parseCommand, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error parsing profile data: ${stderr}`);
                console.error(`Error parsing profile data: ${stderr}`);
                return;
            }

            addInlineHints(stdout);
        });
    } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
        console.error(error.message);
        return;
    }
}

export async function runProfiler(filePath: string) {
    process.chdir(path.dirname(filePath));
    const pythonPath = await getPythonPath();
    const command = `${pythonPath} -m cProfile -o ${OUTPUT_FILE_NAME} ${filePath}`;
    childProcess.exec(command, (error, stdout, stderr) => {
        if (error) {
            vscode.window.showErrorMessage(`Error profiling file: ${stderr}`);
            console.error(`Error profiling file: ${stderr}`);
            return;
        }

        parseCProfilerOutput();
    });
}