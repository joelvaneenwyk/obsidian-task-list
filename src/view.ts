import { ItemView, App as ObsidianApp, WorkspaceLeaf } from 'obsidian';
import type { TodoGroup, TodoItem } from './@types/tasklist';
import { TODO_VIEW_TYPE } from './constants';
import type TodoPlugin from './main';
import type { TodoSettings } from './settings';
import App from './svelte/App.svelte';
import { groupTodos, parseTodos } from './utils';

export default class TodoListView extends ItemView {
  private _app?: App;
  private lastRerender = 0;
  private groupedItems: TodoGroup[] = [];
  private itemsByFile = new Map<string, TodoItem[]>();
  private searchTerm = '';

  constructor(
    leaf: WorkspaceLeaf,
    private plugin: TodoPlugin
  ) {
    super(leaf);
  }

  public get obsidianApp(): ObsidianApp {
    return this.app;
  }

  getViewType(): string {
    return TODO_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'Todo List';
  }

  getIcon(): string {
    return 'checkmark';
  }

  get todoTagArray() {
    return this.plugin
      .getSettingValue('todoPageName')
      .trim()
      .split('\n')
      .map((e) => e.toLowerCase())
      .filter((e) => e);
  }

  get visibleTodoTagArray() {
    return this.todoTagArray.filter((t) => !this.plugin.getSettingValue('_hiddenTags').includes(t));
  }

  async onClose() {
    this._app?.$destroy();
  }

  async onOpen(): Promise<void> {
    try {
      this._app = new App({
        target: this.contentEl,
        props: this.props
      });
    } catch (error) {}
    this.registerEvent(
      this.obsidianApp.metadataCache.on('resolved', async () => {
        if (!this.plugin.getSettingValue('autoRefresh')) return;
        await this.refresh();
      })
    );
    this.registerEvent(this.obsidianApp.vault.on('delete', (file) => this.deleteFile(file.path)));
    this.refresh();
  }

  async refresh(all = false) {
    if (all) {
      this.lastRerender = 0;
      this.itemsByFile.clear();
    }
    await this.calculateAllItems();
    this.groupItems();
    this.renderView();
    this.lastRerender = +new Date();
  }

  rerender() {
    this.renderView();
  }

  private deleteFile(path: string) {
    this.itemsByFile.delete(path);
    this.groupItems();
    this.renderView();
  }

  private get props() {
    return {
      todoTags: this.todoTagArray,
      lookAndFeel: this.plugin.getSettingValue('lookAndFeel'),
      subGroups: this.plugin.getSettingValue('subGroups'),
      _collapsedSections: this.plugin.getSettingValue('_collapsedSections'),
      _hiddenTags: this.plugin.getSettingValue('_hiddenTags'),
      app: this.obsidianApp,
      todoGroups: this.groupedItems,
      updateSetting: (updates: Partial<TodoSettings>) => this.plugin.updateSettings(updates),
      onSearch: (val: string) => {
        this.searchTerm = val;
        this.refresh();
      }
    };
  }

  private async calculateAllItems() {
    const todosForUpdatedFiles = await parseTodos(
      this.obsidianApp.vault.getFiles(),
      this.todoTagArray.length === 0 ? ['*'] : this.visibleTodoTagArray,
      this.obsidianApp.metadataCache,
      this.obsidianApp.vault,
      this.plugin.getSettingValue('includeFiles'),
      this.plugin.getSettingValue('showChecked'),
      this.plugin.getSettingValue('showAllTodos'),
      this.lastRerender
    );
    for (const [file, todos] of todosForUpdatedFiles) {
      this.itemsByFile.set(file.path, todos);
    }
  }

  private groupItems() {
    const flattenedItems = Array.from(this.itemsByFile.values()).flat();
    const searchedItems = flattenedItems.filter((e) =>
      e.originalText.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.groupedItems = groupTodos(
      searchedItems,
      this.plugin.getSettingValue('groupBy'),
      this.plugin.getSettingValue('sortDirectionGroups'),
      this.plugin.getSettingValue('sortDirectionItems'),
      this.plugin.getSettingValue('subGroups'),
      this.plugin.getSettingValue('sortDirectionSubGroups')
    );
  }

  private renderView() {
    this._app?.$set(this.props);
  }
}
