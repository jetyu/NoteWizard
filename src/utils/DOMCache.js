/**
 * DOM 元素缓存工具
 * 避免重复查询 DOM，提升性能
 */
export class DOMCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * 获取元素（带缓存）
   * @param {string} selector - CSS 选择器
   * @param {boolean} forceRefresh - 是否强制刷新缓存
   * @returns {Element|null}
   */
  get(selector, forceRefresh = false) {
    if (!forceRefresh && this.cache.has(selector)) {
      const element = this.cache.get(selector);
      // 验证元素是否仍在 DOM 中
      if (element && document.contains(element)) {
        return element;
      }
    }
    
    const element = document.querySelector(selector);
    if (element) {
      this.cache.set(selector, element);
    }
    return element;
  }

  /**
   * 获取所有匹配的元素（带缓存）
   * @param {string} selector - CSS 选择器
   * @param {boolean} forceRefresh - 是否强制刷新缓存
   * @returns {NodeList}
   */
  getAll(selector, forceRefresh = false) {
    const cacheKey = `all:${selector}`;
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const elements = this.cache.get(cacheKey);
      // 验证第一个元素是否仍在 DOM 中
      if (elements.length > 0 && document.contains(elements[0])) {
        return elements;
      }
    }
    
    const elements = document.querySelectorAll(selector);
    this.cache.set(cacheKey, elements);
    return elements;
  }

  /**
   * 清除指定选择器的缓存
   * @param {string} selector - CSS 选择器
   */
  clear(selector) {
    this.cache.delete(selector);
    this.cache.delete(`all:${selector}`);
  }

  /**
   * 清除所有缓存
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * 预加载元素到缓存
   * @param {Object} selectors - 选择器对象 { key: selector }
   */
  preload(selectors) {
    Object.entries(selectors).forEach(([key, selector]) => {
      this.get(selector);
    });
  }
}

// 导出单例实例
export const domCache = new DOMCache();
