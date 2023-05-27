// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ChooseStage from "./ChooseStage";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadScene extends cc.Component {

    @property(cc.Node)
    multiPlayerInfo: cc.Node;

    @property(cc.Label)
    stageCount: cc.Label;

    @property(cc.Label)
    waitingCount: cc.Label;

    @property(cc.Label)
    readyCount: cc.Label;
    
    @property
    delay = 2;

    start() {
        if (ChooseStage.isMultiPlayerChoice) { // multiplayer mode

        } else {
            this.stageCount.string = ChooseStage.stageChoice.toString();
            this.schedule(_ => { cc.director
                .loadScene(`Stage${ChooseStage.stageChoice}`) }, this.delay)
        }
    }
}
