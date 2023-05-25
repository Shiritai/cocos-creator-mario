// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { BodyType } from "../Function/BodyType";
import { email2uid, getDefaultUserInfo, updateUserInfo, userInfo } from "../Function/auth";
import Mario from "./Mario";

const {ccclass, property} = cc._decorator;

enum QuestionBoxType {
    COIN, POWER, HEAL
}

@ccclass
export default class StageMgr extends cc.Component {
    
    static readonly initTimerValue = 300;
    static readonly scoreStrLength = 6;
    static readonly enemySpeed = 100;
    user: string;
    email: string;
    coin: any;

    static setUpPreSolveForEnemyWanderer(enemyRigid: cc.RigidBody, isDeadRef: { isDead: boolean }) {
        enemyRigid.linearVelocity = cc.v2(-StageMgr.enemySpeed, 0);
        enemyRigid.onPreSolve = 
        (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (isDeadRef.isDead) return;
            switch (otherCollider.tag) {
            case BodyType.ENEMY:
                contact.disabled = true;
                break;
            }
            if (Math.abs(enemyRigid.linearVelocity.x) != StageMgr.enemySpeed &&
                Math.abs(contact.getWorldManifold().normal.x) == 1)
            {
                enemyRigid.linearVelocity = cc.v2(
                    contact.getWorldManifold().normal.x < 0 ?
                        StageMgr.enemySpeed : -StageMgr.enemySpeed,
                    enemyRigid.linearVelocity.y
                );
                contact.disabled = true;
            }
            contact.setFriction(0);
        }
    }
    
    // game index members
    coinNum: number = 0;
    score: number = 0;
    /**
     * All players share the same life number
     * Should not manually decrease this
     */
    life = 5;
    timer: number = StageMgr.initTimerValue;
    
    // other members
    winned = false;
    audioID: number;
    marioList: Mario[] = []

    @property
    worldNum: number = 1;

    @property({type: cc.Label})
    worldNumLabel: cc.Label = null;

    @property({type: cc.Label})
    lifeNumLabel: cc.Label = null;

    @property({type: cc.Label})
    timerNumLabel: cc.Label = null;
    
    @property({type: cc.Label})
    coinNumLabel: cc.Label = null;

    @property({type: cc.Label})
    scoreLabel: cc.Label = null;

    // final result
    @property({type: cc.Node})
    resultNode: cc.Node = null;
    
    @property({type: cc.Label})
    resTimerNumLabel: cc.Label = null;

    @property({type: cc.Label})
    resScoreLabel: cc.Label = null;
    
    // global audio clip
    @property({type: cc.AudioClip})
    coinClip: cc.AudioClip = null;

    @property({type: cc.AudioClip})
    powerClip: cc.AudioClip = null; // for question box

    @property({type: cc.AudioClip})
    levelClearClip: cc.AudioClip = null;
    
    @property({type: Mario})
    mainMario: Mario = null;
    
    @property({type: cc.Node})
    coins: cc.Node = null;
    
    @property({type: cc.Node})
    coinQuestionBoxes: cc.Node = null;
    
    @property({type: cc.Node})
    powerQuestionBoxes: cc.Node = null;
    
    @property({type: cc.Node})
    healQuestionBoxes: cc.Node = null;
    
    @property({type: cc.Node})
    goombas: cc.Node = null;
    
    @property({type: cc.Node})
    flowers: cc.Node = null;
    
    @property({type: cc.Node})
    deadFloor: cc.Node = null;
    
    @property({type: cc.Node})
    flag: cc.Node = null;

    // prefabs
    @property({type: cc.Prefab})
    coinPrefab: cc.Prefab = null;

    @property({type: cc.Prefab})
    powerMushroomPrefab: cc.Prefab = null;

    @property({type: cc.Prefab})
    healMushroomPrefab: cc.Prefab = null;

