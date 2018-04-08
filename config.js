// 替换npm环境变量
let envs = Object.keys(process.env);
envs.forEach(env => {
    if (!~env.indexOf('npm_package_config_')) return false;
    let _env = env.replace('npm_package_config_', '');
    if (process.env[_env] || process.env[_env] === 0 || process.env[_env] === false) return false;
    process.env[_env] = process.env[env];
});

let config = {
    ele: {
        host: 'http://www.ele.me',
        url: {
            index: '/'
        },
        data: {
            login: {
                mobile: process.env.ELE_MOBILE,
                password: process.env.ELE_PASSWORD
            }
        }
    },
    meituan: {
        host: 'http://waimai.meituan.com',
        url: {
            index: '/'
        },
        data: {
            login: {
                mobile: process.env.MEITUAN_MOBILE,
                password: process.env.MEITUAN_PASSWORD
            }
        }
    },
    location: {
        work: process.env.WORK_ADDR,
        home: process.env.HOME_ADDR,
    },
    price: {
        min: process.env.PRICE_MIN || 10,
        max: process.env.PRICE_MAX || 25,
        maxFreight: process.env.FREIGHT_MAX || 6
    },
    categoryMap: {
        breakfast: {
            ele: '早餐',
            meituan: '全部分类'
        },
        lunch: {
            ele: '午餐',
            meituan: '全部分类'
        },
        dinner: {
            ele: '晚餐',
            meituan: '全部分类'
        },
        afternoonTea: {
            ele: '下午茶',
            meituan: '下午茶'
        },
        snack: {
            ele: '夜宵',
            meituan: '全部分类'
        },
        default: {
            ele: '全部商家',
            meituan: '全部分类'
        }
    }
};

// 替换host
let arrangeUrl = function (config) {
    let keys = Object.keys(config.url);
    keys.forEach(key => {
        config.url[key] = config.host + config.url[key];
    });
    return config;
};
arrangeUrl(config.ele);
arrangeUrl(config.meituan);
module.exports = config;
