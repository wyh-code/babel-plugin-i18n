
通过 AST 遍历，完成文本国际化替换。

插件参数：
  - appName: 项目标识
  - i18nFunctionName: i18n 函数名称（用于文案替换时）
  - getLocaleAndMap: 获取文案替换后的语言文件及替换前后的map映射

代码示例 
```js
  {
    plugins: [
      ['babel-plugin-react-i18n', {
        appName: 'appName',
        i18nFunctionName: '$$i18n',
        getLocaleAndMap: (textMap, file) => console.log(textMap, file) // file 参数为 babel 中 file 对象
      }],
    ]
  }
```