    start () {
        // initialize game index
        if (userInfo.info) {
            this.coinNum = userInfo.info.coin;
            this.score = userInfo.info.coin;
            this.life = userInfo.info.life;
            this.timer = userInfo.info.time;
        } else {
            this.coinNum = 0;
            this.score = 0;
            this.life = 5;
            this.timer = StageMgr.initTimerValue;
        }
        // initialize other members
        this.worldNumLabel.string = this.worldNum.toString();
        this.resultNode.active = false;
        // assign callback for fixed objects/prefabs
        this.deadFloor.getComponent(cc.RigidBody).onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (otherCollider.node.name === 'Mario') {
                this.loseOneLifeForCurrentMario(true);
            }
        }
        this.flag.getComponent(cc.RigidBody).onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (otherCollider.node.name === 'Mario') {
                this.win();
            }
        }
        for (let coin of this.coins.getComponentsInChildren(cc.Component)) {
            let rigid = coin.getComponent(cc.RigidBody);
            rigid.onBeginContact = (
                contact: cc.PhysicsContact,
                selfCollider: cc.PhysicsCollider,
                otherCollider: cc.PhysicsCollider) => 
            {
                if (otherCollider.node.name === 'Mario') {
                    this.coinNum += 1;
                    this.score += 100;
                    this.playEffect(this.coinClip);
                    coin.scheduleOnce(() => {
                        coin.node.active = false;
                    });
                }
            }
        }

        let boxesTypePairList: [cc.Node, QuestionBoxType][] =
            [[this.coinQuestionBoxes,  QuestionBoxType.COIN],
             [this.powerQuestionBoxes, QuestionBoxType.POWER],
             [this.healQuestionBoxes,  QuestionBoxType.HEAL]];
        for (let [questBoxes, type] of boxesTypePairList)
            for (let questBox of questBoxes.getComponentsInChildren(cc.Component))
                this.setUpQuestionBox(questBox, type);
        
        for (let gb of this.goombas.getComponentsInChildren(cc.Component))
            this.setUpGoomba(gb);
        
        for (let flower of this.flowers.getComponentsInChildren(cc.Component))
            this.setUpFlower(flower);
    }

    update (dt: number) {
        if (this.winned)
            return;
        
        this.lifeNumLabel.string = this.life.toString();
        this.coinNumLabel.string = this.coinNum.toString();

        let scoreStr = this.score.toString();
        this.scoreLabel.string = '0'.repeat(
            StageMgr.scoreStrLength - scoreStr.length) + scoreStr;
            
        this.timer -= dt;
        this.timerNumLabel.string = Math.ceil(this.timer).toString();
        if (this.timer <= 0) {
            this.loseOneLifeForCurrentMario(true);
        }
        if (this.mainMario.isDying && this.life > 0) {
            this.timer = StageMgr.initTimerValue;
        }
    }

    playEffect(clip: cc.AudioClip) {
        this.audioID = cc.audioEngine.playEffect(clip, false);
    }

    loseOneLifeForCurrentMario(forceDead: boolean) {
        if (this.mainMario.isDying || this.mainMario.golden)
            return;
        if (!forceDead && this.mainMario.powerUp) {
            this.mainMario.playPowerDown();
        } else if (--this.life > 0) {
            this.mainMario.playLoseOneLife();
        } else { // game over
            this.mainMario.playGotHurt(() => {
                // save data to firebase
                this.safePoint();
                this.scheduleOnce(() => {
                    cc.director.loadScene('GameOver');
                })
            })
        }
    }

    setUpQuestionBox(questBox: cc.Component, type: QuestionBoxType) {
        let rigid = questBox.getComponent(cc.RigidBody);
        let generated = false;
        if (!rigid)
            return;
        rigid.onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (otherCollider.node.name !== 'Mario' || generated)
                return;
            let mario: Mario = otherCollider.node.getComponent('Mario');
            let qBox = questBox.node.getChildByName('QBox');
            if (!qBox.active || mario.isDying || contact.getWorldManifold().normal.y !== -1)
                return;
            // update date
            this.score += 100;
            // box play action
            let action = cc.sequence(
                cc.moveBy(0.1, 0, 5).easing(cc.easeInOut(2)),
                cc.moveBy(0.1, 0, -5).easing(cc.easeInOut(2)),
                cc.callFunc(() => {
                    qBox.active = false;
                    // rigid.enabledContactListener = false;
                })
            );
            questBox.node.runAction(action);
            // QuestionBox type specific
            generated = true;
            let prefab: cc.Node;
            let itemAction: cc.ActionInterval;
            switch (type) {
            case QuestionBoxType.COIN:
                this.playEffect(this.coinClip);
                // add coin and play coin action
                ++this.coinNum;
                prefab = cc.instantiate(this.coinPrefab);
                questBox.node.addChild(prefab);
                prefab.setPosition(cc.v2(5, 16));
                itemAction = cc.sequence(
                    cc.spawn(
                        cc.moveBy(0.4, 0, 20),
                        cc.fadeOut(0.4),
                    ),
                    cc.callFunc(() => prefab.active = false)
                );
                break;
            case QuestionBoxType.POWER:
            case QuestionBoxType.HEAL:
                this.playEffect(this.powerClip);
                prefab = cc.instantiate(
                    type == QuestionBoxType.POWER ?
                    this.powerMushroomPrefab :
                    this.healMushroomPrefab
                );
                questBox.node.addChild(prefab);
                prefab.setPosition(cc.v2(5, 5));

                // set physics collider tag
                let mushroomPhy = prefab.getComponent(cc.PhysicsCollider);
                switch (type) {
                case QuestionBoxType.POWER:
                    mushroomPhy.tag = BodyType.POWER_UP_MUSH
                    break;
                case QuestionBoxType.HEAL:
                    mushroomPhy.tag = BodyType.LIFE_UP_MUSH
                    break;
                }

                // set mushroom rigid
                let eatable = false;
                let mushroomRigid = prefab.getComponent(cc.RigidBody);
                mushroomRigid.type = cc.RigidBodyType.Kinematic;
                let contacted = false;
                mushroomRigid.onBeginContact = (
                    contact: cc.PhysicsContact,
                    selfCollider: cc.PhysicsCollider,
                    otherCollider: cc.PhysicsCollider) => 
                {
                    if (otherCollider.tag == BodyType.BARRIER || !eatable) {
                        contact.disabled = true;
                        return;
                    }
                    if (otherCollider.node.name !== 'Mario' || contacted)
                        return;
                    contacted = true;
                    mushroomRigid.linearVelocity = cc.v2(0, 0);
                    this.score += 1000;
                    if (type == QuestionBoxType.HEAL) {
                        ++this.life;
                        this.playEffect(this.coinClip);
                    }
                    prefab.destroy();
                }
                
                itemAction = cc.sequence(
                    cc.spawn(
                        cc.moveBy(0.1, 0, 12),
                        cc.blink(1, 8)
                    ),
                    cc.callFunc(() => {
                        mushroomRigid.linearVelocity = cc.v2(-150, 0);
                        mushroomRigid.type = cc.RigidBodyType.Dynamic;
                        eatable = true;
                    })
                );
                break;
            }
            prefab.runAction(itemAction);
        }
    }

    setUpGoomba(gb: cc.Component) {
        let rigid = gb.getComponent(cc.RigidBody);
        rigid.linearVelocity = cc.v2(-StageMgr.enemySpeed, 0);
        let isDead = false;
        rigid.onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (isDead) return;
            switch (otherCollider.tag) {
            case BodyType.PLAYER:
                if (contact.getWorldManifold().normal.y === 1) {
                    this.score += 100;
                    let goombaAnim = gb.getComponent(cc.Animation);
                    goombaAnim.play("GoombaDead");
                    isDead = true;
                    goombaAnim.once('finished', () => {
                        gb.node.active = false;
                    });
                } else {
                    this.loseOneLifeForCurrentMario(false);
                }
                break;
            case BodyType.DEAD_FLOOR:
                rigid.destroy();
                break;
            }
        }
        StageMgr.setUpPreSolveForEnemyWanderer(rigid, { isDead: isDead });
        // rigid.onPreSolve = 
        // (
        //     contact: cc.PhysicsContact,
        //     selfCollider: cc.PhysicsCollider,
        //     otherCollider: cc.PhysicsCollider) => 
        // {
        //     if (isDead) return;
        //     switch (otherCollider.tag) {
        //     case BodyType.ENEMY:
        //         contact.disabled = true;
        //         break;
        //     }
        //     if (Math.abs(rigid.linearVelocity.x) != StageMgr.enemySpeed &&
        //         Math.abs(contact.getWorldManifold().normal.x) == 1)
        //     {
        //         rigid.linearVelocity = cc.v2(
        //             contact.getWorldManifold().normal.x < 0 ?
        //                 StageMgr.enemySpeed : -StageMgr.enemySpeed,
        //             rigid.linearVelocity.y
        //         );
        //         contact.disabled = true;
        //     }
        //     contact.setFriction(0);
        // }
    }

    setUpFlower(flower: cc.Component) {
        let rigid = flower.getComponent(cc.RigidBody);
        rigid.onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            switch (otherCollider.tag) {
            case BodyType.PLAYER:
                this.loseOneLifeForCurrentMario(false);
                break;
            }
        }
        rigid.onPreSolve = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            switch (otherCollider.tag) {
            case BodyType.ENEMY:
                contact.disabled = true;
                break;
            }
        }
        let flowerAction = cc.sequence(
            cc.moveBy(2, cc.v2(0, 16)),
            cc.moveBy(2, cc.v2(0, 0)), // stall
            cc.moveBy(2, cc.v2(0, -16)),
            cc.moveBy(2, cc.v2(0, 0)), // stall
        ).repeatForever();
        flower.node.runAction(flowerAction);
    }

    win() {
        let finalScore = Math.ceil(this.score +
            Math.ceil(this.timer) * 10).toString();
        this.resScoreLabel.string = finalScore;
        this.resTimerNumLabel.string = this.timerNumLabel.string;
        this.resultNode.active = true;
        this.winned = true;
        this.scheduleOnce(() => {
            cc.director.loadScene('ChooseStage');
        }, 8);
        this.mainMario.win();
        cc.audioEngine.stopAll();
        this.playEffect(this.levelClearClip);
        this.safePoint();
    }

    // save to firebase
    safePoint() {
        if (!userInfo.info)
            return; // no user logged in
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                if (this.life <= 0) { // game over
                    updateUserInfo(getDefaultUserInfo(
                        userInfo.info.email, userInfo.info.username));
                } else { // win
                    updateUserInfo({
                        ...userInfo.info,
                        life: this.life,
                        coin: this.coinNum,
                        score: this.score,
                        time: this.timer
                    });
                    // upload score
                    firebase.database()
                        .ref(`scores/${email2uid(userInfo.info.email)}`)
                        .update({ score: this.score });
                }
            }
        });
    }
}
