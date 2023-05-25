// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class NewClass extends cc.Component {
    start () {}

    openHowToPlay() {
        let howToPlay = cc.find("Canvas/HowToPlay");
        howToPlay.active = !howToPlay.active;
    }

    loadStage1() {
        cc.director.loadScene('LoadStage1');
    }
    
    loadStage2() {
        cc.director.loadScene('LoadStage2');
    }
}
