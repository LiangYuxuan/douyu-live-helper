import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import {logger} from './logger.js';
import {
    getFollowList, getBackpack, doDonate,
} from './api.js';
import {getGlow, getFansBadge} from './utils.js';

dotenv.config();

let cookies = process.env.COOKIES ?? '';
if (cookies.length === 0) {
    try {
        cookies = fs.readFileSync(path.resolve(process.cwd(), '.cookies'), {encoding: 'utf-8'});
    } catch (error) {
        logger.crit('载入.cookies文件失败: %o', error);
        process.exit(-1);
    }
}

const loadConfig = () => {
    return {
        manual: !!parseInt(process.env.MANUAL ?? ''),
        roomID:
            (process.env.ROOM_ID ?? '').split(',').map((value) => parseInt(value)).filter((value) => !isNaN(value)),
        sendCount:
            (process.env.SEND_COUNT ?? '').split(',').map((value) => parseInt(value)).filter((value) => !isNaN(value)),
    };
};

(async () => {
    const config = loadConfig();

    logger.debug('Config: %o', config);

    try {
        await getFollowList(cookies);
    } catch (error) {
        logger.crit(error);
        process.exit(-1);
    }

    const badges = await getFansBadge(cookies);

    logger.debug('Badges: %o', badges);

    await getGlow(cookies, badges[0].roomID);

    logger.info('获取粉丝荧光棒成功');

    const bag = await getBackpack(cookies, 48699);
    let glowCount = bag.list
        .map((value) => value.id === 268 ? value.count : 0)
        .reduce((prev, curr) => prev + curr, 0);

    logger.info('持有粉丝荧光棒数量%d', glowCount);

    if (glowCount > 0) {
        if (config.manual) {
            for (let index = 0; index < config.roomID.length; ++index) {
                const roomID = config.roomID[index];
                const badge = badges.filter((value) => value.roomID === roomID)[0];
                if (!badge) continue;

                const sendNum =
                    config.sendCount[index] ?? config.sendCount[config.sendCount.length - 1];

                logger.debug(
                    'Send Gift 粉丝荧光棒 (268) %d/%d to %s (%s)',
                    sendNum, glowCount, badge.name, badge.medalName,
                );

                try {
                    await doDonate(cookies, roomID, 268, sendNum);

                    glowCount -= sendNum;

                    logger.info(
                        '向%s (%s)送出礼物粉丝荧光棒x%d成功: 获得亲密度%d',
                        badge.name, badge.medalName, sendNum, sendNum,
                    );
                } catch (error) {
                    logger.error('向%s (%s)送出礼物粉丝荧光棒x%d失败', badge.name, badge.medalName, sendNum);
                    logger.error(error);
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
                        'Send Gift 粉丝荧光棒 (268) %d/%d to %s (%s)',
                        sendNum, glowCount, badge.name, badge.medalName,
                    );

                    try {
                        await doDonate(cookies, badge.roomID, 268, sendNum);

                        glowCount -= sendNum;

                        logger.info(
                            '向%s (%s)送出礼物粉丝荧光棒x%d成功: 获得亲密度%d',
                            badge.name, badge.medalName, sendNum, sendNum,
                        );
                    } catch (error) {
                        logger.error('向%s (%s)送出礼物粉丝荧光棒x%d失败', badge.name, badge.medalName, sendNum);
                        logger.error(error);
                    }
                }
            }
        }
    } else {
        logger.info('粉丝荧光棒已赠送完毕');
    }
})();
