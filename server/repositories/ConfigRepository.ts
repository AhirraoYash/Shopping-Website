import fs from 'fs/promises';
import path from 'path';

export class ConfigRepository {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'server', 'data', 'config.json');
  }

  private async ensureConfig(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(
        this.filePath,
        JSON.stringify({ ownerWhatsAppNumber: '911234567890' }, null, 2)
      );
    }
  }

  async getConfig(): Promise<{ ownerWhatsAppNumber: string }> {
    await this.ensureConfig();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data);
  }

  async updateConfig(config: { ownerWhatsAppNumber: string }): Promise<void> {
    await this.ensureConfig();
    await fs.writeFile(this.filePath, JSON.stringify(config, null, 2));
  }
}
