// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { BodyType } from "../Function/BodyType";
import { KeyControl, email2uid, getDefaultUserInfo, updateRankList, updateUserInfo, userInfo } from "../Function/types";
import Mario from "./Mario";
import PauseResumer from "./PauseResumer";
import PlayerCamera from "./PlayerCamera";

const {ccclass, property} = cc._decorator;

enum QuestionBoxType {
    COIN, POWER, HEAL
}

type PlayingMode = 'None' | 'Single' | 'LocalMultiple' | 'RemoteMultiple';

@ccclass
export default class StageMgr extends cc.Component {
    
    static readonly initTimerValue = 300;
    static readonly scoreStrLength = 6;
    static readonly mushroomSpeed = 150;
    static readonly goombaSpeed = 100;
    static readonly turtleWalkSpeed = 70;
    static readonly turtleRotSpeed = 210;
    /**
     * Support up to four players
     */
    static readonly localPlayerKeyMap: KeyControl[] = [
        { left: cc.macro.KEY.a, right: cc.macro.KEY.d, up: cc.macro.KEY.w, cameraSwitch: cc.macro.KEY.s },
        { left: cc.macro.KEY.g, right: cc.macro.KEY.j, up: cc.macro.KEY.y, cameraSwitch: cc.macro.KEY.h },
        { left: cc.macro.KEY.l, right: cc.macro.KEY.quote, up: cc.macro.KEY.p, cameraSwitch: cc.macro.KEY[";"] },
        { left: cc.macro.KEY.left, right: cc.macro.KEY.right, up: cc.macro.KEY.up, cameraSwitch: cc.macro.KEY.down },
    ]

    static stageMarioMap: Map<number, Map<string, Mario>> = new Map();
    static stageChoice: number = -1;
    static playMode: {
        mode: PlayingMode,
        payload?: number,
    } = { mode: 'Single' }; // default as single player mode
    
    user: string;
    email: string;
    coin: any;

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

    mainMario: Mario = null;
    marioList: Map<string, Mario> = new Map();

    paused = false;
    pauseResumers: PauseResumer[] = [];
    
    @property({type: PlayerCamera})
    camera: PlayerCamera = null;

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
    turtles: cc.Node = null;
    
    @property({type: cc.Node})
    deadFloor: cc.Node = null;
    
    @property({type: cc.Node})
    flag: cc.Node = null;

    // prefabs
    @property({type: cc.Prefab})
    marioPrefab: cc.Prefab = null;

    @property({type: cc.Prefab})
    coinPrefab: cc.Prefab = null;

    @property({type: cc.Prefab})
    powerMushroomPrefab: cc.Prefab = null;

    @property({type: cc.Prefab})
    healMushroomPrefab: cc.Prefab = null;

    onLoad(): void {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        
        // initialize main mario
        let mapIndex = 0;
        for (mapIndex = 0; mapIndex < this.node.children.length; ++mapIndex)
            if (this.node.children[mapIndex].name === 'Map')
                break;
        
        let marioPrefab = cc.instantiate(this.marioPrefab);
        this.node.insertChild(marioPrefab, mapIndex + 1);
        cc.log(this.node.name);
        this.mainMario = marioPrefab.getComponent(Mario);
        this.mainMario.initializeMainMario(this.camera);
        this.marioList.set(this.mainMario.uid, this.mainMario);
        this.camera.checkoutMario(this.mainMario);

        // other offline mario
        switch (StageMgr.playMode.mode) {
        case 'Single':
            break;
        case 'LocalMultiple':
            for (let i = 1; i < StageMgr.playMode.payload; ++i) {
                let otherPrefab = cc.instantiate(this.marioPrefab);
                this.node.insertChild(otherPrefab, mapIndex + 1);
                let otherMario = otherPrefab.getComponent(Mario);
                otherMario.initializeTheOtherPlayerMario(
                    `player${i}`, StageMgr.localPlayerKeyMap[i], this.camera);
                this.marioList.set(otherMario.uid, otherMario);
            }
            break;
        case 'RemoteMultiple':
            alert('Not support yet :(');
            break;
        }
    }
    
