// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;

@ccclass
export default class PauseResumer extends cc.Component {

    speed: cc.Vec2 = null;
    position: cc.Vec2 = null;
    rigid: cc.RigidBody = null;
    anim: cc.Animation = null;
    
    start() {
        this.rigid = this.getComponent(cc.RigidBody);
        this.anim = this.getComponent(cc.Animation);
    }

    update() {
        if (this.position) {
            this.node.setPosition(this.position);
        }
    }

    pauseOrResume() {
        if (!this.position) {
            if (this.node) {
                this.position = this.node.getPosition();
                this.node.pauseAllActions();
            }
            if (this.anim)
                this.anim.pause();
            if (this.rigid) {
                this.speed = this.rigid.linearVelocity;
                this.rigid.linearVelocity = cc.v2(0, 0);
                this.rigid.active = false;
            }
        } else {
            if (this.node) {
                this.position = null;
                this.node.resumeAllActions();
            }
            if (this.anim)
                this.anim.resume();
            if (this.rigid) {
                this.rigid.linearVelocity = this.speed;
                this.speed = null;
                this.scheduleOnce(() => {
                    this.rigid.active = true;
                });
            }
        }
    }

    isPause() {
        return this.position != null;
    }
}
