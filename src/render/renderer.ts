// WebGL2 blit + post pipeline ported from the reference prototype:
// sim grid → RGBA texture → bright pass → separable blur (bloom) →
// composite (heat shimmer, trauma shake, vignette, grain, discovery flash).
// Canvas-2D fallback keeps the game fully playable without WebGL2.

import {
  AZOTH, ELEMENTS, FIRE, GOLD, LAVA, MERCURY, SAND, SPIRIT,
} from '../sim/elements'
import type { World } from '../sim/world'

const VS = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`

const FS_BRIGHT = `#version 300 es
precision highp float;
uniform sampler2D uSim;uniform vec2 uRes;
out vec4 o;
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec4 c=texture(uSim,vec2(uv.x,1.0-uv.y));
  o=vec4(c.rgb*c.a*1.6,1.0);
}`

const FS_BLUR = `#version 300 es
precision highp float;
uniform sampler2D uTex;uniform vec2 uRes;uniform vec2 uDir;
out vec4 o;
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 px=uDir/uRes;
  vec3 c=texture(uTex,uv).rgb*0.227027;
  c+=texture(uTex,uv+px*1.3846).rgb*0.3162162;
  c+=texture(uTex,uv-px*1.3846).rgb*0.3162162;
  c+=texture(uTex,uv+px*3.2308).rgb*0.0702703;
  c+=texture(uTex,uv-px*3.2308).rgb*0.0702703;
  o=vec4(c,1.0);
}`

const FS_COMP = `#version 300 es
precision highp float;
uniform sampler2D uSim;uniform sampler2D uBloom;
uniform vec2 uRes;uniform vec2 uSimRes;uniform vec2 uShake;
uniform float uTime;uniform float uFlash;
out vec4 o;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 suv=clamp(uv+uShake,0.0,1.0);
  float heat=texture(uBloom,clamp(suv-vec2(0.0,5.0/uSimRes.y),0.0,1.0)).r;
  suv.x+=sin(uv.y*150.0+uTime*9.0)*heat*0.0045;
  vec3 scene=texture(uSim,vec2(suv.x,1.0-suv.y)).rgb;
  vec3 bloom=texture(uBloom,suv).rgb;
  vec3 col=scene+bloom*1.25;
  vec2 q=uv-0.5;
  col*=1.0-dot(q,q)*0.55;
  col+=vec3(1.0,0.85,0.45)*uFlash*0.3;
  col+=(hash(uv*913.0+fract(uTime)*7.0)-0.5)*0.028;
  o=vec4(col,1.0);
}`

// Precomputed element base colors + glow.
const COL_R = new Float32Array(ELEMENTS.length)
const COL_G = new Float32Array(ELEMENTS.length)
const COL_B = new Float32Array(ELEMENTS.length)
const GLOW = new Uint8Array(ELEMENTS.length)
for (const d of ELEMENTS) {
  COL_R[d.id] = d.color[0]
  COL_G[d.id] = d.color[1]
  COL_B[d.id] = d.color[2]
  GLOW[d.id] = d.glow
}

export class Renderer {
  trauma = 0
  flash = 0
  private readonly cv: HTMLCanvasElement
  private readonly world: World
  private readonly buf: Uint8ClampedArray
  private readonly bufView: Uint8Array
  private gl: WebGL2RenderingContext | null = null
  private drawGL: (() => void) | null = null
  private draw2D: (() => void) | null = null
  private t0 = performance.now()

  constructor(cv: HTMLCanvasElement, world: World) {
    this.cv = cv
    this.world = world
    this.buf = new Uint8ClampedArray(world.n * 4)
    this.bufView = new Uint8Array(this.buf.buffer)
    const gl = cv.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false })
    if (gl) {
      try {
        this.initGL(gl)
        this.gl = gl
      } catch {
        this.init2D()
      }
    } else {
      this.init2D()
    }
  }

  get usingWebGL(): boolean { return this.gl !== null }

  resize(cssW: number, cssH: number, dpr: number): void {
    this.cv.style.width = cssW + 'px'
    this.cv.style.height = cssH + 'px'
    this.cv.width = Math.max(1, Math.round(cssW * dpr))
    this.cv.height = Math.max(1, Math.round(cssH * dpr))
  }

  render(): void {
    this.fillBuffer()
    if (this.drawGL) this.drawGL()
    else if (this.draw2D) this.draw2D()
    this.trauma *= 0.9
    this.flash *= 0.93
  }

  private fillBuffer(): void {
    const { grid, aux, shade, frame, n } = this.world
    const buf = this.buf
    for (let i = 0; i < n; i++) {
      const e = grid[i]!
      const o = i * 4
      let r: number, g: number, b: number, a: number
      if (e === 0) { r = 14; g = 12; b = 10; a = 0 }
      else if (e === FIRE) {
        const t = Math.min(1, aux[i]! / 50)
        r = 255; g = 60 + t * 160; b = 10 + t * 60; a = 140 + t * 115
      } else if (e === SPIRIT) {
        const t = Math.min(1, aux[i]! / 60)
        r = 120 + t * 60; g = 170 + t * 50; b = 255; a = 160 + t * 90
      } else {
        const s = 0.84 + (shade[i]! / 255) * 0.32
        r = COL_R[e]! * s; g = COL_G[e]! * s; b = COL_B[e]! * s; a = GLOW[e]!
        if (e === LAVA) {
          const p = 0.9 + 0.18 * Math.sin(frame * 0.1 + shade[i]!)
          r *= p; g *= p
          a = 160 + 50 * Math.sin(frame * 0.07 + shade[i]!)
        } else if (e === SAND && aux[i] === 1) {
          r *= 0.68; g *= 0.72; b *= 0.82 // wet sand: darker, cooler
        } else if (e === GOLD && shade[i]! > 235) {
          r = 255; g = 240; b = 170; a = 180 // glint
        } else if (e === AZOTH) {
          a = 70 + 40 * Math.sin(frame * 0.05 + shade[i]!) // slow luminous pulse
        } else if (e === MERCURY && shade[i]! > 240) {
          r = 240; g = 244; b = 252 // specular bead
        }
      }
      buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = a
    }
  }

  /* ─────────────────────── WebGL2 path ─────────────────────── */

  private initGL(gl: WebGL2RenderingContext): void {
    const { w: W, h: H } = this.world
    const compile = (type: number, src: string): WebGLShader => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
      return s
    }
    const makeProg = (fs: string): WebGLProgram => {
      const p = gl.createProgram()!
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VS))
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs))
      gl.linkProgram(p)
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link')
      return p
    }
    const makeTex = (w: number, h: number, filter: number): WebGLTexture => {
      const t = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      return t
    }
    const makeFBO = (tex: WebGLTexture): WebGLFramebuffer => {
      const f = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, f)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      return f
    }

    const pBright = makeProg(FS_BRIGHT)
    const pBlur = makeProg(FS_BLUR)
    const pComp = makeProg(FS_COMP)
    const texSim = makeTex(W, H, gl.NEAREST)
    const texA = makeTex(W, H, gl.LINEAR)
    const texB = makeTex(W, H, gl.LINEAR)
    const fboA = makeFBO(texA)
    const fboB = makeFBO(texB)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    const U: Record<string, Record<string, WebGLUniformLocation | null>> = {}
    for (const [name, p] of [['bright', pBright], ['blur', pBlur], ['comp', pComp]] as const) {
      U[name] = {}
      const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) as number
      for (let i = 0; i < count; i++) {
        const inf = gl.getActiveUniform(p, i)!
        U[name]![inf.name] = gl.getUniformLocation(p, inf.name)
      }
    }

    this.drawGL = () => {
      const cv = this.cv
      gl.bindTexture(gl.TEXTURE_2D, texSim)
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, this.bufView)

      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA)
      gl.viewport(0, 0, W, H)
      gl.useProgram(pBright)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texSim)
      gl.uniform1i(U.bright!.uSim!, 0)
      gl.uniform2f(U.bright!.uRes!, W, H)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      gl.useProgram(pBlur)
      gl.uniform1i(U.blur!.uTex!, 0)
      gl.uniform2f(U.blur!.uRes!, W, H)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboB)
      gl.bindTexture(gl.TEXTURE_2D, texA)
      gl.uniform2f(U.blur!.uDir!, 1, 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fboA)
      gl.bindTexture(gl.TEXTURE_2D, texB)
      gl.uniform2f(U.blur!.uDir!, 0, 1)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      const mag = this.trauma * this.trauma * 0.012
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, cv.width, cv.height)
      gl.useProgram(pComp)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texSim)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, texA)
      gl.uniform1i(U.comp!.uSim!, 0)
      gl.uniform1i(U.comp!.uBloom!, 1)
      gl.uniform2f(U.comp!.uRes!, cv.width, cv.height)
      gl.uniform2f(U.comp!.uSimRes!, W, H)
      gl.uniform2f(U.comp!.uShake!, (Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag)
      gl.uniform1f(U.comp!.uTime!, (performance.now() - this.t0) / 1000)
      gl.uniform1f(U.comp!.uFlash!, this.flash)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
  }

  /* ─────────────────────── Canvas-2D fallback ─────────────────────── */

  private init2D(): void {
    const { w: W, h: H, n } = this.world
    const ctx = this.cv.getContext('2d')!
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const octx = off.getContext('2d')!
    const img = octx.createImageData(W, H)
    this.draw2D = () => {
      const px = img.data
      const buf = this.buf
      for (let i = 0; i < n; i++) {
        const o = i * 4
        px[o] = buf[o]!; px[o + 1] = buf[o + 1]!; px[o + 2] = buf[o + 2]!; px[o + 3] = 255
      }
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(off, 0, 0, this.cv.width, this.cv.height)
    }
  }
}
