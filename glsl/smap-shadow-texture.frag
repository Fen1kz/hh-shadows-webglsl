precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

uniform vec2 viewResolution;
uniform vec2 rtSize;

uniform vec4 uLightPosition[CONST_LIGHTS_COUNT]; //x,y = координаты, z = размер
uniform vec4 uLightColor[CONST_LIGHTS_COUNT]; //На всякий случай

uniform sampler2D uLightMap;

const float PI = 3.14159265358979;
const float STEPS = 256.0;
const float THRESHOLD = .99;

void main(void) {
    vec2 relativeResolution = (max(viewResolution.x, viewResolution.y) / viewResolution); // см. статью

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
        coord = lightPosition + coord * relativeResolution;
        coord = clamp(coord, 0., 1.);
        vec4 data = texture2D(uLightMap, coord); // Находим пиксель
        if (data.r < THRESHOLD) { // Если есть препятствие, записываем расстояние и прекращаем поиск.
            dst = min(dst, distance);
            break;
        }
    }
    gl_FragColor = vec4(vec3(0.0), dst / lightSize);
}