    start() {
        // initialize game index
        if (userInfo.info) {
            this.coinNum = userInfo.info.coin;
            this.score = userInfo.info.score;
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
                this.loseOneLifeForCurrentMario(
                    otherCollider.node.getComponent(Mario), true);
            }
        }
        this.flag.getComponent(cc.RigidBody).onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (otherCollider.node.name === 'Mario') {
                let mario = otherCollider.node.getComponent(Mario);
                mario.win();
                // all marios wins -> win the whole game
                if (Array.from(this.marioList.values()).every(m => m.winned))
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
        
        for (let turtle of this.turtles.getComponentsInChildren(cc.Component))
            this.setUpTurtle(turtle);
        
        this.pauseResumers = this.node.getComponentsInChildren(PauseResumer);
    }

    update(dt: number) {
        if (this.winned || this.paused)
            return;
        
        this.lifeNumLabel.string = this.life.toString();
        this.coinNumLabel.string = this.coinNum.toString();

        let scoreStr = this.score.toString();
        this.scoreLabel.string = '0'.repeat(
            StageMgr.scoreStrLength - scoreStr.length) + scoreStr;
            
        this.timer -= dt;
        this.timerNumLabel.string = Math.ceil(this.timer).toString();
        if (this.timer <= 0) {
            this.resetTimeInInMode('None');
            for (let m of Array.from(this.marioList.values()))
                this.loseOneLifeForCurrentMario(m, true);
        }
    }

    pauseOrResume() {
        this.paused = !this.paused;
        this.pauseResumers.forEach(pr => pr.pauseOrResume());
    }

    restart() {
        cc.audioEngine.stopAll();
        this.scheduleOnce(() => {
            cc.director.loadScene('LoadStage');
        })
    }

    volumeUp() {
        let curVol = cc.audioEngine.getMusicVolume();
        curVol = Math.min(curVol + 0.1, 1);
        cc.audioEngine.setMusicVolume(curVol);
        cc.audioEngine.setEffectsVolume(curVol);
    }

    volumeDown() {
        let curVol = cc.audioEngine.getMusicVolume();
        curVol = Math.max(curVol - 0.1, 0);
        cc.audioEngine.setMusicVolume(curVol);
        cc.audioEngine.setEffectsVolume(curVol);
    }

    onKeyDown(event: cc.Event.EventKeyboard) {
        for (let m of Array.from(this.marioList.values()))
            m.onKeyDown(event);
    }
        
    onKeyUp(event: cc.Event.EventKeyboard) {
        for (let m of Array.from(this.marioList.values()))
            m.onKeyUp(event);
    }

    playEffect(clip: cc.AudioClip) {
        this.audioID = cc.audioEngine.playEffect(clip, false);
    }

    resetTimeInInMode(mode: PlayingMode) {
        switch (mode) {
        case 'None': // all mode
            this.timer = StageMgr.initTimerValue;
            break;
        default: // 
            if (StageMgr.playMode.mode == mode)
                this.timer = StageMgr.initTimerValue;
            break;
        }
    }

