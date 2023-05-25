// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { UserInfo, addUserInfoUpdatedCallback, email2uid, updateUserInfo } from "../Function/auth";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LogIn extends cc.Component {
    
    @property({type: cc.EditBox})
    email: cc.EditBox = null;

    @property({type: cc.EditBox})
    password: cc.EditBox = null;

    close() {
        cc.director.loadScene('Menu');
    }

    logIn() {
        let email = this.email.string;
        let password = this.password.string;
        let uid = email2uid(email);
        firebase.auth()
            .signInWithEmailAndPassword(email, password)
            .then(() => {
                // load data and add listener on firebase
                firebase.database().ref(`users/${uid}`)
                    .on('value', (snapshot) => {
                        if (snapshot.exists()) {
                            cc.log('Load from firebase');
                            updateUserInfo(snapshot.val());
                        } else {
                            console.log("No data available");
                        }
                    })
                let updateToFirebase = (newUser: UserInfo): void => {
                    cc.log('Push to firebase');
                    firebase.database().ref(`users/${uid}`)
                        .update(newUser);
                }
                addUserInfoUpdatedCallback(updateToFirebase);
                alert("Logged in successfully");
                cc.director.loadScene("ChooseStage");
            })
            .catch((error: Error) => { 
                alert(error.message); 
            });
    }
}
