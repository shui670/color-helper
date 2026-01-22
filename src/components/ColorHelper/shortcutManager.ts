import type { ShortcutConfig, WheelShortcutConfig, ShortcutRegistration } from './shortcutTypes';

/**
 * 快捷键管理器
 * 负责全局快捷键的注册、注销和触发
 */
export class ShortcutManager {
    private static instance: ShortcutManager;
    private shortcuts: Map<string, ShortcutConfig | WheelShortcutConfig>;
    private isInitialized = false;

    private constructor() {
        this.shortcuts = new Map();
    }

    /**
     * 获取单例实例
     */
    public static getInstance(): ShortcutManager {
        if (!ShortcutManager.instance) {
            ShortcutManager.instance = new ShortcutManager();
        }
        return ShortcutManager.instance;
    }

    /**
     * 初始化快捷键管理器
     * 需要在应用启动时调用
     */
    public initialize(): void {
        if (this.isInitialized) {
            return;
        }

        // 绑定全局事件监听器
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });

        this.isInitialized = true;
        console.log('ShortcutManager initialized');
    }

    /**
     * 销毁快捷键管理器
     * 需要在应用销毁时调用
     */
    public destroy(): void {
        if (!this.isInitialized) {
            return;
        }

        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('wheel', this.handleWheel.bind(this));

        this.shortcuts.clear();
        this.isInitialized = false;
        console.log('ShortcutManager destroyed');
    }

    /**
     * 注册快捷键
     */
    public register(registration: ShortcutRegistration): boolean {
        const { shortcut } = registration;

        // 检查快捷键ID是否已存在
        if (this.shortcuts.has(shortcut.id)) {
            console.warn(`Shortcut with id "${shortcut.id}" already exists`);
            return false;
        }

        this.shortcuts.set(shortcut.id, shortcut);
        console.log(`Shortcut registered: ${shortcut.id}`);
        return true;
    }

    /**
     * 注销快捷键
     */
    public unregister(id: string): boolean {
        if (this.shortcuts.has(id)) {
            this.shortcuts.delete(id);
            console.log(`Shortcut unregistered: ${id}`);
            return true;
        }

        console.warn(`Shortcut not found: ${id}`);
        return false;
    }

    /**
     * 获取所有快捷键
     */
    public getAllShortcuts(): Array<ShortcutConfig | WheelShortcutConfig> {
        return Array.from(this.shortcuts.values());
    }

    /**
     * 启用/禁用快捷键
     */
    public setShortcutEnabled(id: string, enabled: boolean): boolean {
        const shortcut = this.shortcuts.get(id);
        if (shortcut) {
            shortcut.enabled = enabled;
            return true;
        }
        return false;
    }

    /**
     * 检查快捷键是否启用
     */
    public isShortcutEnabled(id: string): boolean {
        const shortcut = this.shortcuts.get(id);
        return shortcut ? (shortcut.enabled !== false) : false;
    }

    /**
     * 处理键盘按下事件
     */
    private handleKeyDown(event: KeyboardEvent): void {
        // 检查所有快捷键
        for (const shortcut of this.shortcuts.values()) {
            if ('key' in shortcut && this.isKeyboardShortcutMatch(shortcut, event)) {
                this.triggerShortcut(shortcut, event);
            }
        }
    }

    /**
     * 处理鼠标滚轮事件
     */
    private handleWheel(event: WheelEvent): void {
        // 检查所有快捷键
        for (const shortcut of this.shortcuts.values()) {
            if ('modifier' in shortcut && !('key' in shortcut) && this.isWheelShortcutMatch(shortcut, event)) {
                this.triggerShortcut(shortcut, event);
            }
        }
    }

    /**
     * 检查键盘快捷键是否匹配
     */
    private isKeyboardShortcutMatch(shortcut: ShortcutConfig, event: KeyboardEvent): boolean {
        if (shortcut.enabled === false) {
            return false;
        }

        // 检查按键
        if (shortcut.key !== event.code) {
            return false;
        }

        // 检查修饰键
        if (shortcut.modifier) {
            const modifiers = shortcut.modifier.split('+');
            for (const mod of modifiers) {
                switch (mod) {
                    case 'ctrl':
                        if (!event.ctrlKey) return false;
                        break;
                    case 'shift':
                        if (!event.shiftKey) return false;
                        break;
                    case 'alt':
                        if (!event.altKey) return false;
                        break;
                    case 'meta':
                        if (!event.metaKey) return false;
                        break;
                }
            }

            // 确保没有额外的修饰键被按下
            const allowedModifiers = new Set(modifiers);
            if (!allowedModifiers.has('ctrl') && event.ctrlKey) return false;
            if (!allowedModifiers.has('shift') && event.shiftKey) return false;
            if (!allowedModifiers.has('alt') && event.altKey) return false;
            if (!allowedModifiers.has('meta') && event.metaKey) return false;
        } else {
            // 如果没有指定修饰键，确保没有修饰键被按下
            if (event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
                return false;
            }
        }

        return true;
    }

    /**
     * 检查鼠标滚轮快捷键是否匹配
     */
    private isWheelShortcutMatch(shortcut: WheelShortcutConfig, event: WheelEvent): boolean {
        if (shortcut.enabled === false) {
            return false;
        }

        // 检查修饰键
        switch (shortcut.modifier) {
            case 'ctrl':
                if (!event.ctrlKey) return false;
                break;
            case 'meta':
                if (!event.metaKey) return false;
                break;
        }

        // 确保没有额外的修饰键被按下
        if (shortcut.modifier !== 'ctrl' && event.ctrlKey) return false;
        if (shortcut.modifier !== 'meta' && event.metaKey) return false;
        if (event.shiftKey || event.altKey) return false;

        return true;
    }

    /**
     * 触发快捷键
     */
    private triggerShortcut(shortcut: ShortcutConfig | WheelShortcutConfig, event: KeyboardEvent | WheelEvent): void {
        try {
            if (shortcut.preventDefault !== false) {
                event.preventDefault();
            }
            if (shortcut.stopPropagation !== false) {
                event.stopPropagation();
            }

            // 根据快捷键类型调用相应的处理函数
            if ('key' in shortcut) {
                // 键盘快捷键
                (shortcut as ShortcutConfig).handler(event as KeyboardEvent);
            } else {
                // 鼠标滚轮快捷键
                (shortcut as WheelShortcutConfig).handler(event as WheelEvent);
            }
        } catch (error) {
            console.error(`Error executing shortcut handler for ${shortcut.id}:`, error);
        }
    }
}

// 导出单例实例
export const shortcutManager = ShortcutManager.getInstance();
