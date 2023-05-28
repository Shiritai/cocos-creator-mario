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

    @property
    yAxisValid = false;
    
    targetMario: Mario = null;
    
    checkoutMario(mario: Mario) {
        this.targetMario = mario;
    }
    
    update () {
        if (this.targetMario && !this.targetMario.isDying) {
            let tar_pos = this.targetMario.node.getPosition();
            tar_pos.x = tar_pos.x > 0 ? tar_pos.x : 0;
            if (this.yAxisValid)
                tar_pos.y = tar_pos.y > 0 ? tar_pos.y : 0;
            let new_pos = this.node.getPosition();
            new_pos.lerp(tar_pos, 0.2, new_pos);
            this.node.x = new_pos.x;
            if (this.yAxisValid)
                this.node.y = new_pos.y;
        }
    }
}
