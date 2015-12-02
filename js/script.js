(function () {
    var WIDTH = 640;
    var HEIGHT = 480;
    var renderer = new PIXI.WebGLRenderer(WIDTH, HEIGHT); // Создаем PIXI рендерер

    document.addEventListener("DOMContentLoaded", function (event) { // Как только html загрузился
        document.body.appendChild(renderer.view);

        // Загружаем дополнительные файлы
        PIXI.loader
            .add('background', 'img/maze.png')
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

        var stage = new PIXI.Container();
        stage.addChild(background);
        stage.addChild(shadowCasters);
        stage.addChild(lights[0]);
        stage.addChild(lights[1]);

        (function animate() {
            // lights[0] будет бегать за мышкой.
            var pointer = renderer.plugins.interaction.mouse.global;
            lights[0].x = pointer.x;
            lights[0].y = pointer.y;

            // Рендер
            renderer.render(stage);
            
            requestAnimationFrame(animate);
        })();
    }
})();