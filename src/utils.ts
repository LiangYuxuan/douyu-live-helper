import assert from 'assert';

import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';

import { getFansBadgeList, getRoomDID, doDonate } from './api.js';

const extractSID = (cookies: string): string | undefined => {
    const target = cookies.split(';').filter((value) => /^\s*acf_uid=/.test(value));
    return target.length > 0 ? target[0].replace(/^\s*acf_uid=(.*)\s*/, '$1') : undefined;
};

const extractDY = (cookies: string): string | undefined => {
    const target = cookies.split(';').filter((value) => /^\s*dy_did=/.test(value));
    return target.length > 0 ? target[0].replace(/^\s*dy_did=(.*)\s*/, '$1') : undefined;
};

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
            const [k, v] = value.split('=').map((str) => str.trim());
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

        await new Promise((resolve) => {
            setTimeout(resolve, 15000);
        });

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
        const str = value.match(/<td([\s\S]*?)<\/td>/g)?.slice(0, 5);
        assert(str !== undefined, '获取粉丝勋章失败');

        let medalName = ''; let medalLevel = 0; let name = '';
        let roomID = 0; let intimacy = 0; let todayIntimacy = 0; let ranking = 0;
        for (let index = 0; index < 5; index += 1) {
            if (index === 0) {
                medalName = str[index].replace(/<([\s\S]*?)>/g, '').trim();
                medalLevel = parseInt(str[index].match(/data-ui-level="([\s\S]*?)"/)?.[1] ?? '0', 10);
            } else if (index === 1) {
                name = str[index].replace(/<([\s\S]*?)>/g, '').trim();
                roomID = parseInt(str[index].match(/href="\/([\s\S]*?)"/)?.[1] ?? '0', 10);
            } else if (index === 2) {
                intimacy = parseInt(str[index].replace(/<([\s\S]*?)>/g, '').trim(), 10);
            } else if (index === 3) {
                todayIntimacy = parseInt(str[index].replace(/<([\s\S]*?)>/g, '').trim(), 10);
            } else if (index === 4) {
                ranking = parseInt(str[index].replace(/<([\s\S]*?)>/g, '').trim(), 10);
            }
        }

        const result: FansBadge = {
            medalName,
            medalLevel,
            name,
            roomID,
            intimacy,
            todayIntimacy,
            ranking,
        };
        return result;
    });
};

export const sendGift = async (
    cookies: string,
    roomID: number,
    giftID: number,
    giftCount: number,
) => {
    const sid = extractSID(cookies);
    const dy = extractDY(cookies);

    assert(sid !== undefined, '获取 sid 失败');
    assert(dy !== undefined, '获取 dy 失败');

    const did = await getRoomDID(cookies, roomID);

    return doDonate(cookies, roomID, giftID, giftCount, sid, dy, did);
};
