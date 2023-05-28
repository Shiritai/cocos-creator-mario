// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { BodyType } from "../Function/BodyType";

const {ccclass, property} = cc._decorator;

@ccclass
export default class DistantBox extends cc.Component {

    start() {
        for (let phy of this.getComponents(cc.PhysicsCollider)) {
            phy.tag = BodyType.DIST_BOX
        }
    }
}
