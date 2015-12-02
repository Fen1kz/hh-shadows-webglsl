(function () {
    var WIDTH = 640;
    var HEIGHT = 480;
    var renderer = new PIXI.WebGLRenderer(WIDTH, HEIGHT); // Создаем PIXI рендерер

    document.addEventListener("DOMContentLoaded", function (event) { // Как только html загрузился
        document.body.appendChild(renderer.view);

        // Загружаем дополнительные файлы
        PIXI.loader
            .add('background', 'img/maze.png')
            .add('glslShadowTexture', 'glsl/smap-shadow-texture.frag')
            .once('complete', setup)
            .load();
    });

    function setup() {
        // Все готово, можно рисовать.
        var lights = []; // Лампочки
        lights[0] = new PIXI.Graphics();
        lights[0].beginFill(0xFFFF00);
        lights[0].drawCircle(0, 0, 4); // x, y, radius
        lights[1] = new PIXI.Graphics();
        lights[1].beginFill(0xFFFF00);
        lights[1].drawCircle(0, 0, 4);
        lights[1].x = 50;
        lights[1].y = 50;
        var background = new PIXI.Graphics();
        background.beginFill(0x999999);
        background.drawRect(0, 0, WIDTH, HEIGHT); // x, y, width, height

        var shadowCastImage = PIXI.Sprite.fromImage('img/maze.png'); // Отбрасывающая тень картинка с объектами (черным)

        var shadowCasters = new PIXI.Container(); // Контейнер для всех, кто отбрасывает тень
        shadowCasters.addChild(shadowCastImage); // Добавляем туда нашу картинку.

        var lightingRT = new PIXI.RenderTexture(renderer, WIDTH, HEIGHT);
        var lightingSprite = new PIXI.Sprite(lightingRT);
        var filter = createSMapFilter();
        lightingSprite.filters = [filter];

        var stage = new PIXI.Container();
        stage.addChild(background);
        stage.addChild(shadowCasters);
        stage.addChild(lightingSprite);
        stage.addChild(lights[0]);
        stage.addChild(lights[1]);

        (function animate() {
            var pointer = renderer.plugins.interaction.mouse.global;
            lights[0].x = pointer.x;
            lights[0].y = pointer.y;
            // Обновляем uniforms в шейдере
            filter.uniforms['uLightPosition[0]'].value[0] = lights[0].x;
            filter.uniforms['uLightPosition[0]'].value[1] = lights[0].y;
            filter.uniforms['uLightPosition[1]'].value[0] = lights[1].x;
            filter.uniforms['uLightPosition[1]'].value[1] = lights[1].y;

            // Рендерим контейнер с препятствиями в renderTexture в фильтре.
            filter.render(shadowCasters);

            renderer.render(stage);

            requestAnimationFrame(animate);
        })();
    }

    function createSMapFilter() {
        var CONST_LIGHTS_COUNT = 2;
        var SMapFilter = new PIXI.AbstractFilter(null, null, { // Заметьте, шейдера здесь больше нет, это фильтр "обертка"
            viewResolution: {type: '2fv', value: [WIDTH, HEIGHT]} // Передаем в фильтр размеры view
            , rtSize: {type: '2fv', value: [1024, CONST_LIGHTS_COUNT]} // Передаем размеры карты теней.
            , uAmbient: {type: '4fv', value: [.0, .0, .0, .0]} // И освещение "по дефолту" пускай будет ноль.
        });
        // Дополнительные глобалки для задания координат/цвета источников света:
        for (var i = 0; i < CONST_LIGHTS_COUNT; ++i) {
            SMapFilter.uniforms['uLightPosition[' + i + ']'] = {type: '4fv', value: [0, 0, 256, 1]};
            SMapFilter.uniforms['uLightColor[' + i + ']'] = {type: '4fv', value: [1, 1, 1, 1]};
        }

        // Создаем специальный PIXI объект, куда будет рендериться карта теней
        SMapFilter.renderTarget = new PIXI.RenderTarget(
            renderer.gl
            , SMapFilter.uniforms.rtSize.value[0]
            , SMapFilter.uniforms.rtSize.value[1]
            , PIXI.SCALE_MODES.LINEAR
            , 1);
        SMapFilter.renderTarget.transform = new PIXI.Matrix()
            .scale(SMapFilter.uniforms.rtSize.value[0] / WIDTH
                , SMapFilter.uniforms.rtSize.value[1] / HEIGHT);

        // Текстура в которую мы будем рендерить препятствия:
        SMapFilter.shadowCastersRT = new PIXI.RenderTexture(renderer, WIDTH, HEIGHT);
        SMapFilter.uniforms.uShadowCastersTexture = {
            type: 'sampler2D',
            value: SMapFilter.shadowCastersRT
        };
        // И метод для рендеринга:
        SMapFilter.render = function (group) {
            SMapFilter.shadowCastersRT.render(group, null, true);
        };

        // Тестовый шейдер, не делающий ничего;
        SMapFilter.testFilter = new PIXI.AbstractFilter(null, "precision highp float;"
            + "varying vec2 vTextureCoord;"
            + "uniform sampler2D uSampler;"
            + "void main(void) {gl_FragColor = texture2D(uSampler, vTextureCoord);}");

        // Шейдер, записывающий в renderTarget карту теней.
        var filterShadowTextureSource = PIXI.loader.resources.glslShadowTexture.data;
        // CONST_LIGHTS_COUNT должна быть известна на этапе компиляции и не может передаваться как uniform.
        filterShadowTextureSource = filterShadowTextureSource.replace(/CONST_LIGHTS_COUNT/g, CONST_LIGHTS_COUNT);

        // А также мы должны клонировать объект uniforms, этого требует WebGL (на самом деле пока что клонировать не надо, но мы же допишем второй шейдер)
        var filterShadowTextureUniforms = Object.keys(SMapFilter.uniforms).reduce(function (c, k) {
            c[k] = {
                type: SMapFilter.uniforms[k].type
                , value: SMapFilter.uniforms[k].value
            };
            return c;
        }, {});
        SMapFilter.filterShadowTexture = new PIXI.AbstractFilter(
            null
            , filterShadowTextureSource
            , filterShadowTextureUniforms
        );

        SMapFilter.applyFilter = function (renderer, input, output) {
            SMapFilter.filterShadowTexture.applyFilter(renderer, input, SMapFilter.renderTarget, true);
            SMapFilter.testFilter.applyFilter(renderer, SMapFilter.renderTarget, output); // будет заменен на второй шейдер.
        };
        return SMapFilter;
    }
})();