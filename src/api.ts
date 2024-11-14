/* eslint-disable @typescript-eslint/naming-convention */

import assert from 'node:assert';

import userAgent from './userAgent.ts';

interface APIReturn {
    error: number;
    msg: string;
    data: unknown;
}

interface FollowData {
    allColumn: {
        cate_id: number;
        cate_name: string;
        short_name: string;
        push_vertical_screen: number;
        is_show_rank_list: number;
        is_audio: number;
    }[];
    list: {
        room_id: number;
        chanid: number;
        room_src: string;
        vertical_src: string;
        isVertical: number;
        is_special: number;
        cate_id: number;
        child_id: number;
        room_name: string;
        nickname: string;
        avatar_small: string;
        status: number;
        show_status: number;
        show_time: number;
        nrt: number;
        url: string;
        jumpUrl: string;
        game_name: string;
        online: string;
        hasvid: number;
        vurl: string;
        close_notice: string;
        close_notice_ctime: string;
        sub_rt: number;
        rpos: number;
        icon_outing: number;
        videoLoop: number;
        isShowUp: number;
        rs16_avif: string;
        rs_ext: {
            type: string;
            rs16: string;
            ratio: number;
        }[];
    }[];
    limit: number;
    pageCount: number;
    nowPage: number;
    total: number;
    has_special: number;
}

const getFollowList = async (cookies: string): Promise<FollowData> => {
    const headers = new Headers();
    headers.set('User-Agent', userAgent);
    headers.set('Cookie', cookies);
    headers.set('Referer', 'https://www.douyu.com/');

    const req = await fetch('https://www.douyu.com/wgapi/livenc/liveweb/follow/list', { headers });
    const res = await req.json() as APIReturn;

    assert(res.error === 0, res.msg);

    return res.data as FollowData;
};

interface BackpackData {
    list: {
        batchInfo: {
            batchNum: number;
            name: string;
        }[];
        bizTag: string;
        borderColor: string;
        chatPic: string;
        count: number;
        description: string;
        description2: string;
        devote: number;
        effectInfo: {
            animation: unknown;
            banner: unknown;
            face: unknown;
            mp4: unknown;
            spine: unknown;
        }[];
        exp: number;
        expiry: number;
        focusPic: string;
        hitInterval: number;
        id: number;
        intimate: number;
        intro: string;
        isClick: number;
        isFace: number;
        isValuable: number;
        level: number;
        levelTime: number;
        met: number;
        name: string;
        picUrlPrefix: string;
        price: number;
        priceType: number;
        propPic: string;
        propType: number;
        returnNum: number;
        sendPic: string;
    }[];
    totalNum: number;
    unlockLevel: number;
    validNum: number;
}

const getBackpack = async (cookies: string, roomID: number): Promise<BackpackData> => {
    const headers = new Headers();
    headers.set('User-Agent', userAgent);
    headers.set('Cookie', cookies);
    headers.set('Referer', `https://www.douyu.com/${roomID.toString()}`);

    const params = new URLSearchParams();
    params.set('rid', roomID.toString());

    const req = await fetch(`https://www.douyu.com/japi/prop/backpack/web/v1?${params.toString()}`, { headers });
    const res = await req.json() as APIReturn;

    assert(res.error === 0, res.msg);

    return res.data as BackpackData;
};

interface DonateResult {
    list: unknown[];
    messages: string[];
    picUrlPrefix: string;
    ry: number;
    totalNum: number;
    unlockLevel: number;
    usedProp: {
        balance: number;
        childPropList: unknown[];
        composite: unknown;
        includePrice: number;
        propId: number;
        propName: string;
        propType: number;
    };
    validNum: number;
}

const doDonate = async (
    cookies: string,
    roomID: number,
    giftID: number,
    giftCount: number,
): Promise<DonateResult> => {
    const headers = new Headers();
    headers.set('User-Agent', userAgent);
    headers.set('Cookie', cookies);
    headers.set('Referer', `https://www.douyu.com/${roomID.toString()}`);
    headers.set('Content-Type', 'application/x-www-form-urlencoded');

    const body = new URLSearchParams();
    body.set('propId', giftID.toString());
    body.set('propCount', giftCount.toString());
    body.set('roomId', roomID.toString());
    body.set('bizExt', '{"yzxq":{}}');

    const req = await fetch('https://www.douyu.com/japi/prop/donate/mainsite/v1', { method: 'POST', headers, body });
    const res = await req.json() as APIReturn;

    assert(res.error === 0, res.msg);

    return res.data as DonateResult;
};

const getFansBadgeList = async (cookies: string): Promise<string> => {
    const headers = new Headers();
    headers.set('User-Agent', userAgent);
    headers.set('Cookie', cookies);
    headers.set('Referer', 'https://www.douyu.com/');

    const req = await fetch('https://www.douyu.com/member/cp/getFansBadgeList', { headers });
    const res = await req.text();

    return res;
};

export {
    getFollowList,
    getBackpack,
    doDonate,
    getFansBadgeList,
};
