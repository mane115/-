const Promise = require('bluebird');
const _ = require('lodash');
const config = require('../config');
let utils = {
    /**
     * 获取当前外卖类型
     * @param  {Date}   [date=new           Date()]       [description]
     * @param  {String} [takeOutType='ele'] [description]
     * @return {[type]}                     [description]
     */
    getTimeCategory(date = new Date(), takeOutType = 'ele') {
        let hours = date.getHours();
        hours = +hours;
        let type = 'default';
        if (hours < 3) {
            type = 'snack';
        } else if (hours < 10) {
            type = 'breakfast';
        } else if (hours < 14) {
            type = 'lunch';
        } else if (hours < 17) {
            type = 'afternoonTea';
        } else if (hours < 22) {
            type = 'dinner';
        }
        return config.categoryMap[type][takeOutType];
    },

    /**
     * 判断是否为Promise
     * @param  {*}  sth
     * @return {Boolean}      is Promise
     */
    isPromise(sth) {
        return Object.prototype.toString.call(sth) === '[object Promise]';
    },

    /**
     * 抽象dom操作包含 eval中的dom操作与 puppeteer 中的 JSHandle
     */
    DomSelector: class DomSelector {
        constructor(page) {
            this.page = page;
        }
        async select({selector, nodeTodo, filter}) {
            if (!_.isString(selector) && !_.isFunction(nodeTodo)) {
                return new Error('invalid type');
            }
            let nodes = await this.page.$$(selector);
            let infos = await Promise.map(nodes, async node => {
                let info = await this.page.evaluate((node, [nodeTodo]) => {
                    nodeTodo = new Function('node', `return (${nodeTodo})(node)`);
                    return nodeTodo(node);
                }, node, [nodeTodo.toString()]);
                if (filter && _.isFunction(filter)) {
                    let filterResult = filter(node, info);
                    if (utils.isPromise(filterResult)) {
                        info = await filterResult;
                    } else {
                        info = filterResult;
                    }
                }
                return info;
            });
            return _.compact(infos);
        }
    },

    /**
     * 随机获取数组中的元素
     * @param  {array} array 数组
     * @return {*}       数组元素
     */
    randomPopArrayElement (array) {
        if (!_.isArray(array)) return false;
        let random = _.random(0, array.length);
        random = array[random] ? random : 0;
        return array[random];
    }

};

module.exports = utils;
