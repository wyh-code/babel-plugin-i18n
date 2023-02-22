const generate = require("@babel/generator").default;
const { getReplaceExpression, save, log } = require('./utils');

module.exports = (apis, config) => {
  const { types, template } = apis;
  const textMap = {};

  const defaultOption = {
    exclude: (fileName) => log.green(fileName),
    appName: 'appName',
    i18nFunctionName: '$$i18n'
  }

  const options = {
    ...defaultOption,
    ...config
  }

  return {
    pre(file){
      log.green(file.opts.cwd, '====opts===')
    },
    visitor: {
      Program: {
        enter(path, state) {
          const { filename, cwd } = state;
         
          const relativeFileName = filename.replace(cwd, '').replace(/\\/g, '/');
          // console.log(relativeFileName, /^\/src/.test(relativeFileName));

          if (/^\/src/.test(relativeFileName) && !options.exclude(relativeFileName)) {
            // 标记排除项
            path.traverse({
              'StringLiteral|TemplateLiteral'(path) {
                // 排除 import
                if (path.findParent(p => p.isImportDeclaration())) {
                  path.node.skipTransform = true;
                }

                // 排除 console
                if (types.isMemberExpression(path.parent.callee) && path.parent.callee.object.name === 'console') {
                  path.node.skipTransform = true;
                  // console.log(path.node.skipTransform, '==== skipTransform =====', relativeFileName)
                }

                // 排除不需要国际化的字符串
                if (path.node.leadingComments) {
                  path.node.leadingComments = path.node.leadingComments.filter((comment, index) => {
                    if (comment.value.includes('i18n-disable')) {
                      path.node.skipTransform = true;
                      return false;
                    }
                    return true;
                  })
                }
              },
            })
            // console.log(options)

            // 按文件目录创建
            textMap[relativeFileName] = {}

            // 国际化替换
            path.traverse({
              'JSXText|StringLiteral|TemplateLiteral'(path) {
                const { node } = path;
                if (node.skipTransform) return;
                // 替换文案
                const replaceExpression = getReplaceExpression(
                  path,
                  options, 
                  types, 
                  template, 
                  textMap[relativeFileName], 
                  relativeFileName,
                );
                path.replaceWith(replaceExpression);
                const i18nKey = path.node.__$i18n_key;
                if(i18nKey && textMap[relativeFileName] && textMap[relativeFileName][i18nKey]){
                  const { code: afterCode } = generate(path.parent);
                  // console.log(i18nKey, '==i18nKey==', afterCode)
                  textMap[relativeFileName][i18nKey].afterCode = afterCode;
                }

                path.skip();
              },
            })
          }
        }
      }
    },
    post(file) {
      log.green("options.getLocaleAndMap", options.getLocaleAndMap);
      log.green("typeof options.getLocaleAndMap", typeof options.getLocaleAndMap === 'function');
      log.green("textMap", textMap);

      if(options.getLocaleAndMap && typeof options.getLocaleAndMap === 'function'){
        options.getLocaleAndMap(textMap, file)
      }else{
        save(textMap, file.opts.cwd)
      }
    },
  }
}
