import util from 'node:util';

import logger from './logger.js';
import { getFollowList, getBackpack, doDonate } from './api.js';
import { getGlow, getFansBadge } from './utils.js';

interface Config {
    manual: boolean,
    roomID: number[],
    sendCount: number[],
    seleniumURL: string | undefined,
}

export default async (cookies: string, config: Config) => {
    await getFollowList(cookies);

    const badges = await getFansBadge(cookies);

    logger.debug(util.format('Badges: %o', badges));

    if (badges.length === 0) {
        logger.error('获取粉丝勋章失败');
        return;
    }

    logger.info('开始获取粉丝荧光棒');

    await getGlow(cookies, config.seleniumURL);

    logger.info('获取粉丝荧光棒成功');

    const bag = await getBackpack(cookies, badges[0].roomID);
    let glowCount = bag.list
        .map((value) => (value.id === 268 ? value.count : 0))
        .reduce((prev, curr) => prev + curr, 0);

    logger.info(`持有粉丝荧光棒数量${glowCount}`);

    if (glowCount > 0) {
        if (config.manual) {
            for (let index = 0; index < config.roomID.length; index += 1) {
                const roomID = config.roomID[index];
                const badge = badges.find((value) => value.roomID === roomID);
                if (badge) {
                    const sendNum = config.sendCount[index]
                        ?? config.sendCount[config.sendCount.length - 1];

                    logger.debug(`Send Gift 粉丝荧光棒 (268) ${sendNum}/${glowCount} to ${badge.name}(${badge.medalName})`);

                    try {
                        // eslint-disable-next-line no-await-in-loop
                        await doDonate(cookies, roomID, 268, sendNum);

                        glowCount -= sendNum;

                        logger.info(`向${badge.name}(${badge.medalName})送出礼物粉丝荧光棒x${sendNum}成功: 获得亲密度${sendNum}`);
                    } catch (error) {
                        logger.error(`向${badge.name}(${badge.medalName})送出礼物粉丝荧光棒x${sendNum}失败`);
                        return;
                    }
                }
            }
        } else {
            const every = Math.floor(glowCount / badges.length);
            const last = glowCount - every * (badges.length - 1);

            for (let index = 0; index < badges.length; index += 1) {
                const badge = badges[index];
                const sendNum = index < badges.length - 1 ? every : last;

                if (sendNum > 0) {
                    logger.debug(`Send Gift 粉丝荧光棒 (268) ${sendNum}/${glowCount} to ${badge.name}(${badge.medalName})`);

                    try {
                        // eslint-disable-next-line no-await-in-loop
                        await doDonate(cookies, badge.roomID, 268, sendNum);

                        glowCount -= sendNum;

                        logger.info(`向${badge.name}(${badge.medalName})送出礼物粉丝荧光棒x${sendNum}成功: 获得亲密度${sendNum}`);
                    } catch (error) {
                        logger.error(`向${badge.name}(${badge.medalName})送出礼物粉丝荧光棒x${sendNum}失败`);
                        return;
                    }
                }
            }
        }
    } else {
        logger.info('粉丝荧光棒已赠送完毕');
    }
};
