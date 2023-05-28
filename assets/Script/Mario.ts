// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { BodyType } from "../Function/BodyType";
import { Movement, MovementRef, resetAll, resetLeft, resetRight, resetUp, setLeft, setRight, setUp } from "../Function/Movement";
import { KeyControl, UserInfo, addUserInfoUpdatedCallback, email2uid, removeUserInfoUpdatedCallback, userInfo } from "../Function/types";
import PlayerCamera from "./PlayerCamera";
import StageMgr from "./StageMgr";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Mario extends cc.Component implements MovementRef {

    private static readonly move_speed = 200;
    private static readonly move_run_acc = 600;
    private static readonly jump_speed = 850;
    
    // members
    uid: string = "invalidUID";
    /**
     * Whether is playing dying anime
     */
    isDying = false;
    /**
     * Moving direction of mario
     */
    move: Movement = Movement.STAY;
    /**
     * Big mario state
     */
    powerUp: boolean = false;
    /**
     * 金身, won't get hurt state
     */
    golden: boolean = false;

    onGround: number = 0;
    inDistBox: boolean = false;
    winned = false;
    
    animeName: string = null;
    audioID: number = null;
    
    private init_pos: cc.Vec2 = null;
    private anim: cc.Animation = null;
    private camera: PlayerCamera = null;

    // properties
    @property({type: cc.Label})
    usernameLabel: cc.Label = null;

    @property({type: cc.AudioClip})
    BGM: cc.AudioClip = null;

    @property({type: cc.AudioClip})
    jumpClip: cc.AudioClip = null;

    @property({type: cc.AudioClip})
    kickClip: cc.AudioClip = null;

    @property({type: cc.AudioClip})
    loseOneLifeClip: cc.AudioClip = null;

    @property({type: cc.AudioClip})
    powerUpClip: cc.AudioClip = null;

    @property({type: cc.AudioClip})
    powerDownClip: cc.AudioClip = null;

    keyControl: KeyControl = {
        left: -1,
        right: -1,
        up: -1,
        cameraSwitch: -1
    };
    
    onLoad() {
        cc.director.getPhysicsManager().enabled = true;
        this.anim = this.getComponent(cc.Animation);
    }
    
    start() {
        this.getComponent(cc.PhysicsCollider).tag = BodyType.PLAYER;
        cc.audioEngine.playMusic(this.BGM, true);
        if (!this.init_pos) {
            this.init_pos = this.node.getPosition();
        }
    }
    
    initializeMainMario(camera: PlayerCamera) {
        // bind system keyboard
        this.keyControl = { ...StageMgr.localPlayerKeyMap[0] }
        this.camera = camera;
        // setup members
        let username: string;
        if (userInfo.info) {
            this.uid = email2uid(userInfo.info.email);
            username = userInfo.info.username;
        } else {
            this.uid = 'invalidUID';
            username = 'anonymous';
        }
        this.usernameLabel.string = username.toUpperCase();
        addUserInfoUpdatedCallback(this.setUpUsername);
    }
    
    initializeTheOtherPlayerMario(username: string, keyControl: KeyControl, camera: PlayerCamera) {
        // bind system keyboard
        this.keyControl = { ...keyControl }
        this.camera = camera;
        // setup members
        this.uid = username;
        this.usernameLabel.string = username.toUpperCase();
        addUserInfoUpdatedCallback(this.setUpUsername);
    }

    onDestroy(): void {
        removeUserInfoUpdatedCallback(this.setUpUsername);
    }

    setUpUsername = (info: UserInfo) => {
        this.usernameLabel.string = info.username.toUpperCase();
    }

    update(dt: number) {
        // update dying status first
        this.isDying = this.anim.getAnimationState('MarioDead').isPlaying;

        if (this.winned || this.isDying)
            return; // playing dying animation
        
        this.updateMove(dt);
        this.updateAnime();
    }

    /**
     * Anime: visual + audio
     */
    updateAnime() {
        let rigid = this.node.getComponent(cc.RigidBody);
        let v_x = rigid.linearVelocity.x;
        let v_y = rigid.linearVelocity.y;
        switch (this.move) {
        case Movement.LEFT:
            if (!v_y) {
                if (v_x > 100) {
                    this.playAnime('MarioStop');
                    this.peekRight();
                } else if (v_x > 0) {
                    this.playAnime('MarioGoBack');
                    this.peekRight();
                } else {
                    this.playAnime('MarioRun');
                }
            }
            break;
        case Movement.RIGHT:
            if (!v_y) {
                if (v_x < -100) {
                    this.playAnime('MarioStop');
                    this.peekLeft();
                } else if (v_x < 0) {
                    this.playAnime('MarioGoBack');
                    this.peekLeft();
                } else {
                    this.playAnime('MarioRun');
                }
            }
            break;
        case Movement.UP: case Movement.UP_LEFT: case Movement.UP_RIGHT:
            this.playAnime('MarioJump', this.jumpClip);
            break;
        case Movement.STAY:
            if (v_x != 0) {
                this.playAnime('MarioStop');
            } else if (this.onGround) {
                this.playAnime('MarioIdle');
            }
            break;
        }
    }

    updateMove(dt: number) {
        let rigid = this.getComponent(cc.RigidBody);
        let v_x: number;
        switch (this.move) {
        case Movement.UP_LEFT:
            this.jump(rigid);
        case Movement.LEFT:
            if (v_x > 0) { // turning
                v_x = rigid.linearVelocity.x;
            } else { // going
                v_x = rigid.linearVelocity.x - Mario.move_run_acc * dt;
                v_x = Math.max(v_x, -Mario.move_speed);
            }
            rigid.linearVelocity = cc.v2(v_x, rigid.linearVelocity.y);
            this.peekLeft();
            break;
        case Movement.UP_RIGHT:
            this.jump(rigid);
        case Movement.RIGHT:
            if (v_x < 0) { // turning
                v_x = rigid.linearVelocity.x;
            } else {
                v_x = rigid.linearVelocity.x + Mario.move_run_acc * dt;
                v_x = Math.min(v_x, Mario.move_speed);
            }
            rigid.linearVelocity = cc.v2(v_x, rigid.linearVelocity.y);
            this.peekRight();
            break;
        case Movement.UP:
            this.jump(rigid, 0);
            break;
        case Movement.STAY:
            rigid.linearVelocity = new cc.Vec2(0, rigid.linearVelocity.y);
            break;
        }
    }

    playAnime(anim: string, clip?: cc.AudioClip) {
        let _play = (anim: string) => {
            this.animeName = anim;
            let animName = this.powerUp ? "Big" + anim : anim;
            this.anim.play(animName)
        };
        if (anim !== this.animeName && !this.anim.getAnimationState(anim).isPlaying) {
            _play(anim);
            if (clip) {
                this.playEffect(clip);
            }
        } else if (anim === 'MarioJump' && this.onGround) {
            _play(anim);
            this.playEffect(this.jumpClip);
        }
    }
    
    playEffect(clip: cc.AudioClip) {
        if (cc.audioEngine.getState(this.audioID) !== cc.audioEngine.AudioState.PLAYING) {
            this.audioID = cc.audioEngine.playEffect(clip, false);
        }
    }
    
    jump(rigid: cc.RigidBody, new_x?: number) {
        if (this.onGround) {
            rigid.linearVelocity = cc.v2(
                new_x !== undefined ? new_x : rigid.linearVelocity.x,
                Mario.jump_speed);
        }
    }

    peekLeft() {
        let username = this.usernameLabel.node
        username.scaleX = -Math.abs(username.scaleX); // Label 翻轉再翻轉，等於沒轉
        this.node.scaleX = -Math.abs(this.node.scaleX);
    }
    
    peekRight() {
        let username = this.usernameLabel.node
        username.scaleX = Math.abs(username.scaleX); // 前面 Label 翻轉過，需轉回正面 (abs)
        this.node.scaleX = Math.abs(this.node.scaleX);
    }

    playBlink() {
        let action = cc.spawn(
            cc.blink(1, 8),
            cc.flipX(true)
        );
        this.node.runAction(action);
    }

    playPowerUp() {
        if (!this.powerUp) {
            this.powerUp = true;
            let phy = this.getComponent(cc.PhysicsBoxCollider);
            phy.size.height += 4;
            phy.offset.y -= 3.5;
            this.playBlink();
            this.anim.play('BigMarioIdle')
            this.playEffect(this.powerUpClip);
        }
    }

    playPowerDown() {
        if (this.powerUp) {
            this.powerUp = false;
            let phy = this.getComponent(cc.PhysicsBoxCollider);
            phy.size.height -= 4;
            phy.offset.y += 3.5;
            this.playGolden();
            this.playEffect(this.powerDownClip);
        }
    }

    playLoseOneLife() {
        if (this.powerUp)
            this.playPowerDown();
        this.playGotHurt(() => {
            this.scheduleOnce(() => {
                this.getComponent(cc.PhysicsCollider).enabled = true;
                this.peekLeft();
                this.node.setPosition(this.init_pos);
                cc.audioEngine.playMusic(this.BGM, true);
                this.playGolden(); // golden state when reborn
            });
        });
    }

    playGolden() {
        this.playBlink();
        this.golden = true;
        this.scheduleOnce(() => {
            this.golden = false;
        }, 2);

    }

    playGotHurt(animeFinishedCallback?: () => void) {
        this.getComponent(cc.RigidBody).linearVelocity = cc.v2(0, 1000);
        this.playAnime('MarioDead');
        this.getComponent(cc.PhysicsCollider).enabled = false;
        cc.audioEngine.stopMusic();
        cc.audioEngine.stopAllEffects();
        this.playEffect(this.loseOneLifeClip);
        if (animeFinishedCallback)
            this.anim.once('finished', animeFinishedCallback);
    }

    win() {
        this.winned = true;
        this.move = Movement.STAY;
        let rigid = this.getComponent(cc.RigidBody);
        rigid.linearVelocity = cc.v2(0, 0);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
        case this.keyControl.left:
            setLeft(this);
            break;
        case this.keyControl.right:
            setRight(this);
            break;
        case this.keyControl.up:
            setUp(this);
            break;
        case this.keyControl.cameraSwitch:
            this.camera.checkoutMario(this);
            break;
        }
    }
    
    onKeyUp(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
        case this.keyControl.left:
            resetLeft(this);
            break;
        case this.keyControl.right:
            resetRight(this);
            break;
        case this.keyControl.up:
            resetUp(this);
            break;
        }
    }

    onBeginContact(
        contact: cc.PhysicsContact, 
        self: cc.PhysicsCollider, 
        other: cc.PhysicsCollider): void 
    {
        switch (other.tag) {
        case BodyType.GROUND:
            if (contact.getWorldManifold().normal.y !== -1)
                return;
            ++this.onGround;
            break;
        case BodyType.DIST_BOX:
            // forbid collision along x-axis & y-axis from button
            if (Math.abs(contact.getWorldManifold().normal.x) !== 0 ||
                contact.getWorldManifold().normal.y === 1)
            {
                contact.disabled = true;
                this.inDistBox = true;
                return;
            }
            break;
        case BodyType.DEAD_FLOOR:
            // does nothing now
            break;
        case BodyType.POWER_UP_MUSH:
            contact.disabled = true;
            this.playPowerUp();
            break;
        case BodyType.LIFE_UP_MUSH:
            contact.disabled = true;
            break;
        case BodyType.PLAYER:
            // multi player will not effect each other
            contact.disabled = true;
            break;
        case BodyType.ENEMY:
            if (contact.getWorldManifold().normal.y === -1) {
                // jump after kill enemy
                let rigid = this.getComponent(cc.RigidBody);
                rigid.linearVelocity = cc.v2(rigid.linearVelocity.x, Mario.jump_speed);
                this.playEffect(this.kickClip);
            }
            break;
        }
    }

    onPreSolve(
        contact: cc.PhysicsContact, 
        self: cc.PhysicsCollider, 
        other: cc.PhysicsCollider): void 
    {
        switch (other.tag) {
        case BodyType.DIST_BOX:
            // forbid collision along x-axis & y-axis from button
            if (Math.abs(contact.getWorldManifold().normal.x) !== 0 ||
                contact.getWorldManifold().normal.y === 1
            ) {
                contact.disabled = true;
                this.inDistBox = true;
                return;
            }
            if (contact.getWorldManifold().normal.y === -1 && !this.inDistBox) {
                ++this.onGround;
                this.inDistBox = true;
            }
            break;
        case BodyType.POWER_UP_MUSH:
        case BodyType.LIFE_UP_MUSH:
        case BodyType.PLAYER:
        case BodyType.ENEMY:
            contact.disabled = true;
            break;
        }
    }

    onEndContact(
        contact: cc.PhysicsContact, 
        self: cc.PhysicsCollider, 
        other: cc.PhysicsCollider): void 
    {
        switch (other.tag) {
        case BodyType.GROUND:
            this.onGround = Math.max(this.onGround - 1, 0);
            break;
        case BodyType.DIST_BOX:
            this.inDistBox = false;
            this.onGround = Math.max(this.onGround - 1, 0);
            break;
        }
    }
}
