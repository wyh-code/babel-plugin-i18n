
通过 AST 遍历，完成文本国际化替换。

默认跳过了 `import`，`console`，注释包含 `i18n-disable` 的代码块。
```js
  // 忽略 import
  import XX from 'XX'

  // 忽略 console
  console.log('1112') 

  // 忽略注释包含 `i18n-disable` 的代码块
  const name = '章三' // 会被替换
  const name = /*i18n-disable*/ '章三' // 不会被替换

```

插件参数：
  - appName: 项目标识
  - i18nFunctionName: i18n 函数名称（用于文案替换时，默认为 $$i18n）
  - getLocaleAndMap: 获取文案替换后的语言文件及替换前后的map映射
  - exclude: 排除不需要替换的文件

代码示例 
```js
  {
    plugins: [
      ['babel-plugin-react-i18n', {
        exclude: (filePath) => console.log(filePath),
        appName: 'appName',
        i18nFunctionName: '$$i18n',
        getLocaleAndMap: (textMap, file) => console.log(textMap, file) // file 参数为 babel 中 file 对象
      }],
    ]
  }
```
