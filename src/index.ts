import { join } from 'path';
import fs from 'fs';
import fse from 'fs-extra';

import { defaultPackageExternalMap } from './config';

import type { IApi, IConfig } from '@umijs/types';
import type { PackageExternalInfo } from './types';

export default function(api: IApi) {
  api.logger.info('use plugin umi-plugin-qiankun-development');
  api.describe({
    key: 'qiankunDev',
    config: {
      schema(joi) {
        return joi.object({
          devExternal: joi.boolean(),
          autoDep: joi.boolean(),
          disableOptimization: joi.boolean(),
          disableBuild: joi.boolean(),
          scripts: joi.array(),
          packages: joi.array(),
          extraScripts: joi.array(),
        });
      },
    },
  });

  const { qiankunDev = {}, qiankun = {} } = api.userConfig;

  const {
    devExternal = true,
    autoDep = true,
    disableOptimization = false,
    disableBuild = false,
    scripts,
    packages = Object.keys(defaultPackageExternalMap),
    extraScripts = [],
  } = qiankunDev;

  if (!disableOptimization) {
    api.modifyConfig((initConfig: IConfig) => {
      if (api.env === 'development') {
        initConfig.devtool = false;
        initConfig.nodeModulesTransform = {
          type: 'none',
          exclude: [],
        };
      }
      return initConfig;
    });
  }

  if (!disableBuild) {
    const exclude = ['.umi', '.umi-production', '.umi-test', 'test'];
    function buildModule() {
      const libPath = join(api.cwd, 'lib');
      const srcPath = join(api.cwd, 'src');
      console.log('building module...');
      const time = Date.now();
      try {
        fse.removeSync(libPath);
        fse.ensureDirSync(libPath);
        const files = fs.readdirSync(srcPath);
        files.forEach(function(file: string) {
          if (exclude.indexOf(file) === -1) {
            fse.copySync(join(srcPath, file), join(libPath, file));
          }
        });
        console.log(`build module successfully in ${Date.now() - time}ms`);
      } catch (err) {
        console.error(err);
      }
    }
    api.onDevCompileDone(({ isFirstCompile, type }) => {
      if (!isFirstCompile) {
        buildModule();
      }
    });
  }

  const externalPackages: Record<string, PackageExternalInfo> = packages.reduce((prev: any, cur: string) => {
    const info = defaultPackageExternalMap[cur];

    return {
      ...prev,
      [cur]: info,
    }
  }, {})

  if (autoDep) {
    api.addDepInfo(() => {
      console.log('addDepInfo------->>>');
      const { dependencies, devDependencies } = api.pkg;
      return [
        {
          name: 'react',
          range:
            dependencies?.['react'] ||
            devDependencies?.['react'] ||
            require('../package')?.dependencies?.['react'],
        },
        {
          name: 'react-dom',
          range:
            dependencies?.['react-dom'] ||
            devDependencies?.['react-dom'] ||
            require('../package')?.dependencies?.['react-dom'],
        },
        {
          name: 'antd',
          range:
            dependencies?.['antd'] ||
            devDependencies?.['antd'] ||
            require('../package')?.dependencies?.['antd'],
        },
        {
          name: 'moment',
          range:
            dependencies?.['moment'] ||
            devDependencies?.['moment'] ||
            require('../package')?.dependencies?.['moment'],
        },
        {
          name: 'lodash',
          range:
            dependencies?.['lodash'] ||
            devDependencies?.['lodash'] ||
            require('../package')?.dependencies?.['lodash'],
        },
      ];
    });
  }

  if (qiankun.master && (devExternal || api.env === 'production')) {
    api.addEntryCodeAhead(() => {
      return `
      import moment from 'moment';
      moment.defineLocale('zh-cn', {
        months: '??????_??????_??????_??????_??????_??????_??????_??????_??????_??????_?????????_?????????'.split(
            '_'
        ),
        monthsShort: '1???_2???_3???_4???_5???_6???_7???_8???_9???_10???_11???_12???'.split(
            '_'
        ),
        weekdays: '?????????_?????????_?????????_?????????_?????????_?????????_?????????'.split('_'),
        weekdaysShort: '??????_??????_??????_??????_??????_??????_??????'.split('_'),
        weekdaysMin: '???_???_???_???_???_???_???'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY???M???D???',
            LLL: 'YYYY???M???D???Ah???mm???',
            LLLL: 'YYYY???M???D???ddddAh???mm???',
            l: 'YYYY/M/D',
            ll: 'YYYY???M???D???',
            lll: 'YYYY???M???D??? HH:mm',
            llll: 'YYYY???M???D???dddd HH:mm',
        },
        meridiemParse: /??????|??????|??????|??????|??????|??????/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '??????' || meridiem === '??????' || meridiem === '??????') {
                return hour;
            } else if (meridiem === '??????' || meridiem === '??????') {
                return hour + 12;
            } else {
                // '??????'
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '??????';
            } else if (hm < 900) {
                return '??????';
            } else if (hm < 1130) {
                return '??????';
            } else if (hm < 1230) {
                return '??????';
            } else if (hm < 1800) {
                return '??????';
            } else {
                return '??????';
            }
        },
        calendar: {
            sameDay: '[??????]LT',
            nextDay: '[??????]LT',
            nextWeek: function (now) {
                if (now.week() !== this.week()) {
                    return '[???]dddLT';
                } else {
                    return '[???]dddLT';
                }
            },
            lastDay: '[??????]LT',
            lastWeek: function (now) {
                if (this.week() !== now.week()) {
                    return '[???]dddLT';
                } else {
                    return '[???]dddLT';
                }
            },
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(???|???|???)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '???';
                case 'M':
                    return number + '???';
                case 'w':
                case 'W':
                    return number + '???';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s???',
            past: '%s???',
            s: '??????',
            ss: '%d ???',
            m: '1 ??????',
            mm: '%d ??????',
            h: '1 ??????',
            hh: '%d ??????',
            d: '1 ???',
            dd: '%d ???',
            w: '1 ???',
            ww: '%d ???',
            M: '1 ??????',
            MM: '%d ??????',
            y: '1 ???',
            yy: '%d ???',
        },
        week: {
            // GB/T 7408-1994?????????????????????????????????????????????????????????????????????????ISO 8601:1988??????
            dow: 1, // Monday is the first day of the week.
            doy: 4, // The week that contains Jan 4th is the first week of the year.
        },
    })
    moment.locale('zh-cn');
      `;
    });
  }

  api.modifyConfig((initConfig: IConfig) => {
    const defaultExternals = Object.keys(externalPackages).reduce<Record<string, string>>(
      (prev, cur) => ({ ...prev, [cur]: externalPackages[cur].root }),
      {}
    );
    if (api.env === 'development') {
      if (devExternal) {
        initConfig.externals = {
          ...initConfig.externals,
          ...defaultExternals,
        }
        if (qiankun.master) {
          initConfig.scripts = [
            ...(
              Object.keys(externalPackages).reduce<string[]>(
                (prev, cur) => [ ...prev, externalPackages[cur].script ],
                []
              )
            ),
            ...extraScripts,
          ]
        }
      }
    }
    if (api.env === 'production') {
      initConfig.externals = {
        ...initConfig.externals,
        ...defaultExternals,
      }
      if (qiankun.master) {
        initConfig.scripts = [
          ...(
            Object.keys(externalPackages).reduce<string[]>(
              (prev, cur) => [ ...prev, externalPackages[cur].script ],
              []
            )
          ),
          ...extraScripts,
        ]
      }
    }
    return initConfig;
  });
}
