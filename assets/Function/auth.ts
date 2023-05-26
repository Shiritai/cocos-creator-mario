export type UserInfo = {
    username: string,
    email: string,
    life: number,
    coin: number,
    score: number,
    time: number,
    stage: number,
}

export function getDefaultUserInfo(email: string, username: string): UserInfo {
    return {
        username: username,
        email: email,
        life: 5,
        coin: 0,
        score: 0,
        time: 300,
        stage: 0,
    }
}

export let userInfo: {
    info: UserInfo | null
    callbacks: ((info: UserInfo) => void)[]
} = {
    info: null,
    callbacks: []
}

/**
 * Update userInfo, after this, all callback functions assigned will be called
 * @param newInfo new userInfo object
 */
export function updateUserInfo(newInfo: UserInfo) {
    userInfo.info = {...userInfo.info, ...newInfo};
    for (let fn of userInfo.callbacks)
        fn(userInfo.info);
}

/**
 * Append callback function for userInfo
 * @param callback callback function to be called after each update of userInfo
 */
export function addUserInfoUpdatedCallback(callback: (info: UserInfo) => void) {
    userInfo.callbacks.push(callback);
}

/**
 * Append callback function for userInfo
 * @param callback callback function to be called after each update of userInfo
 */
export function removeUserInfoUpdatedCallback(callback: (info: UserInfo) => void) {
    userInfo.callbacks = userInfo.callbacks.filter(f => f != callback);
}

export function email2uid(email: string) {
    return email.replace(/@/g, '_').replace(/\./g, '=')
}

export function uid2email(uid: string) {
    return uid.replace(/=/g, '.').replace(/_/g, '@')
}

export type RankItem = {
    uid: string,
    username: string,
    score: number,
}

/**
 * Update this using updateRankList function
 */
export let rankList: {
    list: RankItem[] | null,
    callbacks: ((newList: RankItem[]) => void)[]
} = {
    list: null,
    callbacks: []
};

export function updateRankList(newItem: RankItem, needUpdate = true) {
    if (!rankList.list)
        rankList.list = new Array();
    if (rankList.list.includes(newItem))
        return;
    let toCallback = false;
    for (let item of rankList.list) {
        if (item.uid === newItem.uid) {
            if (newItem.score > item.score) {
                item.score = newItem.score;
                firebase.database().ref(`scores/${newItem.uid}`)
                    .update(newItem);
                toCallback = true;
            } else {
                return;
            }
        }
    }
    if (!toCallback) {
        let newList = rankList.list.concat(newItem).sort((a, b) => b.score - a.score);
        if (newList.length <= 5 || newList[0].uid !== newItem.uid) { // need update
            rankList.list = newList;
            if (needUpdate) {
                // update new score
                firebase.database().ref(`scores/${newItem.uid}`)
                    .update(newItem);
                if (newList.length > 5) {
                    // delete lowest score
                    firebase.database().ref(`scores/${newList[0].uid}`)
                        .update(null);
                }
            }
        }
    }
    for (let fn of rankList.callbacks)
        fn(rankList.list);
}

/**
 * Append callback function for userInfo
 * @param callback callback function to be called after each update of userInfo
 */
export function addRankListUpdatedCallback(callback: (newList: RankItem[]) => void) {
    rankList.callbacks.push(callback);
}

/**
 * Append callback function for userInfo
 * @param callback callback function to be called after each update of userInfo
 */
export function removeRankListUpdatedCallback(callback: (newList: RankItem[]) => void) {
    rankList.callbacks = rankList.callbacks.filter(f => f != callback);
}