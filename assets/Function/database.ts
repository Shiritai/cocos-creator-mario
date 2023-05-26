import { UserInfo, addUserInfoUpdatedCallback, updateUserInfo, userInfo } from "./auth";

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
            console.log("No data available");
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

export function firebaseUpdateScore(uid: string, newScore: number) {
    firebase.database().ref(`scores/${uid}`)
        .update({ score: newScore });
}