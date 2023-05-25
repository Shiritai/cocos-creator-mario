export type UserInfo = {
    username: string,
    email: string,
    life: number,
    coin: number,
    score: number,
    time: number
}

export function getDefaultUserInfo(email: string, username: string): UserInfo {
    return {
        username: username,
        email: email,
        life: 5,
        coin: 0,
        score: 0,
        time: 300
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
    userInfo.info = newInfo;
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

export function email2uid(email: string) {
    return email.replace(/@/g, '_').replace(/\./g, '=')
}

export function uid2email(uid: string) {
    return uid.replace(/=/g, '.').replace(/_/g, '@')
}