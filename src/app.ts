import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import cron from 'node-cron';

import logger from './logger.js';
import main from './main.js';
import {pushToPushDeer} from './push.js';

dotenv.config();

const config = {
    manual: !!parseInt(process.env.MANUAL ?? ''),
    roomID:
        (process.env.ROOM_ID ?? '').split(',').map((value) => parseInt(value)).filter((value) => !isNaN(value)),
    sendCount:
        (process.env.SEND_COUNT ?? '').split(',').map((value) => parseInt(value)).filter((value) => !isNaN(value)),
};
const pushKey = process.env.PUSHKEY ?? '';
const cronExp = process.env.CRON_EXP ?? '';

let cookies = process.env.COOKIES?.trim() ?? '';
if (cookies.length === 0) {
    try {
        cookies = fs.readFileSync(path.resolve(process.cwd(), '.cookies'), {encoding: 'utf-8'}).trim();
    } catch (error) {
        logger.crit('载入.cookies文件失败: %o', error);
        process.exit(-1);
    }
}

const mainHandler = async () => {
    let reportLog: [boolean, string][];
    try {
        reportLog = await main(cookies, config);
    } catch (error) {
        if (error instanceof Array) {
            reportLog = error;
        } else {
            logger.error(error);
            reportLog = [
                [false, (error as Error).message],
            ];
        }
    }

    if (pushKey.length > 0) {
        const status = reportLog.every((value) => value[0]);
        const reportText = reportLog.map((value) => `${value[0] ? '✅' : '❌'}${value[1]}`).join('\n\n');
        await pushToPushDeer(pushKey, '# ' + (status ? '✅斗鱼荧光棒赠送成功' : '❌斗鱼荧光棒赠送失败'), reportText);
    } else {
        logger.warn('未设定PushKey');
    }
};

if (cronExp.length > 0) {
    cron.schedule(cronExp, mainHandler, {
        timezone: 'Asia/Shanghai',
    });
} else {
    logger.warn('未设定定时执行表达式');
}

mainHandler();
