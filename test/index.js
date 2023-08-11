const {PipeFlow} = require('../index.js')


const instance = new PipeFlow();

const host = {
	name: 'name',
	login: false,
	confirm: false,
	count: 100
}

instance.attach(host);

instance.register('number', function({payload, instance, done}) {
	return new Promise((resolve, reject) => {
		console.log('启动number流程', this.count)
		resolve(this.count)
	})
}).subscribe(function ({state, done}) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			console.log('subscribe ', ++this.count)
			resolve(this.count)
		}, 1000)
	})
}).subscribe(function ({state, done}) {
	console.log('subscribe 1', ++this.count)
	done(this.count)
}).subscribe(function ({state, done}) {
	console.log('subscribe 2', ++this.count)
	done(this.count)
}).subscribe(function ({state, done}) {
	console.log('subscribe 3', ++this.count)
	done(this.count)
}).subscribe(function({state, instance, done}) {
	instance.assert(state === 100).then(function() {
		// 支路1
		instance.trigger('branch_1');
	})
	instance.assert(state === 104).then(function() {
		// 支路2
		instance.trigger('branch_2');
	})
}).register('branch_1', function({instance, done}) {
	console.log('exec_branch_1', this)
}).register('branch_2', function({instance, done}) {
	console.log('exec_branch_2', this)
	instance.trigger('number')
}).trigger('number'); 