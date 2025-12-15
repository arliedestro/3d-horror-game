export class Inventory {
  private collectedPages: Set<string> = new Set();
  private readonly TOTAL_PAGES = 6;

  addPage(pageId: string) {
    this.collectedPages.add(pageId);
    this.onPageCollected();
  }

  private onPageCollected() {
    console.log(`Page collected! Total: ${this.getCollectedCount()}/${this.TOTAL_PAGES}`);
  }

  getCollectedCount(): number {
    return this.collectedPages.size;
  }

  getTotalPages(): number {
    return this.TOTAL_PAGES;
  }

  getCollectedPages(): string[] {
    return Array.from(this.collectedPages);
  }

  setCollectedPages(pages: string[]) {
    this.collectedPages = new Set(pages);
  }

  hasPage(pageId: string): boolean {
    return this.collectedPages.has(pageId);
  }
}