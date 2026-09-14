import * as fs from 'fs';
import * as path from 'path';

export interface DiscoveredRoute {
  endpoint: string; // e.g. /api/webhooks/stripe
  filePath: string;
  methods: string[]; // GET, POST, etc.
}

export class RouteScanner {
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
  }

  /**
   * Scans the app/api directory of a Next.js app 13+ (App Router)
   * and returns all API endpoints.
   */
  public async discoverAllRoutes(): Promise<DiscoveredRoute[]> {
    const apiDir = path.join(this.workspacePath, 'app', 'api');
    if (!fs.existsSync(apiDir)) {
      return [];
    }

    const routes: DiscoveredRoute[] = [];
    await this.walkDir(apiDir, async (filePath) => {
      // Only care about route.ts or route.js files
      if (filePath.endsWith('route.ts') || filePath.endsWith('route.js')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const methods: string[] = [];
        
        if (content.includes('export async function GET') || content.includes('export function GET')) methods.push('GET');
        if (content.includes('export async function POST') || content.includes('export function POST')) methods.push('POST');
        if (content.includes('export async function PUT') || content.includes('export function PUT')) methods.push('PUT');
        if (content.includes('export async function DELETE') || content.includes('export function DELETE')) methods.push('DELETE');
        if (content.includes('export async function PATCH') || content.includes('export function PATCH')) methods.push('PATCH');

        // Convert file path to API endpoint url
        const relativePath = path.relative(path.join(this.workspacePath, 'app'), filePath);
        // Turn app\api\webhooks\stripe\route.ts -> /api/webhooks/stripe
        let endpoint = '/' + relativePath.replace(/\\/g, '/');
        endpoint = endpoint.replace('/route.ts', '').replace('/route.js', '');

        routes.push({
          endpoint,
          filePath,
          methods
        });
      }
    });

    return routes;
  }

  private async walkDir(dir: string, callback: (filepath: string) => Promise<void>) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.walkDir(fullPath, callback);
      } else {
        await callback(fullPath);
      }
    }
  }
}
