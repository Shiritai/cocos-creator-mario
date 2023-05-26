// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { email2uid } from "../Function/auth";
import { firebaseAssignUpdateCallback, firebaseOnUserInfoUpdateRankList, firebaseOnUpdateUserInfo } from "../Function/database";

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
                firebaseOnUpdateUserInfo(uid);
                firebaseAssignUpdateCallback(uid);
                firebaseOnUserInfoUpdateRankList();
                alert("Logged in successfully");
                cc.director.loadScene("ChooseStage");
            })
            .catch((error: Error) => { 
                alert(error.message); 
            });
    }
}
