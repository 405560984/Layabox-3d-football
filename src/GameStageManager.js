//Init Laya3d engine
Laya3D.init(360, 640, true);
//Screen setting
Laya.stage.scaleMode = Laya.Stage.SCALE_NOSCALE;
Laya.stage.alignH = Laya.Stage.ALIGN_CENTER;
Laya.stage.alignV = Laya.Stage.ALIGN_MIDDLE;
Laya.stage.screenMode = Laya.Stage.SCREEN_NONE;
//Show performance stat
Laya.Stat.show();
//Load 3D Assets
var pitchRes = "res/3dAssets/pitch/pitch.ls";
var skyBox1Res = "res/3dAssets/skyBox1/skyCube.ltc";
var skyBox2Res = "res/3dAssets/skyBox2/skyCube.ltc";
var footballRes = "res/3dAssets/football/ball.lh";
Laya.loader.create([pitchRes, skyBox1Res, skyBox2Res, footballRes], Laya.Handler.create(this, on3DComplete));

//
var gamestart_scene;
var gameplay_scene;
var gamepause_scene;
var main_scene;

//
var camera;
var skyBox1;
var skyBox2;

//
var cameraPosition;
var ballPosition;

// Init Tweenjs update
Laya.timer.frameLoop(1, this, tweenUpdate);
function tweenUpdate() {
    if (settings.paused) {
        return;
    }
    TWEEN.update();
    // Add tween world update
    // Update on other scene
    if (gameplay_scene !== undefined) {
        gameplay_scene.tweenUpdate();
    }
}

// Global settings
var settings = this.settings = {
    stepFrequency: 60,
    gravity: -9.82,
    scene: 0,
    paused: true,
    tweening: false,
    maxSubSteps: 3
};

// Setup our cannon physic world
var cannonWorld = new CANNON.World();
cannonWorld.gravity.set(0, 0, settings.gravity); // m/s²
var fixedTimeStep = 1.0 / settings.stepFrequency; // seconds
var maxSubSteps = settings.maxSubSteps;

// Start the simulation loop
var lastTime;
function simloop(time) {
    requestAnimationFrame(simloop);
    if (settings.paused || settings.tweening) {
        return;
    }
    if (lastTime !== undefined) {
        var dt = (time - lastTime) / 1000;
        cannonWorld.step(fixedTimeStep, dt, maxSubSteps);
    }
    lastTime = time;

    // Add cannon world update
    if (gameplay_scene !== undefined) {
        gameplay_scene.cannonUpdate();
    }
}
simloop();

// CannonJS objects
// Create a sphere
var radius = 1; // m
var ballSphereBody = new CANNON.Body({
    mass: 5, // kg
    position: new CANNON.Vec3(0, -5, 2.16), // m
    shape: new CANNON.Sphere(radius)
});
cannonWorld.addBody(ballSphereBody);

// Create a plane
var groundBody = new CANNON.Body({
    mass: 0, // mass == 0 makes the body static
    position: new CANNON.Vec3(0, 0, 1.16)
});
var groundShape = new CANNON.Plane();
groundBody.addShape(groundShape);
cannonWorld.addBody(groundBody);

//Laya 3d
function on3DComplete() {
    console.log("on3DComplete");
    //Add Unity scene 
    main_scene = Laya.Scene.load(pitchRes);
    Laya.stage.addChild(main_scene);

    var scale = new Laya.Vector3();
    scale.x = scale.y = scale.z = 1;
    ball = Laya.loader.getRes(footballRes);
    ball.transform.localScale = scale;
    main_scene.addChild(ball);
    ballPosition = new Laya.Vector3(0, 0, 0);
    ball.transform.position = ballPosition;

    //Create camera
    camera = new Laya.Camera(0, 0.1, 1000);
    camera.clearFlag = Laya.BaseCamera.CLEARFLAG_SKY;
    //Add camera to scene
    main_scene.addChild(camera);

    //Direction Light
    var directionLight = new Laya.DirectionLight();
    directionLight.ambientColor = new Laya.Vector3(0.6, 0.6, 0.6);
    directionLight.specularColor = new Laya.Vector3(0.6, 0.6, 0.6);
    directionLight.diffuseColor = new Laya.Vector3(2, 2, 2);
    directionLight.direction = new Laya.Vector3(1, -1, 0);
    main_scene.addChild(directionLight);

    skyBox1 = new Laya.SkyBox();
    skyBox1.textureCube = Laya.TextureCube.load(skyBox1Res);

    skyBox2 = new Laya.SkyBox();
    skyBox2.textureCube = Laya.TextureCube.load(skyBox2Res);

    //Add 2d resources form ..laya/pages
    Laya.loader.load("res/atlas/comp.atlas", Laya.Handler.create(null, showGameStart), null, Laya.Loader.ATLAS);
}

function resetSkybox() {
    var random = Math.round(Math.random());
    console.log("random" + random);
    if (random == 0) {
        camera.sky = skyBox1;
    } else {
        camera.sky = skyBox2;
    }
}

function resetPosition() {
    //Reset ball position
    ballPosition = new Laya.Vector3(0, 2.16, -5);
    ball.transform.position = ballPosition;
    ballSphereBody.position = new CANNON.Vec3(ballPosition.x, ballPosition.z, ballPosition.y);
    //Set camera position and rotate
    cameraPosition = new Laya.Vector3(3, 20, 25);
    camera.transform.position = cameraPosition;
    camera.transform.lookAt(ballPosition, new Laya.Vector3(0, 180, 0), false);
}

function showGameStart() {
    resetPosition();
    resetSkybox();
    if (gamestart_scene == undefined) {
        gamestart_scene = new GameStartScene();
        gamestart_scene.startBtn.on(Laya.Event.CLICK, gamestart_scene, function () {

            this.removeSelf();
            showGamePlay();
        })
    }
    Laya.stage.addChild(gamestart_scene);

}

function showGamePlay() {
    resetPosition();
    if (gameplay_scene == undefined) {
        gameplay_scene = new GamePlayScene();
        gameplay_scene.pauseBtn.visible = false;
        gameplay_scene.pauseBtn.on(Laya.Event.CLICK, gameplay_scene, function () {
            this.removeSelf();
            gameplay_scene.pause();
        })
    }
    Laya.stage.addChild(gameplay_scene);
    gameplay_scene.restart();
}

function showGamePause() {
    if (gamepause_scene == undefined) {
        gamepause_scene = new GamePauseScene();
        gamepause_scene.exitBtn.on(Laya.Event.CLICK, gamepause_scene, function () {
            this.removeSelf();
            if (gameplay_scene !== undefined) {
                gameplay_scene.removeSelf();
            }
            showGameStart();
        })
        gamepause_scene.restartBtn.on(Laya.Event.CLICK, gamepause_scene, function () {
            this.removeSelf();
            if (gamestart_scene !== undefined) {
                gamestart_scene.removeSelf();
            }
            showGamePlay();
        })
    }
    Laya.stage.addChild(gamepause_scene);
}