// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { RankItem, UserInfo, addRankListUpdatedCallback, addUserInfoUpdatedCallback, rankList, removeRankListUpdatedCallback, removeUserInfoUpdatedCallback, userInfo } from "../Function/auth";

const {ccclass, property} = cc._decorator;

@ccclass
export default class ChooseStage extends cc.Component {

    static stageChoice: number;
    static isMultiPlayerChoice: boolean = false;
    static readonly sceneName = "LoadStage";
    
    @property(cc.AudioClip)
    BGM: cc.AudioClip = null;

    @property(cc.Node)
    howToPlay: cc.Node = null;

    @property(cc.Node)
    rankList: cc.Node = null;

    @property(cc.Layout)
    countList: cc.Layout = null;

    @property(cc.Layout)
    usernameList: cc.Layout = null;

    @property(cc.Layout)
    scoreList: cc.Layout = null;

    @property(cc.Prefab)
    rankCountPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    rankNamePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    rankScorePrefab: cc.Prefab = null;

    @property(cc.Label)
    username: cc.Label = null;

    @property(cc.Label)
    score: cc.Label = null;

    @property(cc.Label)
    coin: cc.Label = null;

    @property(cc.Label)
    stage: cc.Label = null;

    start(): void {
        cc.audioEngine.playMusic(this.BGM, true);
        if (userInfo.info) {
            this.setUpLabel(userInfo.info);
        }
        addUserInfoUpdatedCallback(this.setUpLabel);
        if (rankList.list) {
            this.setUpRankList(rankList.list);
        }
        addRankListUpdatedCallback(this.setUpRankList);
    }

    setUpLabel = (newUser: UserInfo) => {
        this.scheduleOnce(() => {
            this.username.string = newUser.username.toUpperCase();
            this.score.string = newUser.score.toString();
            this.coin.string = newUser.coin.toString();
            this.stage.string = (newUser.stage + 1).toString();
        });
    }

    setUpRankList = (newList: RankItem[]) => {
        this.scheduleOnce(() => {
            this.countList.node.removeAllChildren();
            this.usernameList.node.removeAllChildren();
            this.scoreList.node.removeAllChildren();

            for (let i = 0; i < Math.min(5, newList.length); ++i) {
                let count = cc.instantiate(this.rankCountPrefab);
                count.getComponent(cc.Label).string = (i + 1).toString();
                this.countList.node.addChild(count);
    
                let name = cc.instantiate(this.rankNamePrefab);
                name.getComponent(cc.Label).string = newList[i].username.toUpperCase();
                this.usernameList.node.addChild(name);
    
                let score = cc.instantiate(this.rankScorePrefab);
                score.getComponent(cc.Label).string = newList[i].score.toString();
                this.scoreList.node.addChild(score);
            }
        });
    }

    onDestroy(): void {
        removeUserInfoUpdatedCallback(this.setUpLabel);
        removeRankListUpdatedCallback(this.setUpRankList);
    }
    
    openHowToPlay() {
        this.rankList.active = false;
        this.howToPlay.active = !this.howToPlay.active;
    }
    
    openRankList() {
        this.howToPlay.active = false;
        this.rankList.active = !this.rankList.active;
    }

    loadStage(_: cc.Event, stageCount: number) {
        if (!userInfo.info) {
            alert(`You haven\'t signed in, but you can try stage ${stageCount} :)`);
            ChooseStage.stageChoice = stageCount;
            cc.director.loadScene(ChooseStage.sceneName);
        } else {
            let availStageCount = userInfo.info.stage + 1;
            if (availStageCount >= stageCount) {
                ChooseStage.stageChoice = stageCount;
                cc.director.loadScene(ChooseStage.sceneName);
            } else {
                alert(`You can\'t play this stage, please clear the former stage: ${availStageCount} first :)`);
            }
        }
    }
}
