import { spawn, type ChildProcess } from 'node:child_process';

export interface AgentRun {
  pid: number;
  stop(): void;
}

export interface RunAgentTurnOpts {
  agentType: 'opencode' | 'hermes';
  prompt: string;
  cwd: string; // worktree 路徑
  otpSessionId: string; // 我們自己的 session UUID
  agentSessionId?: string; // hermes native ID（已知時）/ session name（本實作決策）
  onOutput?: (chunk: string, label: 'agent' | 'error') => void;
  onExit?: (code: number | null) => void;
  onAgentSessionId?: (id: string) => void; // hermes 首輪解析出 native ID 時回調
}

/**
 * Hermes session strategy (決策):
 * - `hermes chat --help` 說明 `--pass-session-id` 為 "Include the session ID in the agent's
 *   system prompt"，並非 stdout 可解析輸出；且本環境 provider 不可用時無法實測輸出格式。
 * - 因此不採 stdout 解析 native session ID，改採穩定方案：
 *   每輪皆使用 `--continue <sessionName> --create-if-missing --oneshot`，其中 sessionName
 *   優先用已知 agentSessionId，否則用 otpSessionId，將 OTP session ID 作為 hermes session name。
 * - 首輪成功 spawn 後即以該 sessionName 回呼 `onAgentSessionId` 供持久化；後續輪同樣走
 *   `--continue` 續接（而非 `--resume <native-id>`），避免依賴不可驗證的 ID 解析。
 */
function quoteCmdArg(value: string): string {
  // Basic cmd.exe quoting for use with shell:true command strings.
  return `"${value.replace(/"/g, '""')}"`;
}

export function runAgentTurn(opts: RunAgentTurnOpts): AgentRun {
  const { agentType, prompt, cwd, otpSessionId, agentSessionId, onOutput, onExit, onAgentSessionId } = opts;

  let proc: ChildProcess;
  if (agentType === 'opencode') {
    // opencode: prompt as argv (spec). On Windows .cmd shim requires shell; pass as a
    // command string to avoid DEP0190 and keep prompt quoting explicit.
    if (process.platform === 'win32') {
      const cmd = ['opencode', 'run', '-s', quoteCmdArg(otpSessionId), '--auto', quoteCmdArg(prompt)].join(' ');
      proc = spawn(cmd, {
        cwd,
        shell: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      proc = spawn('opencode', ['run', '-s', otpSessionId, '--auto', prompt], {
        cwd,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }
  } else {
    // hermes: real exe (shell:false), prompt via stdin with --query-file - for safety.
    const sessionName = agentSessionId || otpSessionId;
    const args = ['chat', '--query-file', '-', '--continue', sessionName, '--create-if-missing', '--oneshot'];
    proc = spawn('hermes', args, {
      cwd,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (proc.stdin) {
      proc.stdin.write(prompt);
      proc.stdin.end();
    }
    onAgentSessionId?.(sessionName);
  }

  proc.on('error', (err) => {
    onOutput?.(err.message, 'error');
    onExit?.(1);
  });

  proc.stdout?.on('data', (chunk: Buffer | string) => {
    onOutput?.(chunk.toString(), 'agent');
  });

  proc.stderr?.on('data', (chunk: Buffer | string) => {
    onOutput?.(chunk.toString(), 'error');
  });

  proc.on('exit', (code) => {
    onExit?.(code);
  });

  return {
    pid: proc.pid ?? -1,
    stop() {
      const pid = proc.pid;
      if (!pid) return;
      if (process.platform === 'win32') {
        // node kill cannot reliably kill shell:true child trees on Windows.
        spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        try {
          process.kill(pid, 'SIGTERM');
        } catch {
          /* already exited */
        }
      }
    },
  };
}

/** Kill an agent process by PID (CLI stop). */
export function killAgent(pid: number): void {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      /* process already exited */
    }
  }
}
