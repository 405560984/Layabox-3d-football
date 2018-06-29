CLASS$(function () {
    this.__super.call(this);
    Laya.stage.on(Laya.Event.MOUSE_DOWN, this, onMouseDown);
    Laya.stage.on(Laya.Event.MOUSE_UP, this, onMouseUp);
}, 'GamePlayScene', ui.GamePlaySceneUI);

var gameReady = false;
var ballFlying = false;

var score = 0;
var lostCount = 0;

var touchBeginPoint = new Laya.Vector2();
var touchEndPoint = new Laya.Vector2();
function onMouseDown() {
    touchBeginPoint.elements[0] = Laya.stage.mouseX;
    touchBeginPoint.elements[1] = Laya.stage.mouseY;
}

function onMouseUp() {
    if (!gameReady || settings.tweening || Laya.stage.mouseY < this.pauseBtn.y + this.pauseBtn.height) {
        return;
    }
    touchEndPoint.elements[0] = Laya.stage.mouseX;
    touchEndPoint.elements[1] = Laya.stage.mouseY;

    var point = new laya.maths.Point(touchBeginPoint.elements[0], touchBeginPoint.elements[1]);
    var distance = point.distance(touchEndPoint.elements[0], touchEndPoint.elements[1]);
    shootBall(distance);
}

function shootBall(distance) {
    var h = distance / 30;
    if (touchEndPoint.elements[0] - touchBeginPoint.elements[0] > 0) {
        h = -1 * h;
    }

    var v = 2.16 + Math.abs(touchEndPoint.elements[1] - touchBeginPoint.elements[1]) / 60;
    var relativeTween = new TWEEN.Tween(ballPosition)
        .to({ x: h, y: v, z: 15 }, 500)
        .onUpdate(function (object) {
            ballFlying = true;
            settings.tweening = true;
        })
        .onComplete(function () {
            ballFlying = false;
            settings.tweening = false;
            ballSphereBody.position = new CANNON.Vec3(ballPosition.x, ballPosition.z, ballPosition.y);
            checkHitTarget();
        });
    relativeTween.start();
}

function resetBall() {
    var relativeTween = new TWEEN.Tween(ballPosition)
        .to({ x: 0, y: 2.16, z: -5 }, 1000)
        .onUpdate(function (object) {
            settings.tweening = true;
        })
        .onComplete(function () {
            settings.tweening = false;
            ballSphereBody.position = new CANNON.Vec3(ballPosition.x, ballPosition.z, ballPosition.y);
        });
    relativeTween.start();
}

function setCamaraPosition() {
    var relativeTween = new TWEEN.Tween(cameraPosition)
        .to({ x: 0, y: 5.5, z: -12 }, 2000)
        .onUpdate(function (object) {
            settings.tweening = true;
        })
        .onComplete(function () {
            settings.tweening = false;
            gameReady = true;
            gameplay_scene.pauseBtn.visible = true;
            scoreTxt.visible = true;
            scoreTxt.text = score.toString();
        });
    relativeTween.start();
}

function checkHitTarget() {
    //TODO target
    score++;
    scoreTxt.text = score.toString();

    lostCount++;
    switch (lostCount) {
        case 1:
            gameplay_scene.ballImage1.visible = true;
            gameplay_scene.ballImage2.visible = true;
            gameplay_scene.ballImage3.visible = false;
            break;
        case 2:
            gameplay_scene.ballImage1.visible = true;
            gameplay_scene.ballImage3.visible = false;
            gameplay_scene.ballImage2.visible = false;
            break;
        case 3:
            gameplay_scene.ballImage1.visible = false;
            gameplay_scene.ballImage2.visible = false;
            gameplay_scene.ballImage3.visible = false;
            break;
        default:
    }

    if (lostCount == 3) {
        Laya.timer.once(2000, this, resetGame);
    }
}

function resetGame() {
    score = 0;
    scoreTxt.text = score.toString();
    lostCount = 0;
    gameplay_scene.ballImage1.visible = true;
    gameplay_scene.ballImage2.visible = true;
    gameplay_scene.ballImage3.visible = true;
}

GamePlayScene.prototype.start = function () {
    settings.paused = false;
    setCamaraPosition();
}

GamePlayScene.prototype.resume = function () {
    settings.paused = false;
    settings.tweening = false;
    gameReady = true;
    gameplay_scene.pauseBtn.visible = true;
    scoreTxt.visible = true;
    scoreTxt.text = score.toString();
}

GamePlayScene.prototype.pause = function () {
    //console.log("pause");
    showGamePause();
    settings.paused = true;
    gameReady = false;
}

GamePlayScene.prototype.tweenUpdate = function () {
    if (!gameReady) {
        camera.transform.position = cameraPosition;
        camera.transform.lookAt(ballPosition, new Laya.Vector3(0, 180, 0), false);
    }
    else {
        ball.transform.position = ballPosition;
        if (ballFlying) {
            var _rotate = new Laya.Vector3(20, 0, 0);
            ball.transform.rotate(_rotate, false, false);
        }
    }
}

GamePlayScene.prototype.cannonUpdate = function () {
    ballPosition = new Laya.Vector3(ballSphereBody.position.x, ballSphereBody.position.z, ballSphereBody.position.y);
    if (ballPosition.y <= 2.16 && ballPosition.z == 15) {
        settings.tweening = true;
        Laya.timer.once(500, this, resetBall);
    }
}