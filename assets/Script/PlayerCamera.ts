// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Mario from "./Mario";

const {ccclass, property} = cc._decorator;

@ccclass
export default class PlayerCamera extends cc.Component {

    @property({type: Mario})
    mainMario: Mario = null;
    
    update () {
        if (this.mainMario && !this.mainMario.isDying) {
            let tar_pos = this.mainMario.node.getPosition();
            tar_pos.x = tar_pos.x > 0 ? tar_pos.x : 0;
            let cur_pos = this.node.getPosition();
            cur_pos.lerp(tar_pos, 0.2, cur_pos);
            this.node.x = cur_pos.x;
        }
    }
}
