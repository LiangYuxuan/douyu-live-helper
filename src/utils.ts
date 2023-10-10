import assert from 'assert';

import { Builder } from 'selenium-webdriver';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';

import { getFansBadgeList } from './api.js';
import logger from './logger.js';

export const getGlow = async (cookies: string, remoteURL: string | undefined) => {
    const options = new FirefoxOptions();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--headless');

    const driver = (remoteURL && remoteURL.length > 0)
        ? await new Builder()
            .usingServer(remoteURL)
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build()
        : await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();

    logger.debug('WebDriver ready.');

    try {
        await driver.get('https://www.douyu.com/4120796');

        logger.debug('First page loaded.');

        await Promise.all(cookies.split(';').map(async (value) => {
            const [k, v] = value.split('=').map((str) => str.trim());
            await driver.manage().addCookie({
                name: k,
                value: v,
            });
        }));

        logger.debug('Cookies loaded.');

        await driver.navigate().refresh();

        logger.debug('Final page loaded.');

        await new Promise((resolve) => {
            setTimeout(resolve, 15000);
        });

        logger.debug('Waited 15s.');

        await driver.quit();

        logger.debug('WebDriver quit.');
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

    return list.map((item) => {
        const tds = item.match(/<td([\s\S]*?)<\/td>/g)?.slice(0, 5);
        assert(tds !== undefined, '获取粉丝勋章失败');

        const medalName = item.match(/data-bn="([\S\s]+?)"/)?.[1];
        const medalLevel = item.match(/data-fans-level="(\d+)"/)?.[1];
        const name = item.match(/data-anchor_name="([\S\s]+?)"/)?.[1];
        const roomID = item.match(/data-fans-room="(\d+)"/)?.[1];
        const intimacy = tds[2].replace(/<([\s\S]*?)>/g, '').trim();
        const todayIntimacy = tds[3].replace(/<([\s\S]*?)>/g, '').trim();
        const ranking = tds[4].replace(/<([\s\S]*?)>/g, '').trim();

        assert(medalName !== undefined, '获取粉丝勋章medalName失败');
        assert(medalLevel !== undefined, '获取粉丝勋章medalLevel失败');
        assert(name !== undefined, '获取粉丝勋章name失败');
        assert(roomID !== undefined, '获取粉丝勋章roomID失败');
        assert(intimacy.length > 0, '获取粉丝勋章intimacy失败');
        assert(todayIntimacy.length > 0, '获取粉丝勋章todayIntimacy失败');
        assert(ranking.length > 0, '获取粉丝勋章ranking失败');

        const result: FansBadge = {
            medalName,
            medalLevel: parseInt(medalLevel, 10),
            name,
            roomID: parseInt(roomID, 10),
            intimacy: parseInt(intimacy, 10),
            todayIntimacy: parseInt(todayIntimacy, 10),
            ranking: parseInt(ranking, 10),
        };
        return result;
    });
};
