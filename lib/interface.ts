/*
 * @Author: wanxiaodong 
 * @Date: 2023-08-11 16:19:24 
 * @Last Modified by: wanxiaodong
 * @Last Modified time: 2023-08-11 18:40:42
 * @Description: wanxiaodong 
 */


type PipeFlowInterface = {
	__currentType: (_type | null); // 用于缓存链式调用上一级的类型
	
	__host:(object | null); // attach 宿主

	readonly __registPool: Map<_type, registFn>; // 注册池子

	readonly __subscribePool: Map<_type, subscribeFn>; // 订阅池子

	readonly __finallSymbol: Symbol; // finall callback symbol

	__execSubscribe: Function,
	register: Function,
	subscribe: Function,
	assert: Function,
	attach: Function,

}

export interface optionParams {
	host?: object
}

export interface registerParams {
	type: string | symbol | number,
	callback: Function
}

export interface registerOption {
	instance: PipeFlowInterface,
	payload?: any,
	done: Function
}

export interface registFn {
	(arg0: registerOption): Promise<any> | undefined
}
export interface subscribeOption {
	state?: any,
	instance: PipeFlowInterface,
	payload?: any,
	done: Function
}

export interface subscribeFn {
	(arg0: subscribeOption): Promise<any> | undefined
}

export interface fakePromise {
	then: Function,
	catch: Function
}

export type _type = string | number | symbol

