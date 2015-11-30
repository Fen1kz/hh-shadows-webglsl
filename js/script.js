(function () {
    var WIDTH = 640;
    var HEIGHT = 480;
    var renderer = new PIXI.WebGLRenderer(WIDTH, HEIGHT); // Создаем PIXI рендерер

    document.addEventListener("DOMContentLoaded", function (event) { // Как только html загрузился
        document.body.appendChild(renderer.view);

        // Загружаем дополнительные файлы
        PIXI.loader
            .add('background', 'img/back.png')
            .once('complete', setup)
            .load();
    });

    function setup() {
        // Все готово, можно рисовать.
        var lights = []; // Лампочки
        lights[0] = new PIXI.Graphics();
        lights[0].beginFill(0xFFFF00);
        lights[0].drawCircle(0, 0, 10); // x, y, radius
        lights[1] = new PIXI.Graphics();
        lights[1].beginFill(0xFFFF00);
        lights[1].drawCircle(50, 50, 10);

        var background = PIXI.Sprite.fromImage('img/back.png'); // Фон

        var shadowCasters = new PIXI.Container(); // Контейнер для всех, кто отбрасывает тень
        shadowCasters.addChild(background); // Собственно её будет отбрасывать только фон

        var stage = new PIXI.Container();
        stage.addChild(shadowCasters); // Будет удалено, пока просто посмотреть.
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