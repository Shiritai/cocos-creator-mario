// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class Menu extends cc.Component {

    @property({type:cc.AudioClip})
    BGM: cc.AudioClip = null;

    start() {
        this.playBGM();
    }

    playBGM(){
        cc.audioEngine.playMusic(this.BGM, true);
    }

    stopBGM(){
        cc.audioEngine.pauseMusic();
    }

    signUp() {
        cc.director.loadScene("SignUp");
    }

    logIn() {
        cc.director.loadScene("LogIn");
    }
}
