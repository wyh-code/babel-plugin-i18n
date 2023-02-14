const fs = require('fs');
const md5 = require('md5');
const generate = require("@babel/generator").default;


const log = {
	red: (...args) => console.log('\x1B[31m%s\x1B[0m', ...args),
	green: (...args) => console.log('\x1B[32m%s\x1B[0m', ...args),
}

function getReplaceExpression(path, options, types, template, textMap, filename) {
  const { appName, i18nFunctionName } = options;
	const { node } = path;
	const { code } = generate(path.node);
	const { code: parentCode } = generate(path.parent);

	let codeString = code.trim()

	// 如果没有内容，返回原节点
	if (!codeString) return path.node;

	// 处理 JSXText
	if (types.isJSXText(path.node)) {
		const key = md5(codeString);
		const str = i18nFunctionName + `('${key}', '${codeString}', {}, '${appName}')`;

		textMap[key] = {
			filename,
			parentCode,
			sourceCode: code,
			loc: node.loc.start,
			text: codeString,
			i18n: str
		}

		const newNode = types.jsxExpressionContainer(template.ast(str).expression);
		newNode.__$i18n_key = key

		return newNode;
	}

	// 处理字符串、模版字符串
	if (/.*[\u4e00-\u9fa5]+.*$/.test(codeString)) {
		const data = []

		// 组装变量对象
		if (path.node.expressions) {
			path.node.expressions.forEach(expression => {
				const { code } = generate(expression);
				const key = code.replace(/\./g, '_');

				data.push(`${key}: ${code}`);
				codeString = codeString.replace(code, key)
			})
		}
		const key = md5(codeString);

		const str = i18nFunctionName + `('${key}', ${codeString}, {${data.join(',')}}, '${appName}')`;
		let newNode = template.ast(str).expression;

		textMap[key] = textMap[key] = {
			filename,
			parentCode,
			sourceCode: code,
			loc: node.loc.start,
			text: `${codeString.replace(/'|"|`/g, '')}`,
			i18n: str
		};

		// 组件属性需要包裹花括号
		if (path.parentPath.isJSXAttribute()) {
			newNode = types.jsxExpressionContainer(newNode)
		}

		newNode.__$i18n_key = key

		return newNode;
	}

	return path.node;
}

function save(textMap, cwd) {
	const obj = {};

	Object.keys(textMap).forEach(file => {
		Object.keys(textMap[file]).forEach(key => {
			obj[key] = textMap[file][key].text;
		})
	})


	fs.writeFileSync(`${cwd}/i18n-map.json`, JSON.stringify(textMap));
	fs.writeFileSync(`${cwd}/i18n.json`, JSON.stringify(obj));
}

module.exports = {
	getReplaceExpression,
	save,
  log
}
