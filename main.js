$(document).ready(function () {
    // 加载项目列表
    loadProjects();
    let nowCharacter = null;
    let pixiapp = null;
    let gl = null;
    // 在spine的各个相关函数之间传递数据
    let spineVariable = {};

    // 关闭抽屉按钮点击事件
    $("#closeSidebar").click(function () {
        $("#live2dSelector").css({"display": "none"})
        $("#spineSelector").css({"display": "none"})
        $("#sidebar").removeClass("show");
    });

    function loadProjects() {
        // 遍历资源数据
        for (const game in resourceData) {
            const gameName = resourceData[game]["gameName"];
            $("#gameList").append(`<h2>${gameName}</h2>`);
            $("#gameList").append("<hr>");

            const characters = resourceData[game]["characters"];
            const avatarInfo = resourceData[game]["avatar"];
            const nameMap = resourceData[game]["nameMap"];
            const characterContainer = $("<div class='character-container'></div>");
            characters.forEach(character => {
                const imagePath = `./resource/${game}/avatars/${character}.png`;
                const characterBox = $("<div class='character-box'></div>");
                const image = $(`<img src="${imagePath}" alt="${character}">`);
                const name = $(`<p>${nameMap[character]}</p>`);
                characterBox.css({
                    "width": avatarInfo["width"] + 20
                })

                characterBox.append(image);
                characterBox.append(name);
                characterContainer.append(characterBox);

                image.click(function () {
                    nowCharacter = {
                        "character": character,
                        "game": game
                    };
                    $("#sidebar").addClass("show");
                    const game_data = resourceData[game];
                    if (game_data["model"]["engine"] === "live2d") {
                        $("#live2dSelector").css({"display": "block"});
                        showLive2dModel();
                    }
                    if (game_data["model"]["engine"] === "spine") {
                        $("#spineSelector").css({"display": "block"});
                        showSpineModel();
                    }
                });
                $("#gameList").append(characterContainer);
            })
        }
    }

    function getLive2dModelSetting() {
        const game = nowCharacter["game"];
        const character = nowCharacter["character"];
        const gameSetting = resourceData[game]["model"];
        const modelSetting = {
            "idleMotionGroup": gameSetting["idleMotionGroup"],
            "modelHiddenParts": gameSetting["modelHiddenParts"] ?? [],
            "useBackgroundModel": gameSetting["useBackgroundModel"] ?? false,
            // useBackgroundModel为true时必填
            "backgroundMotionGroup": gameSetting["backgroundMotionGroup"] ?? null,
            "backgroundModelHiddenParts": gameSetting["backgroundModelHiddenParts"] ?? [],
        };

        // 用角色单独的设置覆盖全局设置
        const special = resourceData[game]["special"] ?? {};
        if (!(character in special)) return modelSetting
        const specialSetting = resourceData[game]["special"][character];
        Object.entries(specialSetting).forEach(([key, value]) => {
            modelSetting[key] = value
        });
        return modelSetting
    }

    async function showLive2dModel() {
        // 暂时没有发现有需要清理gl的地方，不编写对应函数
        // clearSpineModel();

        // jQuery选择器返回的是一个jQuery对象，而不是原生的DOM元素。而PIXI.Application的view参数需要的是原生的HTMLCanvasElement。
        // const canvas = $("#modelCanvas");
        const canvas = document.getElementById("modelCanvas");
        if (!pixiapp) {
            pixiapp = new PIXI.Application({
                view: canvas,
                autoStart: true,
                resizeTo: canvas,
            });
            pixiapp.renderer.backgroundColor = 0xf8f9fa;
        }
        pixiapp.stage.removeChildren();

        const game = nowCharacter["game"];
        const character = nowCharacter["character"];
        const modelFile = `./resource/${game}/models/${character}/model.model3.json`;
        const modelSetting = getLive2dModelSetting();
        const live2dModel = await PIXI.live2d.Live2DModel.from(modelFile, { idleMotionGroup: modelSetting["idleMotionGroup"], autoInteract: true });
        const internalModel = live2dModel.internalModel;

        // 这里也许需要一项setting来应对那些使用默认鼠标追踪参数的模型。到时候不重写updateFocus函数即可。
        internalModel.updateFocus = function () {
            internalModel.coreModel.addParameterValueById("EyeTracking_ParamAngleX", internalModel.focusController.x  * 30);
            internalModel.coreModel.addParameterValueById("EyeTracking_ParamAngleY", internalModel.focusController.y  * 30);
            internalModel.coreModel.addParameterValueById("EyeTracking_ParamEyeBallX", internalModel.focusController.x);
            internalModel.coreModel.addParameterValueById("EyeTracking_ParamEyeBallY", internalModel.focusController.y);
        };
        const hiddenParts = modelSetting["modelHiddenParts"];
        for (const part of hiddenParts) {
            internalModel.coreModel.setPartOpacityById(part, 0)
        }

        // 关闭呼吸
        internalModel.updateNaturalMovements = function () {}

        // 这里也许以后需要一项setting来获取这个0.5
        const scale = pixiapp.view.width / internalModel.width * 0.5;
        live2dModel.anchor.set(0.5, 0);
        live2dModel.x = pixiapp.screen.width / 2;
        live2dModel.scale.set(scale);

        if (modelSetting["useBackgroundModel"]) {
            // 不要用lodash的cloneDeep，会把硬盘IO占满
            const backModel = await PIXI.live2d.Live2DModel.from(modelFile, { idleMotionGroup: modelSetting["backgroundMotionGroup"]});
            const backgroundHiddenParts = modelSetting["backgroundModelHiddenParts"];
            for (const part of backgroundHiddenParts) {
                backModel.internalModel.coreModel.setPartOpacityById(part, 0)
            }

            backModel.anchor.set(0.5, 0);
            backModel.x = pixiapp.screen.width / 2;
            backModel.scale.set(scale);

            pixiapp.stage.addChild(backModel);
        }
        pixiapp.stage.addChild(live2dModel);

        const live2dMotionList = $("#live2dMotionList");
        live2dMotionList.empty();
        // forEach没有continue
        for (const motionGroup of Object.keys(internalModel.motionManager.motionGroups)) {
            if (motionGroup === modelSetting["backgroundMotionGroup"]) continue
            const option = $("<option></option>");
            option.attr("value", motionGroup).text(motionGroup);
            if (motionGroup === modelSetting["idleMotionGroup"]) option.attr("selected", "selected");
            live2dMotionList.append(option);
        }
        live2dMotionList.change(async (event) => {
            const motionGroup = event.target.value;
            live2dModel.motion(motionGroup);
        })
    }

    function clearLive2dModel() {
        if (pixiapp) {
            // fixme 目前这里无法清除WebGL contexts，来回切换会有告警：Too many active WebGL contexts.
            // 销毁所有子元素、渲染器、并解绑事件
            pixiapp.destroy({
                children: true,   // 销毁所有显示对象
                texture: true,    // 销毁基础纹理
                baseTexture: true
                //removeView: false 这个选项不能阻止删除canvas
            });
            const canvasDiv = document.getElementById("sidebar");
            canvasDiv.innerHTML = "<canvas id=\"modelCanvas\"></canvas>";
            pixiapp = null;       // 清除引用
        }
    }

    function getSpineModelSetting() {
        const game = nowCharacter["game"];
        const gameSetting = resourceData[game]["model"];
        const modelSetting = {
            "initialAnimation": gameSetting["initialAnimation"],
            "premultipliedAlpha": gameSetting["premultipliedAlpha"] ?? true
        };

        return modelSetting
    }

    function showSpineModel() {
        clearLive2dModel();
        const lastFrameTime = Date.now() / 1000;
        const canvas = document.getElementById("modelCanvas");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const webglConfig = {alpha: false};
        gl = canvas.getContext("webgl", webglConfig) || canvas.getContext("experimental-webgl", webglConfig);
        if (!gl) {
            alert("WebGL is unavailable.");
            return;
        }

        // Create a simple shader, mesh, model-view-projection matrix and SkeletonRenderer.
        let shader = spine.webgl.Shader.newTwoColoredTextured(gl);
        let batcher = new spine.webgl.PolygonBatcher(gl);
        let mvp = new spine.webgl.Matrix4();
        mvp.ortho2d(0, 0, canvas.width - 1, canvas.height - 1);
        let skeletonRenderer = new spine.webgl.SkeletonRenderer(gl);
        let assetManager = new spine.webgl.AssetManager(gl);

        const game = nowCharacter["game"];
        const character = nowCharacter["character"];
        const modelDir = `./resource/${game}/models/${character}`;
        // Tell AssetManager to load the resources for each model, including the exported .json file, the .atlas file and the .png
        // file for the atlas. We then wait until all resources are loaded in the load() method.
        assetManager.loadTextureAtlas(`${modelDir}/${character}.atlas`);
        assetManager.loadText(`${modelDir}/${character}.json`);

        spineVariable["assetManager"] = assetManager;
        spineVariable["batcher"] = batcher;
        spineVariable["canvas"] = canvas;
        spineVariable["lastFrameTime"] = lastFrameTime;
        spineVariable["mvp"] = mvp;
        spineVariable["shader"] = shader;
        spineVariable["skeletonRenderer"] = skeletonRenderer;

        requestAnimationFrame(loadSpineModel);
    }

    function loadSpineModel() {
        const assetManager = spineVariable["assetManager"];
        const modelSetting = getSpineModelSetting();
        // Wait until the AssetManager has loaded all resources, then load the skeletons.
        if (assetManager.isLoadingComplete()) {
            const skeleton = loadSpineSkeleton(modelSetting["initialAnimation"], modelSetting["premultipliedAlpha"]);
            spineVariable["skeleton"] = skeleton;
            setupSpineUI();
            requestAnimationFrame(renderSpine);
        } else {
            requestAnimationFrame(loadSpineModel);
        }
    }

    // 原始代码接受skin参数，这里去掉，需要加上时参考原始代码
    function loadSpineSkeleton(initialAnimation, premultipliedAlpha) {
        const assetManager = spineVariable["assetManager"];

        // Load the texture atlas using name.atlas from the AssetManager.
        const game = nowCharacter["game"];
        const character = nowCharacter["character"];
        const modelDir = `./resource/${game}/models/${character}`;
        const atlas = assetManager.get(`${modelDir}/${character}.atlas`);

        // Create a AtlasAttachmentLoader that resolves region, mesh, boundingbox and path attachments
        let atlasLoader = new spine.AtlasAttachmentLoader(atlas);

        // Create a SkeletonJson instance for parsing the .json file.
        let skeletonJson = new spine.SkeletonJson(atlasLoader);

        // Set the scale to apply during parsing, parse the file, and create a new skeleton.
        const json_ = assetManager.get(`${modelDir}/${character}.json`);
        const skeletonData = skeletonJson.readSkeletonData(json_);
        let skeleton = new spine.Skeleton(skeletonData);
        const bounds = calculateSpineBounds(skeleton);

        // Create an AnimationState, and set the initial animation in looping mode.
        let animationStateData = new spine.AnimationStateData(skeleton.data);
        let animationState = new spine.AnimationState(animationStateData);
        animationState.setAnimation(0, initialAnimation, true);

        // Pack everything up and return to caller.
        return {skeleton: skeleton, state: animationState, bounds: bounds, premultipliedAlpha: premultipliedAlpha};
    }

    function calculateSpineBounds(skeleton) {
        skeleton.setToSetupPose();
        skeleton.updateWorldTransform();
        let offset = new spine.Vector2();
        let size = new spine.Vector2();
        skeleton.getBounds(offset, size, []);
        return {offset: offset, size: size};
    }

    function setupSpineUI() {
        const setupAnimationUI = function () {
            const spineAnimationList = $("#spineAnimationList");
            spineAnimationList.empty();
            const skeleton = spineVariable["skeleton"].skeleton;
            const state = spineVariable["skeleton"].state;
            const activeAnimation = state.tracks[0].animation.name;
            for (let i = 0; i < skeleton.data.animations.length; i++) {
                const animationName = skeleton.data.animations[i].name;
                const option = $("<option></option>");
                option.attr("value", animationName).text(animationName);
                if (animationName === activeAnimation) option.attr("selected", "selected");
                spineAnimationList.append(option);
            }
            spineAnimationList.change(function () {
                let animationName = $("#spineAnimationList option:selected").text();
                skeleton.setToSetupPose();
                state.setAnimation(0, animationName, true);
            })
        }
        // 单独设置函数并调用是为了保留设置skin的可能，参见原始代码
        setupAnimationUI();
    }

    function renderSpine() {
        const now = Date.now() / 1000;
        const delta = now - spineVariable["lastFrameTime"];
        spineVariable["lastFrameTime"] = now;

        // Update the MVP matrix to adjust for canvas size changes
        resizeSpine();

        gl.clearColor(0.973, 0.976, 0.98, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Apply the animation state based on the delta time.
        const state = spineVariable["skeleton"].state;
        const skeleton = spineVariable["skeleton"].skeleton;
        const premultipliedAlpha = spineVariable["skeleton"].premultipliedAlpha;
        state.update(delta);
        state.apply(skeleton);
        skeleton.updateWorldTransform();

        // Bind the shader and set the texture and model-view-projection matrix.
        const shader = spineVariable["shader"];
        const mvp = spineVariable["mvp"];
        shader.bind();
        shader.setUniformi(spine.webgl.Shader.SAMPLER, 0);
        shader.setUniform4x4f(spine.webgl.Shader.MVP_MATRIX, mvp.values);

        // Start the batch and tell the SkeletonRenderer to render the active skeleton.
        const batcher = spineVariable["batcher"];
        batcher.begin(shader);

        const skeletonRenderer = spineVariable["skeletonRenderer"];
        skeletonRenderer.vertexEffect = null;
        skeletonRenderer.premultipliedAlpha = premultipliedAlpha;
        skeletonRenderer.draw(batcher, skeleton);
        batcher.end();

        shader.unbind();

        requestAnimationFrame(renderSpine);
    }

    function resizeSpine() {
        const canvas = spineVariable["canvas"];
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const bounds = spineVariable["skeleton"].bounds;
        if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
        }

        // magic
        const centerX = bounds.offset.x + bounds.size.x / 2;
        const centerY = bounds.offset.y + bounds.size.y / 2;
        const scaleX = bounds.size.x / canvas.width;
        const scaleY = bounds.size.y / canvas.height;
        let scale = Math.max(scaleX, scaleY) * 1.2;
        if (scale < 1) scale = 1;
        const width = canvas.width * scale;
        const height = canvas.height * scale;
        spineVariable["mvp"].ortho2d(centerX - width / 2, centerY - height / 2, width, height);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }

});