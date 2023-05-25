// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { UserInfo, addUserInfoUpdatedCallback, email2uid, getDefaultUserInfo, updateUserInfo, userInfo } from "../Function/auth";

const {ccclass, property} = cc._decorator;

@ccclass
export default class SignUp extends cc.Component {

    @property({type: cc.EditBox})
    email: cc.EditBox = null;

    @property({type: cc.EditBox})
    username: cc.EditBox = null;

    @property({type: cc.EditBox})
    password: cc.EditBox = null;
    
    close() {
        cc.director.loadScene('Menu');
    }

    signUp() {
        let email = this.email.string;
        let username = this.username.string;
        let password = this.password.string;
        let uid = email2uid(email);
        firebase.auth()
            .createUserWithEmailAndPassword(email, password)
            .then(() => {
                firebase.database().ref(`scores/${uid}`)
                    .set({ score: 0 });
                userInfo.info = getDefaultUserInfo(email, username);
                firebase.database().ref(`users/${uid}`)
                    .set(userInfo.info)
                    .then(() => { 
                        cc.log('Initialized firebase');
                        firebase.database().ref(`users/${uid}`)
                            .on('value', (snapshot) => {
                                if (snapshot.exists()) {
                                    cc.log('Load from firebase');
                                    updateUserInfo(snapshot.val());
                                } else {
                                    console.log("No data available");
                                }
                            })
                        alert("Signed up successfully");
                        cc.director.loadScene("ChooseStage");
                    }).catch((error: Error) => { 
                        alert(error.message); 
                    });
                let updateToFirebase = (newUser: UserInfo): void => {
                    cc.log('Push to firebase');
                    firebase.database().ref(`users/${uid}`)
                        .update(newUser);
                }
                addUserInfoUpdatedCallback(updateToFirebase);
            })
            .catch((error: Error) => { 
                alert(error.message); 
            });
    }
}
