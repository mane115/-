/**
 * 使用内部eslint规则
 * 具体规则请查看：https://www.npmjs.com/package/eslint-config-dp
 */

module.exports = {
	extends: 'dp',
	rules: {
		// 链式调用强制换行，如果链式调用深度只有4级则可不换行
		'newline-per-chained-call': [0, {
			'ignoreChainWithDepth': 4
		}],
	}
};