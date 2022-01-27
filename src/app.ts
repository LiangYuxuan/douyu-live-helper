import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import logger from './logger.js';
import main from './main.js';
import {pushToPushDeer} from './push.js';

dotenv.config();

const pushKey = process.env.PUSHKEY ?? '';
const config = {
    manual: !!parseInt(process.env.MANUAL ?? ''),
    roomID:
        (process.env.ROOM_ID ?? '').split(',').map((value) => parseInt(value)).filter((value) => !isNaN(value)),
    sendCount:
        (process.env.SEND_COUNT ?? '').split(',').map((value) => parseInt(value)).filter((value) => !isNaN(value)),
};

let cookies = process.env.COOKIES ?? '';
if (cookies.length === 0) {
    try {
        cookies = fs.readFileSync(path.resolve(process.cwd(), '.cookies'), {encoding: 'utf-8'});
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
        logger.error(error);
        reportLog = [
            [false, (error as Error).message],
        ];
    }

    if (pushKey.length > 0) {
        const status = reportLog[0][0];
        const reportText = reportLog.map((value) => `${value[0] ? '✅' : '❌'}${value[1]}`).join('\n\n');
        await pushToPushDeer(pushKey, status ? '✅运行成功' : '❌运行失败', reportText);
    }
};

mainHandler();
