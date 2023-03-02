var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);
var import_path = require("path");
var import_utils = require("@umijs/utils");
var fs = require("fs");
var DIR_NAME = "plugin-dynamic-module";
var buildExportModules = function(rootPath, basePrefix) {
  const modules = [];
  function traverse(dir) {
    const prefix = `${basePrefix}${(0, import_utils.winPath)(dir.replace(rootPath, "")).replace(/\//g, "$").replace(/\-/g, "$")}`;
    fs.readdirSync(dir).forEach((file) => {
      const pathname = (0, import_path.join)(dir, file);
      if (fs.statSync(pathname).isDirectory()) {
        traverse(pathname);
      } else {
        if (/\.(js|ts|jsx|tsx)$/.test(file) && !/\.(d|test).(ts|tsx)$/.test(file)) {
          const filename = (0, import_path.parse)(pathname).name.replace(/\-/g, "$");
          if (filename === "index") {
            modules.push({ name: prefix, path: (0, import_path.dirname)(pathname) });
          } else {
            modules.push({
              name: `${prefix}$${filename}`,
              path: (0, import_path.join)((0, import_path.dirname)(pathname), (0, import_path.parse)(pathname).name)
            });
          }
        }
      }
    });
  }
  traverse(rootPath);
  return modules.map((module2) => ({
    ...module2,
    path: (0, import_utils.winPath)(module2.path)
  }));
};
function src_default(api) {
  api.logger.info("use plugin dynamic module");
  api.describe({
    key: "dynamicModule",
    config: {
      schema(joi) {
        return joi.object({
          forceApply: joi.boolean(),
          modules: joi.array().items(joi.string())
        });
      }
    }
  });
  const { dynamicModule = {}, qiankun } = api.userConfig;
  const {
    forceApply,
    modules = ["@sensoro/core", "@sensoro/layout", "@sensoro/library"]
  } = dynamicModule;
  const pluginEnable = api.env !== "development" || forceApply;
  if (pluginEnable && qiankun) {
    if (qiankun.slave) {
      api.modifyConfig((memo) => {
        const extraBabelPlugins = [
          [require("@sensoro/babel-plugin-dynamic-module"), { modules }]
        ].concat(memo.extraBabelPlugins);
        return {
          ...memo,
          extraBabelPlugins
        };
      });
      api.addRuntimePlugin(() => `@@/${DIR_NAME}/dynamic-use-model`);
      api.onGenerateFiles(() => {
        api.writeTmpFile({
          path: `${DIR_NAME}/dynamic-use-model.ts`,
          content: `
          import { useModel } from "umi";
          export const qiankun = {
            async bootstrap(props) {
            },
            async mount(props) {
              window.useModel = useModel;
              window.globalThis.useModel = useModel;
            },
            async unmount(props) {
            },
          };`
        });
      });
    } else if (qiankun.master) {
      api.addRuntimePlugin(() => `@@/${DIR_NAME}/index`);
      const exportModules = modules.reduce((prev, c) => {
        const libPath = (0, import_path.join)(api.paths.absNodeModulesPath, c === "@sensoro/core" ? `${c}/es` : `${c}/lib`);
        if (fs.existsSync(libPath)) {
          return prev.concat(buildExportModules(libPath, `${c}/lib`.replace(/\@/g, "").replace(/\//g, "$").replace(/\-/g, "$")));
        } else {
          return prev;
        }
      }, []);
      const importContent = exportModules.reduce((prev, c) => {
        return prev + `import * as ${c.name} from '${c.path.replace(`${api.paths.absNodeModulesPath}/`, "")}';
`;
      }, "");
      const mountContent = exportModules.reduce((prev, c) => {
        return prev + `window.${c.name} = ${c.name};
`;
      }, "");
      api.onGenerateFiles(() => {
        api.writeTmpFile({
          path: `${DIR_NAME}/index.ts`,
          content: importContent + mountContent
        });
      });
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
