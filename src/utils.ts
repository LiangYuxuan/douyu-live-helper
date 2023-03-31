import assert from 'assert';

import {Builder, By, until} from 'selenium-webdriver';
import {Options as ChromeOptions} from 'selenium-webdriver/chrome.js';

import {getFansBadgeList} from './api.js';

export const getGlow = async (cookies: string) => {
    const options = new ChromeOptions();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--headless');

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await driver.get('https://www.douyu.com/4120796');

        await Promise.all(cookies.split(';').map(async (value) => {
            const [k, v] = value.split('=').map((value) => value.trim());
            await driver.manage().addCookie({
                name: k,
                value: v,
            });
        }));

        await driver.navigate().refresh();

        const locator = By.xpath('/html/body/section/header/div/div/div[3]/div[7]/div');
        await driver.wait(until.elementLocated(locator), 30000);
        const element = driver.findElement(locator);
        const className = await element.getAttribute('class');

        if (!className.includes('UserInfo')) {
            throw new Error('直播页面未登录');
        }

        await driver.navigate().refresh();

        await new Promise((resolve) => setTimeout(resolve, 15000));

        await driver.quit();
    } catch (error) {
        await driver.quit();

        throw error;
    }
};

interface FansBadge {
    medalName: string,
    medalLevel: number,
    name: string,
    roomID: number,
    intimacy: number,
    todayIntimacy: number,
    ranking: number,
}

export const getFansBadge = async (cookies: string): Promise<FansBadge[]> => {
    const page = await getFansBadgeList(cookies);

    const table = page.match(/fans-badge-list">([\S\s]*?)<\/table>/);
    const list = table?.[1].match(/<tr([\s\S]*?)<\/tr>/g)?.slice(1);
    assert(list !== undefined, '获取粉丝勋章失败');

    return list.map((value) => {
        const list = value.match(/<td([\s\S]*?)<\/td>/g)?.slice(0, 5);
        assert(list !== undefined, '获取粉丝勋章失败');

        let medalName = ''; let medalLevel = 0; let name = '';
        let roomID = 0; let intimacy = 0; let todayIntimacy = 0; let ranking = 0;
        for (let index = 0; index < 5; ++index) {
            if (index === 0) {
                medalName = list[index].replace(/<([\s\S]*?)>/g, '').trim();
                medalLevel = parseInt(list[index].match(/data-ui-level="([\s\S]*?)"/)?.[1] ?? '0');
            } else if (index === 1) {
                name = list[index].replace(/<([\s\S]*?)>/g, '').trim();
                roomID = parseInt(list[index].match(/href="\/([\s\S]*?)"/)?.[1] ?? '0');
            } else if (index === 2) {
                intimacy = parseInt(list[index].replace(/<([\s\S]*?)>/g, '').trim());
            } else if (index === 3) {
                todayIntimacy = parseInt(list[index].replace(/<([\s\S]*?)>/g, '').trim());
            } else if (index === 4) {
                ranking = parseInt(list[index].replace(/<([\s\S]*?)>/g, '').trim());
            }
        }

        const result: FansBadge = {
            medalName: medalName,
            medalLevel: medalLevel,
            name: name,
            roomID: roomID,
            intimacy: intimacy,
            todayIntimacy: todayIntimacy,
            ranking: ranking,
        };
        return result;
    });
};
