import 'dotenv/config';
import cron from 'node-cron';

import logger from './logger.ts';
import getCookies from './cookies.ts';
import main from './main.ts';
import pushToPushDeer from './push.ts';

const config = {
    manual: !!parseInt(process.env.MANUAL ?? '', 10),
    roomID:
        (process.env.ROOM_ID ?? '').split(',').map((value) => parseInt(value, 10)).filter((value) => !Number.isNaN(value)),
    sendCount:
        (process.env.SEND_COUNT ?? '').split(',').map((value) => parseInt(value, 10)).filter((value) => !Number.isNaN(value)),
    seleniumURL: process.env.SELENIUM_URL ?? '',
};
const pushKey = process.env.PUSHKEY ?? '';
const cronExp = process.env.CRON_EXP ?? '';

const coreHandler = async () => {
    await main(await getCookies(), config);
};

const mainHandler = () => {
    coreHandler()
        .catch((error) => {
            logger.error((error as Error).message);
        })
        .finally(() => {
            if (pushKey.length > 0) {
                const { isAllSuccess, pushText } = logger.getPushInfo();
                pushToPushDeer(pushKey, `# ${isAllSuccess ? '✅斗鱼荧光棒赠送成功' : '❌斗鱼荧光棒赠送失败'}`, pushText.join('\n\n'))
                    .then(() => {
                        logger.clearPushInfo();
                    })
                    .catch((error) => {
                        logger.error((error as Error).message);
                    });
            } else {
                logger.warn('未设定PushKey');
            }
        });
};

if (cronExp.length > 0) {
    cron.schedule(cronExp, mainHandler, {
        timezone: 'Asia/Shanghai',
    });
} else {
    logger.warn('未设定定时执行表达式');
}

mainHandler();
