/**
 * 通用对象池
 * 用于复用频繁创建/销毁的对象，避免 GC 卡顿
 * 参考: pixijs-performance skill - 对象回收模式
 */
export class ObjectPool {
    /**
     * @param {Function} createFn - 创建新对象的函数
     * @param {Function} resetFn - 重置对象状态的函数
     * @param {number} maxSize - 池的最大容量
     */
    constructor(createFn, resetFn, maxSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.maxSize = maxSize;
        this.pool = [];      // 空闲对象
        this.active = [];    // 活跃对象
    }

    /**
     * 从池中获取一个对象
     * @returns {Object|null} 可用对象，或 null（池已满）
     */
    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else if (this.active.length < this.maxSize) {
            obj = this.createFn();
        } else {
            return null;
        }
        this.resetFn(obj);
        obj.visible = true;
        this.active.push(obj);
        return obj;
    }

    /**
     * 归还对象到池中（swap-and-pop O(1)）
     * @param {Object} obj - 要归还的对象
     */
    release(obj) {
        obj.visible = false;
        const idx = this.active.indexOf(obj);
        if (idx !== -1) {
            // swap-and-pop: 将最后一个元素移到当前位置，然后 pop
            const last = this.active.length - 1;
            if (idx !== last) {
                this.active[idx] = this.active[last];
            }
            this.active.pop();
            this.pool.push(obj);
        }
    }

    /**
     * 获取当前活跃对象数量
     */
    get activeCount() {
        return this.active.length;
    }

    /**
     * 清空池
     */
    clear() {
        // 隐藏所有活跃对象
        for (const obj of this.active) {
            obj.visible = false;
        }
        this.pool.push(...this.active);
        this.active.length = 0;
    }
}
