/*
 * @Author: wanxiaodong 
 * @Date: 2023-08-11 15:27:02 
 * @Last Modified by: wanxiaodong
 * @Last Modified time: 2023-08-11 18:30:12
 * @Description: wanxiaodong 
 */

import {
	optionParams,
	registFn,
	subscribeFn,
	fakePromise,
	_type,
} from './lib/interface';


export class Flow {

	__currentType: (_type | null) = null; // 用于缓存链式调用上一级的类型
	
	__host:(object | null) = null; // attach 宿主

	readonly __registPool = new Map(); // 注册池子

	readonly __subscribePool = new Map(); // 订阅池子

	readonly __finallSymbol = Symbol('FINALLY_CALLBACK'); // finall callback symbol

	// constructor
	constructor(option: optionParams = {}) {
		const { host } = option
		if (host) {
			this.__host = host;
		}
	}	
	// 流程事件注册
	register(type: _type, callback: Function) {
		if (!type) {
			throw Error('缺少注册事件类型！！')
		}
		if (!callback) {
			throw Error('缺少注册事件执行函数！！')
		}
		if (typeof callback !== 'function') {
			throw Error('参数必须为函数')
		}
		if (!this.__registPool.has(type)) {
			this.__registPool.set(type, callback);
			this.__currentType = type; // 用于链式调用传递
			return this
		} else {
			console.warn('注册事件已存在')
			this.__currentType = type; // 用于链式调用传递
			return this
		}
	}

	// 流程订阅-等待流程触发
	subscribe(type: (_type|Function), callback?: Function) {
		if (typeof type === 'function') {
			callback = type;
			type = this.__currentType as _type;
		}
		if (!type) {
			throw Error('缺少订阅事件类型！！')
		}
		if (!callback) {
			throw Error('缺少订阅事件执行函数！！')
		}
		if (typeof callback !== 'function') {
			throw Error('参数必须为函数')
		}
		// 订阅类型是一个列表
		if (!this.__subscribePool.has(type)) {
			this.__subscribePool.set(type, [callback]);
		} else {
			this.__subscribePool.get(type).push(callback)
		}
		return this
	}

	// 触发注册事件
	trigger(type: _type, payload?: any) {
		const callback = this.__registPool.get(type) as registFn;
		if (!callback) {
			console.warn('未找到注册事件')
			return this
		}
		let count = 0; // 限制只执行一次
		const done = (state: any) => {
			if (count > 0) return
			count++
			this.__execSubscribe(type, state)
		}
		const result = callback.call(this.__host, {
			payload,
			instance: this,
			done: done
		})
		if (result instanceof Promise) {
			result.then(done)
		}
		this.__currentType = type;
		return this
	}

	// 注册事件 后续订阅堆栈执行
	__execSubscribe(type: _type, state?: any) {
		const host = this.__host;
		const instance: Flow = this;
		const list = this.__subscribePool.get(type) as Array<subscribeFn>;
		const finallyList = this.__subscribePool.get(this.__finallSymbol) as Array<subscribeFn>;
		if (list && list.length > 0) {
			stackExec(0, state)
		} else if (finallyList && finallyList.length > 0) {
			this.__execSubscribe(this.__finallSymbol, state)
		}

		function stackExec(index: number, _state: any) {
			let count = 0; // 限制只执行一次
			const done = (__state: any) => {
				if (count > 0) return
				count++
				stackExec.call(host, ++index, __state)
			}
			if (index <= list.length - 1) {
				// 递归执行
				const callback = list[index];
				const result = callback.call(host, {
					state: _state,
					instance,
					done: done
				})
				// 返回Promise
				if (result instanceof Promise) {
					result.then(done)
				}
			} else if (type !== instance.__finallSymbol) {
				instance.__execSubscribe(instance.__finallSymbol, _state)
			}
		}
	}

	// 绑定host 为 this
	attach(host: object) {
		this.__host = host
		this.__currentType = null;
		return this
	}

	// 判定
	assert(state: (boolean | Promise<any>)): Promise<boolean> | fakePromise {
		const instance = this;
		if (state instanceof Promise) {
			return state.then((res) => {
				return !!res
			})
		} else if (state) {
			return {
				then(callback: Function) {
					callback.call(instance.__host)
				},
				catch() {}
			}
		} else {
			return {
				then() {},
				catch() {}
			}
		}
	}
	// 线路流程走完执行【有待考究】
	// finally(callback: Function) {
	// 	if (typeof callback !== 'function') {
	// 		throw Error('参数必须为函数')
	// 	}
	// 	this.subscribe(this.__finallSymbol, callback);
	// 	this.__currentType = null;
	// 	return this
	// }
}
