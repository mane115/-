const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const ipad = devices['iPad Pro'];
const _ = require('lodash');
const Promise = require('bluebird');
const readline = require('readline');
const config = require('../config');
const { DomSelector, randomPopArrayElement, getTimeCategory } = require('./utils');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
module.exports = async function() {
    // init
    const browser = await puppeteer.launch({
        headless: false,
    });
    let page = await browser.newPage();
    let domSelector = new DomSelector(page);
    await page.emulate(ipad);

    // 打开首页，输入地址
    await page.goto(config.ele.url.index);
    await page.waitFor(2000);
    await page.type('input[ng-model="search.keyword"]', config.location.home, {delay: 100});
    await page.waitFor(1000);
    await page.keyboard.press('Enter');
    await page.waitFor(2000);
    await page.click('li[ng-click="search.chooseAction(suggest)"]');
    await page.waitFor(2000);

    // 选取所有类目
    let nowTimeCategory = getTimeCategory();
    let categories = await domSelector.select({
        selector: 'a[ng-bind="category.name"]',
        nodeTodo: node => node.innerText,
        filter: async(node, info) => {
            if (info === nowTimeCategory) {
                console.log(`选择类目 ${nowTimeCategory}`);
                await node.click();
                await page.waitFor(1000);
            }
            return info;
        }
    });

    // 选取当前页所有餐厅
    let restaurantInfos = await domSelector.select({
        selector: '.rstblock-content',
        nodeTodo: node => {
            if (!node || !node.querySelector) return false;
            return {
                name: node.querySelector('.rstblock-title').innerText,
                fee: parseFloat(node.querySelector('.rstblock-cost').innerText && node.querySelector('.rstblock-cost').innerText.replace('配送费¥', '')),
            };
        },
        filter: (node, info) => {
            if (info.fee > +config.price.maxFreight) return false;
            info.selector = node;
            return info;
        }
    });
    // 随机选择餐厅
    let randomRestaurant = randomPopArrayElement(restaurantInfos);

    console.log(`总共有${restaurantInfos.length}间餐厅6块运费以下，随机选择:${randomRestaurant.name}`);
    await randomRestaurant.selector.click();

    // 把页面切换为最新一页
    await page.waitFor(1000);
    let pages = await browser.pages();
    page = pages[pages.length - 1];
    domSelector.page = page;

    // 选取当前页所有菜单
    let foods = await domSelector.select({
        selector: '.shopmenu-food',
        nodeTodo: node => {
            if (!node || !node.querySelector) return false;
            return {
                name: node.querySelector('.shopmenu-food-name').innerText,
                fee: parseFloat(node.querySelector('.shopmenu-food-price').innerText),
            };
        },
        filter: async(node, info) => {
            if (info.fee < +config.price.max && info.fee > +config.price.min) {
                info.selector = await node.$('button[ng-click="cartItem.add($event)"]');
                if (!info.selector) {
                    info.selector = await node.$('button[food="cartSpec"]');
                }
                info.noAddBtn = true;
                return info;
            }
            return false;
        }
    });

    // 随机选取食物
    let food = randomPopArrayElement(foods);
    console.log(`总共有${foods.length}种吃的价格在10~25间，随机选择:${food.name}`);
    await food.selector.click();
    if (food.noAddBtn) {
        // 可能是选取规格的
        console.log('可能是选取规格的');
        await food.selector.click('button[ng-click="addSpecfood(current.food, $event)"]');
    }
    await page.waitFor(1000);

    let settleResult = await page.evaluate(function() {
        let btn = document.querySelector('button[ng-click="checkout($event)"]');
        if (!btn) throw 'em?购物按钮不见了';
        if (btn.classList && btn.classList.contains('disabled')) {
            return false;
        }
        btn.click();
        return true;
    });

    // 不够起送金额
    if (!settleResult) {
        let btnText = await page.$eval('button[ng-click="checkout($event)"]', btn => btn.innerText);
        console.log(btnText);
        let balance = parseFloat(btnText.replace('还差 ', '').replace(' 元起送', ''));
        console.log(`还差${balance}起送`);
        let tempFoods = foods.concat();
        tempFoods.sort((a, b) => a.fee - b.fee);
        tempFoods = tempFoods.filter(item => item.fee > balance);
        await tempFoods[0].selector.click().catch(async err => {
            // 如果这个食物与选择的相同，尝试点击+按钮
            await page.click('button[ng-click="cartItem.add($event)"]');
        });
        await page.waitFor(1000);
        await page.click('button[ng-click="checkout($event)"]');
    }

    await page.waitFor(2000);

    // 登陆页面的类是加密随机的，所以需要寻取所有a元素，一个一个判断内容
    await domSelector.select({
        selector: 'a',
        nodeTodo: node => {
            if (!node) return false;
            let text = node.innerText;
            if (!~text.indexOf('密码登录')) return false;
            return true;
        },
        filter: async (node, info) => {
            if (info) {
                return node.click();
            }
            return Promise.resolve();
        }
    });
    await page.type('input[placeholder="手机/邮箱/用户名"]', config.ele.data.login.mobile, {delay: 100});
    await page.type('input[placeholder="密码"]', config.ele.data.login.password, {delay: 100});

    // 登陆按钮也混淆了，选取input的兄弟元素
    await page.$eval('input[placeholder="手机/邮箱/用户名"]', node => {
        node.parentNode.parentNode.querySelector('button').click();
    });
};
