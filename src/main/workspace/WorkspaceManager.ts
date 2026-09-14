import fs from 'fs/promises';
import path from 'path';

export interface ProjectProfile {
  framework: string;
  packageManager: string;
  devCommand: string;
  testCommand: string;
  buildCommand: string;
  preferredPort: number;
}

export class WorkspaceManager {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = path.resolve(workspacePath);
  }

  async validateWorkspace(): Promise<boolean> {
    try {
      const stats = await fs.stat(this.workspacePath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  getWorkspaceRoot(): string {
    return this.workspacePath;
  }

  resolvePath(relativePath: string): string {
    // Sandbox restriction
    const resolved = path.resolve(this.workspacePath, relativePath);
    if (!resolved.startsWith(this.workspacePath)) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }

  async discoverProject(): Promise<ProjectProfile> {
    let framework = 'Unknown';
    let packageManager = 'npm';
    let devCommand = 'npm run dev';
    let testCommand = 'npm test';
    let buildCommand = 'npm run build';
    let preferredPort = 3000;

    const files = await fs.readdir(this.workspacePath);
    
    if (files.includes('pnpm-lock.yaml')) packageManager = 'pnpm';
    else if (files.includes('yarn.lock')) packageManager = 'yarn';
    else if (files.includes('bun.lockb') || files.includes('bun.lock')) packageManager = 'bun';

    const pkgPath = this.resolvePath('package.json');
    try {
      const pkgRaw = await fs.readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgRaw);

      if (pkg.dependencies?.['next'] || pkg.devDependencies?.['next']) framework = 'Next.js';
      else if (pkg.dependencies?.['react'] && files.includes('vite.config.ts')) framework = 'React/Vite';
      else if (pkg.dependencies?.['express']) framework = 'Express';
      
      if (pkg.scripts?.dev) devCommand = `${packageManager} run dev`;
      else if (pkg.scripts?.start) devCommand = `${packageManager} start`;
      
      if (pkg.scripts?.test) testCommand = `${packageManager} run test`;
      
      if (pkg.scripts?.build) buildCommand = `${packageManager} run build`;
    } catch {
      // Ignored
    }

    if (framework === 'React/Vite') preferredPort = 5173;
    if (framework === 'Next.js') preferredPort = 3000;

    return {
      framework,
      packageManager,
      devCommand,
      testCommand,
      buildCommand,
      preferredPort,
    };
  }
}
