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
        months: '一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月'.split(
            '_'
        ),
        monthsShort: '1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月'.split(
            '_'
        ),
        weekdays: '星期日_星期一_星期二_星期三_星期四_星期五_星期六'.split('_'),
        weekdaysShort: '周日_周一_周二_周三_周四_周五_周六'.split('_'),
        weekdaysMin: '日_一_二_三_四_五_六'.split('_'),
        longDateFormat: {
            LT: 'HH:mm',
            LTS: 'HH:mm:ss',
            L: 'YYYY/MM/DD',
            LL: 'YYYY年M月D日',
            LLL: 'YYYY年M月D日Ah点mm分',
            LLLL: 'YYYY年M月D日ddddAh点mm分',
            l: 'YYYY/M/D',
            ll: 'YYYY年M月D日',
            lll: 'YYYY年M月D日 HH:mm',
            llll: 'YYYY年M月D日dddd HH:mm',
        },
        meridiemParse: /凌晨|早上|上午|中午|下午|晚上/,
        meridiemHour: function (hour, meridiem) {
            if (hour === 12) {
                hour = 0;
            }
            if (meridiem === '凌晨' || meridiem === '早上' || meridiem === '上午') {
                return hour;
            } else if (meridiem === '下午' || meridiem === '晚上') {
                return hour + 12;
            } else {
                // '中午'
                return hour >= 11 ? hour : hour + 12;
            }
        },
        meridiem: function (hour, minute, isLower) {
            var hm = hour * 100 + minute;
            if (hm < 600) {
                return '凌晨';
            } else if (hm < 900) {
                return '早上';
            } else if (hm < 1130) {
                return '上午';
            } else if (hm < 1230) {
                return '中午';
            } else if (hm < 1800) {
                return '下午';
            } else {
                return '晚上';
            }
        },
        calendar: {
            sameDay: '[今天]LT',
            nextDay: '[明天]LT',
            nextWeek: function (now) {
                if (now.week() !== this.week()) {
                    return '[下]dddLT';
                } else {
                    return '[本]dddLT';
                }
            },
            lastDay: '[昨天]LT',
            lastWeek: function (now) {
                if (this.week() !== now.week()) {
                    return '[上]dddLT';
                } else {
                    return '[本]dddLT';
                }
            },
            sameElse: 'L',
        },
        dayOfMonthOrdinalParse: /\d{1,2}(日|月|周)/,
        ordinal: function (number, period) {
            switch (period) {
                case 'd':
                case 'D':
                case 'DDD':
                    return number + '日';
                case 'M':
                    return number + '月';
                case 'w':
                case 'W':
                    return number + '周';
                default:
                    return number;
            }
        },
        relativeTime: {
            future: '%s后',
            past: '%s前',
            s: '几秒',
            ss: '%d 秒',
            m: '1 分钟',
            mm: '%d 分钟',
            h: '1 小时',
            hh: '%d 小时',
            d: '1 天',
            dd: '%d 天',
            w: '1 周',
            ww: '%d 周',
            M: '1 个月',
            MM: '%d 个月',
            y: '1 年',
            yy: '%d 年',
        },
        week: {
            // GB/T 7408-1994《数据元和交换格式·信息交换·日期和时间表示法》与ISO 8601:1988等效
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
