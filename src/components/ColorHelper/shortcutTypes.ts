/**
 * 快捷键类型定义
 */

/**
 * 快捷键修饰键
 */
export type ShortcutModifier = 'ctrl' | 'shift' | 'alt' | 'meta' | 'ctrl+shift' | 'ctrl+alt' | 'shift+alt' | 'ctrl+shift+alt';

/**
 * 快捷键配置
 */
export interface ShortcutConfig {
    /** 快捷键ID，用于唯一标识 */
    id: string;
    /** 快捷键描述 */
    description: string;
    /** 按键代码（KeyboardEvent.code） */
    key: string;
    /** 修饰键 */
    modifier?: ShortcutModifier;
    /** 是否启用 */
    enabled?: boolean;
    /** 是否阻止默认行为 */
    preventDefault?: boolean;
    /** 是否阻止事件冒泡 */
    stopPropagation?: boolean;
    /** 处理函数 */
    handler: (event: KeyboardEvent | WheelEvent) => void;
}

/**
 * 鼠标滚轮事件配置
 */
export interface WheelShortcutConfig {
    /** 快捷键ID，用于唯一标识 */
    id: string;
    /** 快捷键描述 */
    description: string;
    /** 修饰键 */
    modifier: 'ctrl' | 'meta';
    /** 是否启用 */
    enabled?: boolean;
    /** 是否阻止默认行为 */
    preventDefault?: boolean;
    /** 是否阻止事件冒泡 */
    stopPropagation?: boolean;
    /** 处理函数 */
    handler: (event: WheelEvent) => void;
}

/**
 * 快捷键注册选项
 */
export interface ShortcutRegistration {
    /** 快捷键配置 */
    shortcut: ShortcutConfig | WheelShortcutConfig;
    /** 作用域（可选，用于按作用域管理快捷键） */
    scope?: string;
}

/**
 * 快捷键管理器事件
 */
export type ShortcutManagerEvents = {
    'shortcut:registered': { id: string; scope?: string };
    'shortcut:unregistered': { id: string; scope?: string };
    'shortcut:triggered': { id: string; event: KeyboardEvent | WheelEvent };
    'shortcut:error': { id: string; error: Error };
};
