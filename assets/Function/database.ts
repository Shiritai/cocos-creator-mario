import { UserInfo, addUserInfoUpdatedCallback, updateRankList, updateUserInfo, userInfo } from "./types";

export function firebaseSetUserInfo(uid: string): Promise<void> {
    return firebase.database().ref(`users/${uid}`).set(userInfo.info);
}

export function firebaseOnUpdateUserInfo(uid: string) {
    firebase.database().ref(`users/${uid}`)
        .on('value', (snapshot) => {
            if (snapshot.exists()) {
                cc.log('Load from firebase');
                updateUserInfo(snapshot.val());
            } else {
                cc.log("No data available");
            }
        })
}

export function firebaseAssignUpdateCallback(uid: string) {
    let updateToFirebase = (newUser: UserInfo): void => {
        cc.log('Push to firebase');
        firebase.database().ref(`users/${uid}`)
            .update(newUser);
    }
    addUserInfoUpdatedCallback(updateToFirebase);
}

export function firebaseOnUpdateRankList() {
    firebase.database().ref(`scores/`)
        .on('value', (snapshot) => {
            if (snapshot.exists()) {
                snapshot.forEach(child => {
                    updateRankList({
                        uid: child.key,
                        username: child.val().username,
                        score: child.val().score
                    }, false);
                });
                cc.log('Load rankList from firebase');
            } else {
                cc.log("No list available");
            }
        })
}

export function firebaseOnUpdateMarios(stage: string) {
    firebase.database().ref(`${stage}/marios`)
        .on('value', (snapshot) => {
            if (snapshot.exist()) {
                snapshot.forEach(mario => {
                    
                })
            }
        })
}