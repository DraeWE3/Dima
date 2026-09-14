import * as fs from 'fs';
import * as path from 'path';

export interface SearchResult {
  filePath: string;
  matchedContent: string;
  lineNumber: number;
}

export class Scanner {
  /**
   * Recursively searches a directory for files containing a specific query.
   * Excludes common heavy directories like node_modules and .git.
   */
  async searchCodebase(workspacePath: string, query: string, filePattern?: string): Promise<SearchResult[]> {
    console.error(`[DIMA SCANNER] Initiating codebase search for query: "${query}" in ${workspacePath}`);
    const results: SearchResult[] = [];
    const excludedDirs = ['node_modules', '.git', 'dist', 'out', '.dima_data'];

    const walk = (dir: string) => {
      let files: fs.Dirent[] = [];
      try {
        files = fs.readdirSync(dir, { withFileTypes: true });
      } catch (err) {
        return;
      }

      for (const file of files) {
        if (file.isDirectory()) {
          if (!excludedDirs.includes(file.name)) {
            walk(path.join(dir, file.name));
          }
        } else {
          // If filePattern is provided, filter by it (e.g., .json, .ts)
          if (filePattern && !file.name.includes(filePattern.replace('*', ''))) {
            continue;
          }

          const filePath = path.join(dir, file.name);
          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (content.includes(query)) {
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(query)) {
                  results.push({
                    filePath,
                    matchedContent: lines[i].trim(),
                    lineNumber: i + 1
                  });
                }
              }
            }
          } catch (err) {
            // Ignore unreadable files (binary, etc.)
          }
        }
      }
    };

    walk(workspacePath);
    console.error(`[DIMA SCANNER] Search complete. Found ${results.length} matches.`);
    return results;
  }

  /**
   * Saves the search results to the .dima_data folder in the target workspace.
   */
  async saveResults(workspacePath: string, outputFilename: string, data: any): Promise<string> {
    const dataDir = path.join(workspacePath, '.dima_data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, outputFilename);
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.error(`[DIMA SCANNER] Saved results to ${outputPath}`);
    
    return outputPath;
  }
}
