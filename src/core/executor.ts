import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export async function runTool(command: string) {
  const start = Date.now();
  try {
    const { stdout, stderr } = await execAsync(command);
    return {
      output: stdout + (stderr ? `\n${stderr}` : ''),
      exitCode: 0,
      durationMs: Date.now() - start,
    };
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    return {
      output: error.stderr || error.message || String(err),
      exitCode: 1,
      durationMs: Date.now() - start,
    };
  }
}
