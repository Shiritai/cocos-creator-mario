import Mario from "../Script/Mario"
import StageMgr from "../Script/StageMgr"
import { Movement } from "./Movement"

export type UserInfo = {
    username: string,
    email: string,
    life: number,
    coin: number,
    score: number,
    time: number,
    stage: number,
}

export function getDefaultUserInfo(email: string, username: string, stage?: number): UserInfo {
    return {
        username: username,
        email: email,
        life: 5,
        coin: 0,
        score: 0,
        time: 300,
        stage: stage ?? 0,
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

/**
 * Since logic of rankList is more complicated,
 * this function directly deal with firebase
 * @param newItem new RankItem, if it's in top 5, then it'll be saved
 * @param needUpdate whether should update newItem to firebase
 */
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
                rankList.list.sort((a, b) => b.score - a.score);
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
        if (newList.length <= 5 || newList[0].uid === newItem.uid) { // need update
            rankList.list = newList.slice(0, 5);
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

/**
 * Data structure definition to store and update on firebase
 */
export type FB_Mario = {
    // uid: string,
    // username: string,
    x: number,
    y: number,
    v_x: number,
    v_y: number,
    isDying: boolean,
    move: Movement,
    powerUp: boolean,
    golden: boolean,
    onGround: number,
    inDistBox: boolean,
    animeName: string,
    audioID: number,
}

/**
 * Data structure store and update mario information with firebase
 */
export let stageMarios: {
    stage: Map<number, Map<string, FB_Mario>>,
    callbacks: ((stage: number, newFbMario: FB_Mario) => void)[]
} = {
    // assume there are stage 1, 2
    stage: new Map([[1, new Map()], [2, new Map()]]),
    callbacks: new Array()
}

export function uploadCurrentMario(stage: number, mario: Mario) {
    // make sure we're uploading current mario
    if (mario.uid !== email2uid(userInfo.info.email))
        return;

    let stageMap = stageMarios.stage.get(stage);
    let rigid = mario.getComponent(cc.RigidBody);
    let newFbMario: FB_Mario = {
        x: rigid.node.getPosition().x,
        y: rigid.node.getPosition().y,
        v_x: rigid.linearVelocity.x,
        v_y: rigid.linearVelocity.y,
        isDying: mario.isDying,
        move: mario.move,
        powerUp: mario.powerUp,
        golden: mario.golden,
        onGround: mario.onGround,
        inDistBox: mario.inDistBox,
        animeName: mario.animeName,
        audioID: mario.audioID,
    }
    stageMap.set(mario.uid, newFbMario);

    firebase.database()
        .ref(`/stage/${stage}/marios/${mario.uid}`)
        .update(newFbMario);
}

/**
 * Watch all marios except for current one
 * @param stage 
 * @param mario 
 * @returns 
 */
export function updateOtherMarios(fbStageMarios: Map<number, Map<string, FB_Mario>>) {
    for (let [stage, marioMap] of Array.from(stageMarios.stage.entries())) {
        let stageMap = StageMgr.stageMarioMap.get(stage);
        for (let [uid, fbMario] of Array.from(marioMap.entries())) {
            if (uid === email2uid(userInfo.info.email))
                continue; // only local changes can apply on main player
        
            let mario = stageMap.get(uid);
            let rigid = mario.getComponent(cc.RigidBody);

            rigid.node.getPosition().x = fbMario.x;
            rigid.node.getPosition().y = fbMario.y;
            rigid.linearVelocity.x = fbMario.v_x;
            rigid.linearVelocity.y = fbMario.v_y;
            mario.isDying = fbMario.isDying;
            mario.move = fbMario.move;
            mario.powerUp = fbMario.powerUp;
            mario.golden = fbMario.golden;
            mario.onGround = fbMario.onGround;
            mario.inDistBox = fbMario.inDistBox;
            mario.animeName = fbMario.animeName;
            mario.audioID = fbMario.audioID;
        
            for (let fn of stageMarios.callbacks)
                fn(stage, fbMario);
        }
    }
}

/**
 * Watch all marios except for current one
 * @param stage 
 * @param mario 
 * @returns 
 */
export function updateOtherMario(stage: number, uid: string, fbMario: FB_Mario) {
    if (uid === email2uid(userInfo.info.email))
        return; // only local changes can apply on main player

    let stageMap = StageMgr.stageMarioMap.get(stage);
    let mario = stageMap.get(uid);
    if (mario) {
        let rigid = mario.getComponent(cc.RigidBody);
        rigid.node.getPosition().x = fbMario.x;
        rigid.node.getPosition().y = fbMario.y;
        rigid.linearVelocity.x = fbMario.v_x;
        rigid.linearVelocity.y = fbMario.v_y;
        mario.isDying = fbMario.isDying;
        mario.move = fbMario.move;
        mario.powerUp = fbMario.powerUp;
        mario.golden = fbMario.golden;
        mario.onGround = fbMario.onGround;
        mario.inDistBox = fbMario.inDistBox;
        mario.animeName = fbMario.animeName;
        mario.audioID = fbMario.audioID;
    } else {
        
    }

    for (let fn of stageMarios.callbacks)
        fn(stage, fbMario);
    // for (let [stage, marioMap] of Array.from(stageMarios.stage.entries())) {
    //     let stageMap = StageMgr.stageMarioMap.get(stage);
    //     for (let [uid, fbMario] of Array.from(marioMap.entries())) {
    //     }
    // }
}

export type KeyControl = {
    left: number,
    right: number,
    up: number,
    cameraSwitch: number
};