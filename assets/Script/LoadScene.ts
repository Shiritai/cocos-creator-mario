// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import ChooseStage from "./ChooseStage";
import StageMgr from "./StageMgr";

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

    @property(cc.Button)
    readyButton: cc.Button;
    
    @property
    delay = 2;

    start() {
        if (!StageMgr.stageChoice || StageMgr.playMode.mode === 'None') {
            cc.log('Please choose a stage');
            this.scheduleOnce(() => { cc.director
                .loadScene('ChooseStage') }, this.delay);
            return;
        }

        switch (StageMgr.playMode.mode) {
        case "RemoteMultiple":
            alert('Not implemented');
            break;
        case "LocalMultiple":
            this.multiPlayerInfo.active = true;
            this.readyButton.node.active = false;
            this.waitingCount.string = this.readyCount.string =
                StageMgr.playMode.payload.toString();
            break;
        case 'Single':
            break;
        }

        this.stageCount.string = StageMgr.stageChoice.toString();
        this.scheduleOnce(() => { cc.director
            .loadScene(`Stage${StageMgr.stageChoice}`) }, this.delay);
    }
}