    loseOneLifeForCurrentMario(mario: Mario, forceDead: boolean) {
        if (mario.isDying || mario.golden)
            return;
        if (!forceDead && mario.powerUp) {
            mario.playPowerDown();
        } else if (--this.life > 0) {
            mario.playLoseOneLife();
            this.scheduleOnce(() => {
                this.resetTimeInInMode('Single');
            }, 2);
        } else { // game over
            mario.playGotHurt(() => {
                // save data to firebase
                this.safePoint();
                this.scheduleOnce(() => {
                    StageMgr.playMode = { mode: 'None' };
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
            let mario: Mario = otherCollider.node.getComponent(Mario);
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
                this.pauseResumers.push(prefab.getComponent(PauseResumer));
                questBox.node.addChild(prefab);
                prefab.setPosition(cc.v2(5, 8));

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
                    if (otherCollider.tag == BodyType.BARRIER ||
                        otherCollider.tag == BodyType.ENEMY ||
                        !eatable || contacted)
                    {
                        contact.disabled = true;
                        return;
                    }
                    if (otherCollider.node.name !== 'Mario')
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
        
                mushroomRigid.onPreSolve = (
                    contact: cc.PhysicsContact,
                    selfCollider: cc.PhysicsCollider,
                    otherCollider: cc.PhysicsCollider) => 
                {
                    if (otherCollider.tag == BodyType.BARRIER ||
                        otherCollider.tag == BodyType.ENEMY || !eatable)
                    {
                        contact.disabled = true;
                        return;
                    }
                    if (Math.abs(mushroomRigid.linearVelocity.x) != StageMgr.mushroomSpeed &&
                        Math.abs(contact.getWorldManifold().normal.x) == 1)
                    {
                        mushroomRigid.linearVelocity = cc.v2(
                            contact.getWorldManifold().normal.x < 0 ?
                                StageMgr.mushroomSpeed : -StageMgr.mushroomSpeed,
                            mushroomRigid.linearVelocity.y
                        );
                        contact.disabled = true;
                    }
                    contact.setFriction(0);
                }
                
                itemAction = cc.sequence(
                    cc.spawn(
                        cc.moveBy(0.1, 0, 9),
                        cc.blink(1, 8)
                    ),
                    cc.callFunc(() => {
                        mushroomRigid.linearVelocity = cc.v2(-StageMgr.mushroomSpeed, 0);
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
        rigid.linearVelocity = cc.v2(-StageMgr.goombaSpeed, 0);
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
                    rigid.linearVelocity = cc.v2(0, 0);
                    isDead = true;
                    goombaAnim.once('finished', () => {
                        gb.node.active = false;
                    });
                } else {
                    this.loseOneLifeForCurrentMario(
                        otherCollider.node.getComponent(Mario), false);
                }
                break;
            case BodyType.DEAD_FLOOR:
                rigid.destroy();
                break;
            }
        }
        rigid.onPreSolve = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            if (isDead) return;
            switch (otherCollider.tag) {
            case BodyType.ENEMY:
                contact.disabled = true;
                break;
            }
            if (Math.abs(rigid.linearVelocity.x) != StageMgr.goombaSpeed &&
                Math.abs(contact.getWorldManifold().normal.x) == 1)
            {
                rigid.linearVelocity = cc.v2(
                    contact.getWorldManifold().normal.x < 0 ?
                        StageMgr.goombaSpeed : -StageMgr.goombaSpeed,
                    rigid.linearVelocity.y
                );
                contact.disabled = true;
            }
            contact.setFriction(0);
        }
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
                this.loseOneLifeForCurrentMario(
                    otherCollider.node.getComponent(Mario), false);
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
            cc.moveBy(2, cc.v2(0, 12)),
            cc.moveBy(2, cc.v2(0, 0)), // stall
            cc.moveBy(2, cc.v2(0, -12)),
            cc.moveBy(2, cc.v2(0, 0)), // stall
        ).repeatForever();
        flower.node.runAction(flowerAction);
    }

    setUpTurtle(turtle: cc.Component) {
        let rigid = turtle.getComponent(cc.RigidBody);
        rigid.linearVelocity = cc.v2(-StageMgr.turtleWalkSpeed, 0);
        let isDead = false;
        let isRotating = false;
        let kicked = false;
        let turtleSpeed = StageMgr.turtleWalkSpeed;
        rigid.onBeginContact = (
            contact: cc.PhysicsContact,
            selfCollider: cc.PhysicsCollider,
            otherCollider: cc.PhysicsCollider) => 
        {
            switch (otherCollider.tag) {
            case BodyType.PLAYER:
                if (contact.getWorldManifold().normal.y === 1 && !isDead && !isRotating) {
                    this.score += 100;
                    if (!isDead) {
                        let turtleAnim = turtle.getComponent(cc.Animation);
                        turtleAnim.play("TurtleDead");
                        isDead = true;
                        turtleSpeed = 0;
                        rigid.linearVelocity = cc.v2(0, rigid.linearVelocity.y);
                    }
                } else if (contact.getWorldManifold().normal.y !== 1 && (!isDead || isRotating)) {
                    this.loseOneLifeForCurrentMario(
                        otherCollider.node.getComponent(Mario), false);
                } else { // stall, ready to rotate
                    if (!kicked) {
                        this.score += 100;
                        kicked = true;
                    }
                    let turtleAnim = turtle.getComponent(cc.Animation);
                    turtleAnim.play("TurtleRotate");
                    isRotating = true;
                    turtleSpeed = StageMgr.turtleRotSpeed;
                    let initSpeed = turtleSpeed;
                    if (selfCollider.node.convertToWorldSpaceAR(
                            selfCollider.node.getPosition()).x
                        < otherCollider.node.convertToWorldSpaceAR(
                            otherCollider.node.getPosition()).x)
                    {
                        // turtle <-> mario
                        initSpeed = -initSpeed;
                    } // else { initSpeed = initSpeed; }
                    rigid.linearVelocity = cc.v2(initSpeed, rigid.linearVelocity.y);
                }
                contact.disabled = true;
                break;
            case BodyType.ENEMY:
                if (isRotating) {
                    otherCollider.enabled = false;
                    otherCollider.sensor = true;
                    this.score += 100;
                }
                contact.disabled = true;
                break;
            case BodyType.DEAD_FLOOR:
                rigid.destroy();
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
                return;
            }

            if (Math.abs(rigid.linearVelocity.x) != turtleSpeed &&
                Math.abs(contact.getWorldManifold().normal.x) == 1)
            {
                if (contact.getWorldManifold().normal.x < 0) {
                    rigid.linearVelocity = cc.v2(
                        turtleSpeed,
                        rigid.linearVelocity.y
                    );
                    turtle.node.setScale(cc.v2(-1, turtle.node.scaleY));
                } else {
                    rigid.linearVelocity = cc.v2(
                        -turtleSpeed,
                        rigid.linearVelocity.y
                    );
                    turtle.node.setScale(cc.v2(1, turtle.node.scaleY));
                }
                contact.disabled = true;
            }
            contact.setFriction(0);
        }
    }

    win() {
        let finalScore = Math.ceil(this.score + Math.ceil(this.timer) * 10);
        this.resScoreLabel.string = finalScore.toString();
        this.resTimerNumLabel.string = this.timerNumLabel.string;
        this.resultNode.active = true;
        this.winned = true;
        this.scheduleOnce(() => {
            this.score = finalScore;
            this.safePoint();
            cc.director.loadScene('ChooseStage');
        }, 8);
        this.mainMario.win();
        cc.audioEngine.stopAll();
        this.playEffect(this.levelClearClip);
    }

    // save to firebase
    safePoint() {
        if (!userInfo.info)
            return; // no user logged in
        firebase.auth().onAuthStateChanged((user) => {
            if (!user)
                return;
            if (this.life <= 0) { // game over
                updateUserInfo(getDefaultUserInfo(
                    userInfo.info.email,
                    userInfo.info.username,
                    this.worldNum - 1));
            } else { // win
                // upload score if has higher score rank
                if (userInfo.info.score < this.score) {
                    updateRankList({
                        uid: email2uid(userInfo.info.email), 
                        username: userInfo.info.username,
                        score: this.score
                    });
                    updateUserInfo({
                        ...userInfo.info,
                        life: this.life,
                        coin: this.coinNum,
                        score: this.score,
                        time: this.timer,
                        stage: this.worldNum,
                    });
                }
            }
        });
    }
}
