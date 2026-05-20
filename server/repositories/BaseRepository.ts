import fs from 'fs/promises';
import path from 'path';

export class BaseRepository<T extends { id: string }> {
  private filePath: string;

  constructor(filename: string) {
    this.filePath = path.join(process.cwd(), 'server', 'data', filename);
  }

  private async ensureDataContainer(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify([]));
    }
  }

  async getAll(): Promise<T[]> {
    await this.ensureDataContainer();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data);
  }

  async getById(id: string): Promise<T | undefined> {
    const items = await this.getAll();
    return items.find((item) => item.id === id);
  }

  async create(item: T): Promise<T> {
    const items = await this.getAll();
    items.push(item);
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2));
    return item;
  }

  async update(id: string, updatedFields: Partial<T>): Promise<T | null> {
    const items = await this.getAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    
    // Merge existing item with updated fields
    items[index] = { ...items[index], ...updatedFields };
    await fs.writeFile(this.filePath, JSON.stringify(items, null, 2));
    return items[index];
  }

  async delete(id: string): Promise<boolean> {
    const items = await this.getAll();
    const filteredItems = items.filter((item) => item.id !== id);
    if (items.length === filteredItems.length) return false;
    
    await fs.writeFile(this.filePath, JSON.stringify(filteredItems, null, 2));
    return true;
  }
}
