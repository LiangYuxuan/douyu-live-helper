import assert from 'node:assert';

import { Builder } from 'selenium-webdriver';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox.js';

import { getFansBadgeList } from './api.ts';
import logger from './logger.ts';

interface FansBadge {
    medalName: string,
    medalLevel: number,
    name: string,
    roomID: number,
    intimacy: number,
    todayIntimacy: number,
    ranking: number,
}

export const getGlow = async (cookies: string, remoteURL: string | undefined) => {
    const options = new FirefoxOptions();
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-gpu');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--headless');

    const driver = (remoteURL !== undefined && remoteURL.length > 0)
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

export const getFansBadge = async (cookies: string): Promise<FansBadge[]> => {
    const page = await getFansBadgeList(cookies);

    const table = /fans-badge-list">([\S\s]*?)<\/table>/.exec(page);
    const list = table?.[1].match(/<tr([\s\S]*?)<\/tr>/g)?.slice(1);
    assert(list !== undefined, '获取粉丝勋章失败');

    return list.map((item) => {
        const tds = item.match(/<td([\s\S]*?)<\/td>/g)?.slice(0, 5);
        assert(tds !== undefined, '获取粉丝勋章失败');

        const medalName = /data-bn="([\S\s]+?)"/.exec(item)?.[1];
        const medalLevel = /data-fans-level="(\d+)"/.exec(item)?.[1];
        const name = /data-anchor_name="([\S\s]+?)"/.exec(item)?.[1];
        const roomID = /data-fans-room="(\d+)"/.exec(item)?.[1];
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
