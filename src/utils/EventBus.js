/**
 * 简单的事件总线实现
 * 用于模块间解耦通信
 */
export class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(eventName, callback) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    
    this.events.get(eventName).push(callback);
    
    // 返回取消订阅函数
    return () => this.off(eventName, callback);
  }

  /**
   * 订阅一次性事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  once(eventName, callback) {
    const wrappedCallback = (...args) => {
      callback(...args);
      this.off(eventName, wrappedCallback);
    };
    
    return this.on(eventName, wrappedCallback);
  }

  /**
   * 取消订阅事件
   * @param {string} eventName - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) return;
    
    const callbacks = this.events.get(eventName);
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
    
    // 如果没有监听器了，删除该事件
    if (callbacks.length === 0) {
      this.events.delete(eventName);
    }
  }

  /**
   * 触发事件
   * @param {string} eventName - 事件名称
   * @param {*} data - 事件数据
   */
  emit(eventName, data) {
    if (!this.events.has(eventName)) return;
    
    const callbacks = this.events.get(eventName);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in event handler for "${eventName}":`, error);
      }
    });
  }

  /**
   * 清除所有事件监听器
   */
  clear() {
    this.events.clear();
  }

  /**
   * 清除指定事件的所有监听器
   * @param {string} eventName - 事件名称
   */
  clearEvent(eventName) {
    this.events.delete(eventName);
  }
}

// 导出单例实例
export const eventBus = new EventBus();
