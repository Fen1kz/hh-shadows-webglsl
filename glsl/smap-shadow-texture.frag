// Шейдер для создания карты теней:

precision mediump float;

//Объявляем переданные uniform'ы
varying vec2 vTextureCoord; // Координата
uniform sampler2D uSampler; // Текстура на которую наложен фильтр (не используется)

uniform vec2 viewResolution; // Разрешение вьюшки
uniform vec2 rtSize; // Размер renderTarget

uniform vec4 uLightPosition[CONST_LIGHTS_COUNT]; //x,y = координаты, z = размер
uniform vec4 uLightColor[CONST_LIGHTS_COUNT]; //На всякий случай

uniform sampler2D uShadowCastersTexture; // Отсюда мы будем брать данные -- есть препятствие или нет.

const float PI = 3.14159265358979;
const float STEPS = 256.0;
const float THRESHOLD = .01;

void main(void) {
    int lightnum = int(floor(vTextureCoord.y * float(CONST_LIGHTS_COUNT))); // Определяем номер источника света по Y
    vec2 lightPosition;
    float lightSize;
    for (int i = 0; i < CONST_LIGHTS_COUNT; i += 1) { // Определяем сам источник света по его номеру
        if (lightnum == i) {
            lightPosition = uLightPosition[i].xy / viewResolution;
            lightSize = uLightPosition[i].z / max(viewResolution.x, viewResolution.y);
            break;
        }
    }
    float dst = 1.0; // Считаем что препятствий нет
    for (float y = 0.0; y < STEPS; y += 1.0) { // И мелкими (с мелкостью (y / STEPS)) шагами идем во всех направлениях
        float distance = (y / STEPS); // Расстояния для теста
        float angle = vTextureCoord.x * (2.0 * PI); // Угол для теста
        // По полярным координатам вычисляем пиксель для теста
        vec2 coord = vec2(cos(angle) * distance, sin(angle) * distance);
        coord *= (max(viewResolution.x, viewResolution.y) / viewResolution);  // Пропорции
        coord += lightPosition; // Прибавляем координаты источника
        coord = clamp(coord, 0., 1.); // Не выходим за пределы текстуры
        vec4 data = texture2D(uShadowCastersTexture, coord); // Находим пиксель
        if (data.a > THRESHOLD) { // Если есть препятствие, записываем расстояние и прекращаем поиск.
            dst = min(dst, distance);
            break;
        }
    }
    // Дистанция получается в пикселях, сохраняем её в отрезке 0..1
    gl_FragColor = vec4(vec3(0.0), dst / lightSize);
}