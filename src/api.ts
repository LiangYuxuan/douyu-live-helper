/* eslint-disable camelcase */

import assert from 'assert';
import got from 'got';

const UserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.93 Safari/537.36';

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

export const getFollowList = async (cookies: string): Promise<FollowData> => {
    const result: APIReturn = await got.get('https://www.douyu.com/wgapi/livenc/liveweb/follow/list', {
        headers: {
            'User-Agent': UserAgent,
            'Cookie': cookies,
            'Referer': 'https://www.douyu.com/',
        },
    }).json();

    assert(result.error === 0, result.msg);

    return result.data as FollowData;
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

export const getBackpack = async (cookies: string, roomID: number): Promise<BackpackData> => {
    const result: APIReturn = await got.get('https://www.douyu.com/japi/prop/backpack/web/v1', {
        headers: {
            'User-Agent': UserAgent,
            'Cookie': cookies,
            'Referer': 'https://www.douyu.com/' + roomID,
        },
        searchParams: {
            rid: roomID,
        },
    }).json();

    assert(result.error === 0, result.msg);

    return result.data as BackpackData;
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

export const doDonate = async (
    cookies: string, roomID: number, giftID: number, giftCount: number,
): Promise<DonateResult> => {
    const result: APIReturn = await got.post('https://www.douyu.com/japi/prop/donate/mainsite/v1', {
        headers: {
            'User-Agent': UserAgent,
            'Cookie': cookies,
            'Referer': 'https://www.douyu.com/' + roomID,
        },
        form: {
            propId: giftID,
            propCount: giftCount,
            roomId: roomID,
            bizExt: '{"yzxq":{}}',
        },
    }).json();

    assert(result.error === 0, result.msg);

    return result.data as DonateResult;
};

export const getFansBadgeList = async (cookies: string): Promise<string> => {
    return (await got.get('https://www.douyu.com/member/cp/getFansBadgeList', {
        headers: {
            'User-Agent': UserAgent,
            'Cookie': cookies,
            'Referer': 'https://www.douyu.com/',
        },
    })).body;
};
