import util from 'util';

import logger from './logger.js';
import {getFollowList, getBackpack, doDonate} from './api.js';
import {getGlow, getFansBadge} from './utils.js';

interface Config {
    manual: boolean,
    roomID: number[],
    sendCount: number[],
}

export default async (cookies: string, config: Config): Promise<[boolean, string][]> => {
    const reportLog: [boolean, string][] = [];

    await getFollowList(cookies);

    const badges = await getFansBadge(cookies);

    logger.debug('Badges: %o', badges);

    if (badges.length === 0) {
        reportLog.push([false, '获取粉丝勋章失败']);
        throw reportLog;
    }

    await getGlow(cookies);

    logger.info('获取粉丝荧光棒成功');
    reportLog.push([true, '获取粉丝荧光棒成功']);

    const bag = await getBackpack(cookies, badges[0].roomID);
    let glowCount = bag.list
        .map((value) => value.id === 268 ? value.count : 0)
        .reduce((prev, curr) => prev + curr, 0);

    logger.info('持有粉丝荧光棒数量%d', glowCount);
    reportLog.push([true, util.format('持有粉丝荧光棒数量%d', glowCount)]);

    if (glowCount > 0) {
        if (config.manual) {
            for (let index = 0; index < config.roomID.length; ++index) {
                const roomID = config.roomID[index];
                const badge = badges.filter((value) => value.roomID === roomID)[0];
                if (!badge) continue;

                const sendNum =
                    config.sendCount[index] ?? config.sendCount[config.sendCount.length - 1];

                logger.debug(
                    'Send Gift 粉丝荧光棒 (268) %d/%d to %s(%s)',
                    sendNum, glowCount, badge.name, badge.medalName,
                );

                try {
                    await doDonate(cookies, roomID, 268, sendNum);

                    glowCount -= sendNum;

                    logger.info(
                        '向%s(%s)送出礼物粉丝荧光棒x%d成功: 获得亲密度%d',
                        badge.name, badge.medalName, sendNum, sendNum,
                    );
                    reportLog.push([true, util.format(
                        '向%s(%s)送出礼物粉丝荧光棒x%d成功: 获得亲密度%d',
                        badge.name, badge.medalName, sendNum, sendNum,
                    )]);
                } catch (error) {
                    logger.error('向%s(%s)送出礼物粉丝荧光棒x%d失败', badge.name, badge.medalName, sendNum);
                    reportLog.push([false, util.format(
                        '向%s(%s)送出礼物粉丝荧光棒x%d失败', badge.name, badge.medalName, sendNum,
                    )]);
                    throw reportLog;
                }
            }
        } else {
            const every = Math.floor(glowCount / badges.length);
            const last = glowCount - every * (badges.length - 1);

            for (let index = 0; index < badges.length; ++index) {
                const badge = badges[index];
                const sendNum = index < badges.length - 1 ? every : last;

                if (sendNum > 0) {
                    logger.debug(
                        'Send Gift 粉丝荧光棒 (268) %d/%d to %s(%s)',
                        sendNum, glowCount, badge.name, badge.medalName,
                    );

                    try {
                        await doDonate(cookies, badge.roomID, 268, sendNum);

                        glowCount -= sendNum;

                        logger.info(
                            '向%s(%s)送出礼物粉丝荧光棒x%d成功: 获得亲密度%d',
                            badge.name, badge.medalName, sendNum, sendNum,
                        );
                        reportLog.push([true, util.format(
                            '向%s(%s)送出礼物粉丝荧光棒x%d成功: 获得亲密度%d',
                            badge.name, badge.medalName, sendNum, sendNum,
                        )]);
                    } catch (error) {
                        logger.error('向%s(%s)送出礼物粉丝荧光棒x%d失败', badge.name, badge.medalName, sendNum);
                        reportLog.push([false, util.format(
                            '向%s(%s)送出礼物粉丝荧光棒x%d失败', badge.name, badge.medalName, sendNum,
                        )]);
                        throw reportLog;
                    }
                }
            }
        }
    } else {
        logger.info('粉丝荧光棒已赠送完毕');
        reportLog.push([true, '粉丝荧光棒已赠送完毕']);
    }

    return reportLog;
};
