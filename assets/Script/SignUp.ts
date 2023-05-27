// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { email2uid, getDefaultUserInfo, userInfo } from "../Function/types";
import { firebaseAssignUpdateCallback, firebaseOnUpdateRankList, firebaseOnUpdateUserInfo, firebaseSetUserInfo } from "../Function/database";

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
                userInfo.info = getDefaultUserInfo(email, username);
                firebaseSetUserInfo(uid)
                    .then(() => { 
                        cc.log('Initialized firebase');
                        firebaseOnUpdateUserInfo(uid);
                        alert("Signed up successfully");
                        cc.director.loadScene("ChooseStage");
                    }).catch((error: Error) => { 
                        alert(error.message); 
                    });
                firebaseAssignUpdateCallback(uid);
                firebaseOnUpdateRankList();
            })
            .catch((error: Error) => { 
                alert(error.message); 
            });
    }
}
