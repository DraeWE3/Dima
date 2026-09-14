export interface AgentStatus {
  state: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'INTERRUPTED';
  message?: string;
  error?: string;
}

export interface AgentOutput {
  stdout: string;
  stderr: string;
  toolCalls: Array<{ name: string; args: any; result: any }>;
}

export interface AntigravityAdapter {
  initialize(config: any): Promise<void>;
  
  startTask(input: {
    workspacePath: string;
    prompt: string;
    missionId?: string;
    model?: string;
  }): Promise<{ sessionId: string }>;
  
  getStatus(sessionId: string): Promise<AgentStatus>;
  
  getOutput(sessionId: string): Promise<AgentOutput>;
  
  sendInstruction(
    sessionId: string,
    instruction: string
  ): Promise<void>;
  
  interrupt(sessionId: string): Promise<void>;
  
  close(sessionId: string): Promise<void>;
}
