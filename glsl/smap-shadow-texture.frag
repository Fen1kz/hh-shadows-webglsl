precision mediump float;

varying vec2 vTextureCoord;
uniform sampler2D uSampler;

void main() {
    vec4 color = texture2D(uSampler, vTextureCoord);

    if (color.r > 0.) {
        gl_FragColor = vec4(.5, .5, .5, 1.);
    } else {
        gl_FragColor = vec4(1., 0., 0., 1.);
    }
}