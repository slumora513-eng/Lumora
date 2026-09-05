/* ==========================================================================
   Lumora — ANIMAÇÕES DE INICIALIZAÇÃO EM 3D (WebGL)
   §18 / §49, com a stack de render que a §65.5 decidiu:

     "Canvas 2D + WebGL (shaders) para fundo, partículas, aurora e rastros —
      nada de gradiente CSS chapado como estética principal."
     "Física leve de bolhas em JS puro, SEM BIBLIOTECAS."

   A entrega anterior cobria só a metade Canvas 2D. Esta é a metade WebGL:
   profundidade real, não desenho chapado.

   ---------------------------------------------------------------------------
   O QUE É 3D DE VERDADE AQUI
   ---------------------------------------------------------------------------
   Não é 2D com gradiente fingindo volume. Cada quadro traça raios a partir de
   uma câmera com perspectiva:

   - Vidro do Elio: intersecção raio-esfera analítica, normal real, Fresnel,
     REFRAÇÃO (o céu atrás é amostrado pelo raio refratado) com dispersão
     cromática por canal, reflexo especulativo e brilho especular. É o que
     faz a bolha ter volume em vez de parecer um disco.
   - Aurora: volume raymarchado — a cortina tem espessura e o raio acumula
     densidade atravessando ela.
   - RotaCerta: plano de chão com perspectiva e veículos em SDF de caixa;
     a câmera afasta de verdade (zoom out), não escala um bitmap.
   - Estrelas: campo por direção do raio, com paralaxe real de profundidade.

   Sem bibliotecas: WebGL1 cru, um triângulo de tela cheia e um fragment
   shader por cena. Nenhum arquivo de mídia é gerado — §48 mantido.

   ---------------------------------------------------------------------------
   CADEIA DE FALLBACK (§36 / §49.3)
   ---------------------------------------------------------------------------
   WebGL indisponível, nível Básico, ou contexto perdido -> as cenas Canvas 2D
   de animacoes.js assumem. Com prefers-reduced-motion -> pôster estático.
   O usuário nunca vê tela quebrada (§49.3, fallback obrigatório).
   ========================================================================== */

'use strict';

/* --------------------------------------------------------------------------
   Vertex shader: um único triângulo cobrindo a tela.
   Mais barato que um quad e sem costura no meio.
   -------------------------------------------------------------------------- */
const VS = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/* --------------------------------------------------------------------------
   Biblioteca comum de GLSL — compartilhada por todas as cenas.
   -------------------------------------------------------------------------- */
const COMUM = `
precision highp float;

uniform vec2  u_res;   // resolução em pixels
uniform float u_t;     // tempo em segundos
uniform float u_p;     // progresso da cena, 0..1
uniform float u_q;     // qualidade: 1.0 pleno, 0.6 econômico

const float PI = 3.14159265;

/* Cores da identidade — medidas nos assets oficiais (docs/10-paleta.md),
   convertidas de sRGB para LINEAR.

   Isto não é detalhe: a cena acumula luz (refração, volume, aditivo) e só
   gama-codifica no gl_FragColor final. Usar os valores sRGB direto aplicaria
   gama duas vezes e lavaria os pretos — o Deep Space (#00040F) chegava à tela
   12x mais claro do que é, e o "fundo escuro" da §60.1 virava azul acinzentado. */
const vec3 VIOLETA   = vec3(0.43415, 0.01229, 1.00000);  // #B01DFF
const vec3 AZUL      = vec3(0.00000, 0.16827, 1.00000);  // #0072FF
const vec3 AUR_VERDE = vec3(0.02416, 0.62396, 0.28744);  // #2BCF92
const vec3 AUR_TEAL  = vec3(0.01229, 0.27468, 0.55834);  // #1D8FC5
const vec3 AUR_VIOL  = vec3(0.23455, 0.05286, 0.95597);  // #8541FA
const vec3 BIZ_VERDE = vec3(0.00802, 0.79910, 0.29177);  // #16E793
const vec3 AMBAR     = vec3(1.00000, 0.36131, 0.03955);  // #FFA238
const vec3 DEEP      = vec3(0.00000, 0.00121, 0.00478);  // #00040F

float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash13(vec3 p3){
  p3 = fract(p3*0.1031); p3 += dot(p3, p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
vec3 hash33(vec3 p3){
  p3 = fract(p3*vec3(0.1031,0.1030,0.0973));
  p3 += dot(p3, p3.yxz+33.33);
  return fract((p3.xxy+p3.yxx)*p3.zyx);
}

float ruido(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f*f*(3.0-2.0*f);
  float n000 = hash13(i+vec3(0,0,0)), n100 = hash13(i+vec3(1,0,0));
  float n010 = hash13(i+vec3(0,1,0)), n110 = hash13(i+vec3(1,1,0));
  float n001 = hash13(i+vec3(0,0,1)), n101 = hash13(i+vec3(1,0,1));
  float n011 = hash13(i+vec3(0,1,1)), n111 = hash13(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x), mix(n010,n110,f.x), f.y),
             mix(mix(n001,n101,f.x), mix(n011,n111,f.x), f.y), f.z);
}

float fbm(vec3 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++){ v += a*ruido(p); p *= 2.02; a *= 0.5; }
  return v;
}

/* Campo estelar por DIREÇÃO do raio: três camadas de profundidade, cada uma
   com densidade e brilho próprios. Como depende de rd, a paralaxe aparece
   sozinha quando a câmera se move. */
vec3 campoEstelar(vec3 rd){
  vec3 c = vec3(0.0);
  for (int k = 0; k < 3; k++){
    float esc = 55.0 + float(k)*85.0;
    vec3 p  = rd*esc;
    vec3 id = floor(p);
    vec3 f  = fract(p) - 0.5;
    vec3 h  = hash33(id);
    float lim = 0.975 - float(k)*0.006;
    if (h.x > lim){
      vec3 jitter = (h - 0.5)*0.55;
      float d = length(f - jitter);
      float b = smoothstep(0.30, 0.0, d);
      // estrelas mais distantes são mais frias e mais fracas
      vec3 tom = mix(vec3(1.0,0.87,0.71), vec3(0.60,0.75,1.0), h.y);  // linear
      c += tom * b * (0.35 + 0.65*h.z) * (1.0 - float(k)*0.22);
    }
  }
  return c;
}

/* Nebulosa Deep Space — dá corpo ao fundo sem virar gradiente chapado.
   Calibrada com cuidado: em espaço linear um valor de 0.02 já vira ~45/255 na
   tela depois da gama. A primeira versão usava 0.55 de ganho e cobria a cena
   inteira de névoa roxa — o Deep Space tem que continuar Deep SPACE. */
vec3 nebulosa(vec3 rd){
  float n = fbm(rd*2.6 + vec3(0.0, 0.0, 1.7));
  n = pow(max(n-0.55, 0.0)*2.2, 2.6);
  vec3 cor = mix(VIOLETA*0.30, AZUL*0.26, fbm(rd*1.7+9.0));
  return cor*n*0.10;
}

vec3 fundo(vec3 rd){
  return DEEP + nebulosa(rd) + campoEstelar(rd);
}

/* Menor distância entre o raio e um SEGMENTO 3D a..b.
   Amostrar pontos ao longo do segmento e testar cada um não desenha linha:
   desenha uma fileira de pontos com buracos entre eles. Isto resolve o par de
   pontos mais próximos entre as duas retas e recorta ao trecho válido, o que
   dá um traço contínuo e com profundidade correta. */
float dSegmento(vec3 ro, vec3 rd, vec3 a, vec3 b){
  vec3 ba = b - a;
  vec3 w0 = ro - a;
  float B = dot(rd, ba);
  float C = dot(ba, ba);
  float D = dot(rd, w0);
  float E = dot(ba, w0);
  float den = C - B*B;                 // dot(rd,rd) == 1
  float u = abs(den) > 1e-5 ? (E - B*D)/den : 0.0;
  u = clamp(u, 0.0, 1.0);
  vec3 q = a + ba*u;                   // ponto no segmento
  float tr = max(dot(q - ro, rd), 0.0);// ponto no raio, nunca atrás da câmera
  return length((ro + rd*tr) - q);
}

/* Distância do raio a um PONTO 3D — para estrelas e satélites. */
float dPonto(vec3 ro, vec3 rd, vec3 q){
  float tr = max(dot(q - ro, rd), 0.0);
  return length((ro + rd*tr) - q);
}

/* Profundidade do ponto ao longo do raio. Sem isto, uma luz aditiva desenhada
   depois da superfície aparece ATRAVÉS dela — faróis e balizas vazando pela
   lataria do veículo. */
float tPonto(vec3 ro, vec3 rd, vec3 q){
  return max(dot(q - ro, rd), 0.0);
}

/* Intersecção raio-esfera analítica. Retorna a distância ou -1. */
float iEsfera(vec3 ro, vec3 rd, vec3 c, float r){
  vec3 oc = ro - c;
  float b = dot(oc, rd);
  float q = dot(oc, oc) - r*r;
  float h = b*b - q;
  if (h < 0.0) return -1.0;
  h = sqrt(h);
  float t = -b - h;
  return t > 0.0 ? t : -b + h;
}

/* VIDRO LÍQUIDO — o coração da identidade (§65: bolhas translúcidas com
   estética Liquid Glass / luz / espaço).

   O céu ATRAVESSA a bolha: o raio é refratado e reamostra o fundo. A
   dispersão cromática (IOR distinto por canal) é o que faz o vidro parecer
   vidro e não plástico. */
/* Cobertura da esfera com anti-serrilhado.
   A intersecção raio-esfera é binária: ou acerta ou não. Usada direto, ela
   desenha a silhueta em degraus — e num vidro liquid glass a borda é
   justamente o que se olha. Aqui a borda vira COBERTURA: a distância
   perpendicular do centro ao raio é comparada com o raio dentro de uma
   janela de ~1 pixel projetado na profundidade da esfera.

   FOCAL_AA é a distância focal usada pelas cenas (1,5 a 1,6). A diferença
   entre elas muda a largura da janela em ~3% — invisível — então uma
   constante evita carregar o parâmetro por cinco assinaturas. */
const float FOCAL_AA = 1.55;

vec4 vidro(vec3 ro, vec3 rd, vec3 centro, float raio, vec3 corA, vec3 corB){
  vec3 oc = centro - ro;
  float L = max(length(oc), 1e-3);
  float w = L / (u_res.y * FOCAL_AA);          // meio pixel, em unidades de mundo
  float cob = smoothstep(w, -w, length(cross(oc, rd)) - raio);
  if (cob <= 0.0) return vec4(0.0);

  // A esfera é testada um fio maior para que a faixa de anti-serrilhado
  // TENHA superfície onde nascer: sem isso a metade externa da borda não
  // acerta nada e o degrau volta, só que meio pixel adiante.
  float t = iEsfera(ro, rd, centro, raio + w);
  if (t < 0.0) return vec4(0.0);

  vec3 pos = ro + rd*t;
  vec3 n   = normalize(pos - centro);
  vec3 luz = normalize(vec3(-0.45, 0.72, 0.52));
  float ndv = clamp(dot(-rd, n), 0.0, 1.0);

  // Parede FINA, como bolha de sabão — não bloco de vidro maciço. Com IOR alto
  // o raio refratado varre longe e o céu atrás some: a bolha fecha e vira
  // planeta. Com parede fina o céu ATRAVESSA quase reto, que é o que faz ler
  // como bolha (§65: "bolhas translúcidas com a estética Liquid Glass").
  vec3 dentro = refract(rd, n, 1.0/1.055);
  vec3 atras  = fundo(dentro);

  // SEM dispersão por canal na refração. O campo estelar é de frequência
  // altíssima: qualquer desvio por canal parte cada estrela em pontinhos
  // vermelhos e azuis — vira confete, não vidro. A dispersão que se lê numa
  // bolha real está no ARO, e é o gradiente de cor abaixo que a entrega.
  float fres = pow(1.0 - ndv, 5.0);
  vec3 refl = fundo(reflect(rd, n));
  float spec = pow(max(dot(reflect(-luz, n), -rd), 0.0), 120.0);

  vec3 cor = atras;                                // o céu passa por dentro
  cor += refl * fres * 0.55;                       // céu refletido na casca
  cor += mix(corB, corA, clamp(n.y*0.5+0.5, 0.0, 1.0)) * fres * 0.60;  // aro: azul embaixo -> violeta em cima
  cor += vec3(1.0) * spec * 1.60;                  // especular
  return vec4(cor, cob);
}
`;

/* --------------------------------------------------------------------------
   Cenas — corpo do main() de cada slot.
   -------------------------------------------------------------------------- */
const CENAS_GL = {

  /* ---- abertura.elio — "bolhinhas se juntando até formar a bolha principal"
     Em 3D: as bolhinhas orbitam e mergulham em direção ao centro no eixo Z,
     ganhando e perdendo profundidade. A bolha final é vidro com refração. */
  'abertura.elio': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  vec3 ro = vec3(0.0, 0.0, 3.4);
  vec3 rd = normalize(vec3(uv, -1.55));

  vec3 col = fundo(rd);

  float conv  = smoothstep(0.05, 0.62, u_p);
  float fusao = smoothstep(0.55, 0.82, u_p);
  float R = 0.62;

  // 12 bolhinhas convergindo em 3D
  for (int i = 0; i < 12; i++){
    float fi = float(i);
    float ang = fi*2.399963 + conv*1.35;          // ângulo áureo: distribui bem
    float alt = sin(fi*1.7)*0.85;
    float dist = mix(3.6 + mod(fi,4.0)*0.55, R*0.35, conv);
    vec3 c = vec3(cos(ang)*dist, alt*dist*0.42, sin(ang)*dist - 0.2);
    float r = R*(0.15 + mod(fi,3.0)*0.035)*(1.0 - fusao*0.9);
    if (r < 0.004) continue;
    vec4 v = vidro(ro, rd, c, r, VIOLETA, AZUL);
    col = mix(col, v.rgb, v.a);
  }

  // A bolha principal, nascida da fusão
  float rp = R*fusao*(1.0 + sin(u_t*2.0)*0.02*smoothstep(0.82,1.0,u_p));
  if (rp > 0.004){
    vec4 v = vidro(ro, rd, vec3(0.0,0.0,0.0), rp, VIOLETA, AZUL);
    col = mix(col, v.rgb, v.a);
    // halo volumétrico ao redor
    float d = length(cross(rd, -ro))/length(rd);
    col += mix(VIOLETA, AZUL, 0.5) * smoothstep(rp*2.0, rp, d) * 0.045 * fusao;
  }

  // Onda de assentamento
  float onda = smoothstep(0.72, 0.94, u_p);
  if (onda > 0.0 && onda < 1.0){
    float d = length(cross(rd, -ro))/length(rd);
    float raioOnda = R*(1.0 + onda*0.55);
    col += VIOLETA * smoothstep(0.022, 0.0, abs(d-raioOnda)) * 0.05*(1.0-onda);
  }

  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,

  /* ---- abertura.aurora — "a noite chega e a aurora se forma e se move"
     Volume raymarchado: a cortina tem ESPESSURA e o raio a atravessa
     acumulando densidade. Aurora é aurora boreal, nunca bolha (§60.11). */
  'abertura.aurora': `
/* Cortina de aurora: FINA em x, alta em y, ondulando com ruído.
   A espessura importa: com a folha larga o volume satura e a tela inteira
   vira um degradê ciano — que é exatamente o "CSS chapado" que a §65.5
   proíbe. Uma aurora real é uma lâmina, não uma nuvem. */
float densidadeAurora(vec3 p, float t){
  float onda  = fbm(vec3(p.x*0.55, p.y*0.16 - t*0.09, p.z*0.55 + t*0.05));
  float folha = p.x + sin(p.y*0.42 + t*0.35)*0.75 + (onda - 0.5)*1.5;
  float d = exp(-folha*folha*3.2);
  // banda vertical: nasce embaixo, esmaece no alto (aurora cai do céu)
  float alt = smoothstep(-2.2, 0.2, p.y) * smoothstep(3.6, 0.6, p.y);
  // raios verticais dentro da cortina, o "estriado" da aurora
  float estria = 0.65 + 0.35*fbm(vec3(p.x*2.6, p.y*0.35 - t*0.5, p.z*0.8));
  return d*alt*estria;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  vec3 ro = vec3(0.0, 0.1, 5.0);
  vec3 rd = normalize(vec3(uv, -1.5));

  // A noite chegando: o céu escurece de crepúsculo a Deep Space
  float noite = smoothstep(0.0, 0.34, u_p);
  vec3 crep = mix(vec3(0.004,0.015,0.048), DEEP, noite);  // linear
  vec3 col = crep + campoEstelar(rd)*smoothstep(0.15, 0.55, u_p) + nebulosa(rd)*noite;

  float forma = smoothstep(0.26, 0.74, u_p);
  if (forma > 0.0){
    int PASSOS = 40;
    float dt = 0.30/u_q;
    vec3 p = ro + rd*1.2;
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 40; i++){
      if (float(i) > 40.0*u_q) break;
      p += rd*dt;
      // três cortinas deslocadas em x, para as três cores se lerem
      for (int k = 0; k < 3; k++){
        float fk = float(k);
        vec3 q = p - vec3(-2.4 + fk*2.4, 0.0, -1.0 - fk*0.6);
        float d = densidadeAurora(q, u_t + fk*2.1);
        if (d < 0.002) continue;
        vec3 cor = k == 0 ? AUR_VERDE : (k == 1 ? AUR_TEAL : AUR_VIOL);
        // a cor sobe pelo corpo da cortina, como aurora real
        cor = mix(cor, cor*vec3(1.3,1.0,1.4), clamp(q.y*0.22+0.4, 0.0, 1.0));
        acc += cor * d * 0.011;
      }
    }
    col += acc * forma;
  }

  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,

  /* ---- abertura.rotacerta — "horizonte com veículos em silhueta azul e
     zoom out" (§18) + assinatura "GPS espacial" (§65.1).

     REFEITA. A primeira versão tinha DUAS ideias soltas que não se juntavam:
     uma grade retrô no chão e pontos âmbar flutuando no céu, sem relação. O
     resultado lia como cenário genérico de synthwave, não como o RotaCerta.

     Agora há UMA ideia só, a da §65.1: uma ROTA no espaço. A rota é a
     protagonista — uma fita de luz teal que serpenteia do primeiro plano até
     o horizonte, com waypoints âmbar POUSADOS sobre ela (não soltos no céu) e
     os veículos correndo POR ELA. A câmera afasta e a rota inteira se revela
     como a constelação que a §65.1 descreve. A grade sumiu. */
  'abertura.rotacerta': `
/* A rota: uma curva suave em função da profundidade. Tudo na cena — fita,
   waypoints e veículos — é posicionado por ela, e é isso que faz a cena ter
   um assunto só. */
float rotaX(float z){
  return sin(z*0.30)*1.5 + sin(z*0.11 + 1.3)*0.85;
}
float rotaDX(float z){          // tangente, para orientar os veículos
  return cos(z*0.30)*0.45 + cos(z*0.11 + 1.3)*0.0935;
}

float sdCaixa(vec3 p, vec3 b){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)), 0.0);
}
/* União suave: funde corpo e cabine numa silhueta ÚNICA. Com min() puro os
   dois viram caixas empilhadas — que foi o que fez o veículo ler como cubo. */
float smin(float a, float b, float k){
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

/* Posição do veículo i no instante t — usada pelo SDF e pelo farol. */
vec3 posVeiculo(int i, float t){
  float fi = float(i);
  float z = mod(-t*2.2 - fi*5.5, 22.0) - 20.0;
  return vec3(rotaX(z), -0.80, z);
}

/* Só os veículos vão para o raymarch; o chão é resolvido analiticamente. */
float mapaVeiculos(vec3 p, float t){
  float d = 1e9;
  for (int i = 0; i < 3; i++){
    vec3 c = posVeiculo(i, t);
    vec3 q = p - c;
    // gira o veículo para acompanhar a tangente da rota
    float a = atan(rotaDX(c.z));
    float ca = cos(a), sa = sin(a);
    q.xz = mat2(ca, -sa, sa, ca) * q.xz;
    // Baixo e comprido, com a cabine recuada e fundida ao corpo
    float corpo = sdCaixa(q, vec3(0.235, 0.105, 0.78));
    float cab   = sdCaixa(q - vec3(0.0, 0.135, -0.20), vec3(0.205, 0.115, 0.30));
    d = min(d, smin(corpo, cab, 0.16));
  }
  return d;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;

  // ZOOM OUT: a câmera sobe e recua, revelando a rota inteira
  float zoom = smoothstep(0.10, 0.94, u_p);
  vec3 ro = vec3(0.0, mix(-0.40, 3.20, zoom), mix(1.2, 8.0, zoom));
  vec3 alvo = vec3(0.0, mix(-0.70, -1.05, zoom), mix(-4.0, -9.0, zoom));
  vec3 f = normalize(alvo - ro);
  vec3 r = normalize(cross(vec3(0.0,1.0,0.0), f));
  vec3 u = cross(f, r);
  vec3 rd = normalize(uv.x*r + uv.y*u + 1.55*f);

  vec3 col = fundo(rd);

  // Brilho do horizonte — fino, para não competir com a rota
  col += mix(AZUL, AUR_TEAL, 0.4) * exp(-abs(rd.y + 0.02)*22.0) * 0.10;

  // ---- Chão: plano analítico em y = -1
  float tCh = (rd.y < -0.001) ? (-1.0 - ro.y)/rd.y : -1.0;

  // ---- Veículos: raymarch curto
  float tV = -1.0;
  {
    float d = 0.0;
    for (int i = 0; i < 56; i++){
      vec3 p = ro + rd*d;
      float m = mapaVeiculos(p, u_t);
      if (m < 0.004){ tV = d; break; }
      d += m*0.9;
      if (d > 30.0) break;
    }
  }

  bool verChao = tCh > 0.0 && (tV < 0.0 || tCh < tV);
  bool verVeic = tV > 0.0 && (tCh < 0.0 || tV < tCh);

  if (verChao){
    vec3 p = ro + rd*tCh;
    float dist = length(p - ro);
    float fade = exp(-dist*0.055);

    // A FITA DA ROTA — a protagonista da cena
    float dr = abs(p.x - rotaX(p.z));
    float nucleo = smoothstep(0.10, 0.0, dr);        // miolo aceso
    float corpo  = smoothstep(0.34, 0.06, dr);       // largura da fita
    float halo   = smoothstep(1.30, 0.10, dr);       // luz derramada no chão

    col = mix(col, vec3(0.0), 0.35*fade);            // o chão escurece o fundo
    col += AUR_TEAL * halo  * 0.055 * fade;
    col += AUR_TEAL * corpo * 0.55  * fade;
    col += mix(AUR_TEAL, vec3(1.0), 0.42) * nucleo * 0.62 * fade;

    // Marcas de progressão ao longo da fita, como um trilho de navegação
    float marca = smoothstep(0.06, 0.0, abs(fract(p.z*0.55 + u_t*0.35) - 0.5) - 0.42);
    col += AUR_TEAL * marca * corpo * 0.5 * fade;
  }

  if (verVeic){
    vec3 p = ro + rd*tV;
    // Normal do SDF por diferenças finitas. Sem ela o veículo é uma mancha
    // azul chapada: são as faces com iluminações diferentes que fazem a
    // silhueta ler como um volume.
    vec2 e = vec2(0.0022, 0.0);
    vec3 n = normalize(vec3(
      mapaVeiculos(p + e.xyy, u_t) - mapaVeiculos(p - e.xyy, u_t),
      mapaVeiculos(p + e.yxy, u_t) - mapaVeiculos(p - e.yxy, u_t),
      mapaVeiculos(p + e.yyx, u_t) - mapaVeiculos(p - e.yyx, u_t)));

    vec3 luz = normalize(vec3(-0.35, 0.85, 0.30));
    float dif = max(dot(n, luz), 0.0);
    float ceu = 0.5 + 0.5*n.y;                      // luz ambiente do céu
    float borda = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

    // Silhueta AZUL (§18), agora com volume
    col  = vec3(0.003, 0.011, 0.050);               // sombra
    col += vec3(0.026, 0.125, 0.44) * dif;          // face iluminada
    col += vec3(0.008, 0.040, 0.16) * ceu;          // rebote do céu
    col += AUR_TEAL * 0.22 * borda;                 // a rota reflete na lataria
  }

  // Superfície mais próxima já resolvida: nada de luz é somado atrás dela.
  float tSup = 1e9;
  if (verChao) tSup = tCh;
  if (verVeic) tSup = tV;

  // Farol âmbar na frente de cada veículo, e o rastro de navegação atrás
  // (§65.1: "leve rastro de navegação").
  for (int i = 0; i < 3; i++){
    vec3 c = posVeiculo(i, u_t);
    vec3 frente = c + vec3(0.0, 0.02, -0.82);
    if (tPonto(ro, rd, frente) < tSup){
      float d = dPonto(ro, rd, frente);
      col += AMBAR * smoothstep(0.040, 0.0, d) * 1.4;
      col += AMBAR * smoothstep(0.28, 0.0, d) * 0.07;
    }
    // rastro: um segmento curto atrás do veículo, sobre a rota
    vec3 tras = vec3(rotaX(c.z + 1.9), c.y - 0.02, c.z + 1.9);
    vec3 base = vec3(c.x, c.y - 0.02, c.z + 0.55);
    if (tPonto(ro, rd, base) < tSup){
      float dr2 = dSegmento(ro, rd, base, tras);
      col += AUR_TEAL * smoothstep(0.045, 0.0, dr2) * 0.28;
    }
  }

  // ---- Waypoints POUSADOS na rota, com feixe vertical
  float rota = smoothstep(0.34, 0.92, u_p);
  for (int i = 0; i < 5; i++){
    float fi = float(i);
    float fw = clamp(rota*5.0 - fi*0.8, 0.0, 1.0);
    if (fw <= 0.0) break;
    float z = -2.2 - fi*3.1;
    vec3 w = vec3(rotaX(z), -0.86, z);

    if (tPonto(ro, rd, w) >= tSup) continue;   // atrás de um veículo: não vaza

    float d = dPonto(ro, rd, w);
    col += AMBAR * smoothstep(0.055, 0.0, d) * 1.8 * fw;      // baliza
    col += AMBAR * smoothstep(0.34, 0.0, d) * 0.10 * fw;      // brilho

    // Feixe curto, só o bastante para o waypoint POUSAR na rota em vez de
    // flutuar. Alto demais e ele lê como poste, não como baliza.
    float df = dSegmento(ro, rd, w, w + vec3(0.0, 0.30, 0.0));
    col += AMBAR * smoothstep(0.016, 0.0, df) * 0.22 * fw;
  }

  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,

  /* ---- abertura.business — "céu estrelado puro" (briefing do Fundador,
     05/09/2026). Sem motivo extra: nada converge nem se monta. As estrelas
     acendem onde estão e a constelação se desenha entre elas.
     Em 3D: a câmera deriva de leve e a paralaxe das três camadas de
     profundidade aparece sozinha. */
  'abertura.business': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  // Deriva lenta da câmera: é ela que revela a profundidade do campo
  vec3 ro = vec3(sin(u_t*0.11)*0.30, cos(u_t*0.09)*0.18, 3.0);
  vec3 rd = normalize(vec3(uv, -1.5));

  float revela = smoothstep(0.0, 0.45, u_p);
  vec3 col = DEEP + nebulosa(rd)*revela + campoEstelar(rd)*revela;

  // Partículas do Céu Vivo, à deriva em profundidade
  float part = smoothstep(0.15, 0.55, u_p);
  for (int i = 0; i < 14; i++){
    float fi = float(i);
    vec3 h = hash33(vec3(fi, 3.0, 7.0));
    vec3 q = vec3((h.x-0.5)*7.0, mod(h.y*6.0 + u_t*0.22, 6.0) - 3.0, -1.0 - h.z*4.0);
    float d = dPonto(ro, rd, q);
    col += mix(BIZ_VERDE, vec3(1.0), 0.35) * smoothstep(0.028, 0.0, d) * 0.30 * part;
  }

  // Constelação: 5 estrelas em profundidades diferentes, acendendo uma a uma
  vec3 ests[5];
  ests[0] = vec3(-2.05, 0.95, -2.4);
  ests[1] = vec3(-1.10,-0.42, -1.9);
  ests[2] = vec3(-0.05, 1.25, -2.7);
  ests[3] = vec3( 1.25,-0.05, -2.1);
  ests[4] = vec3( 2.35, 0.62, -2.9);

  float acende = smoothstep(0.30, 0.70, u_p);
  for (int i = 0; i < 5; i++){
    float f = clamp(acende*5.0 - float(i), 0.0, 1.0);
    if (f <= 0.0) break;
    float d = dPonto(ro, rd, ests[i]);
    col += vec3(1.0) * smoothstep(0.022, 0.0, d) * f;
    col += BIZ_VERDE * smoothstep(0.10, 0.0, d) * 0.55 * f;   // halo curto
    col += BIZ_VERDE * smoothstep(0.26, 0.0, d) * 0.06 * f;   // brilho difuso
  }

  // As linhas da constelação, entre as estrelas — em 3D
  float liga = smoothstep(0.56, 0.88, u_p);
  for (int i = 0; i < 4; i++){
    float f = clamp(liga*4.0 - float(i), 0.0, 1.0);
    if (f <= 0.0) break;
    // O traço se desenha progressivamente entre uma estrela e a seguinte
    vec3 a = ests[i];
    vec3 b = mix(ests[i], ests[i+1], f);
    float dseg = dSegmento(ro, rd, a, b);
    col += BIZ_VERDE * smoothstep(0.008, 0.0, dseg) * 0.75;
    col += BIZ_VERDE * smoothstep(0.030, 0.0, dseg) * 0.07;
  }

  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,

  /* ---- abertura.ecossistema — "versão épica unindo os sistemas".
     Órbitas 3D reais com perspectiva; os três sistemas são recolhidos por
     uma bolha de vidro única. Não é soma de logos. */
  'abertura.ecossistema': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  vec3 ro = vec3(0.0, 0.55, 4.2);
  vec3 alvo = vec3(0.0);
  vec3 f = normalize(alvo - ro);
  vec3 r = normalize(cross(vec3(0.0,1.0,0.0), f));
  vec3 u = cross(f, r);
  vec3 rd = normalize(uv.x*r + uv.y*u + 1.6*f);

  vec3 col = fundo(rd);

  float orb  = smoothstep(0.05, 0.55, u_p);
  float rec  = smoothstep(0.52, 0.84, u_p);
  float R = 1.55*orb*(1.0 - rec);

  // Anéis orbitais em perspectiva: amostrados como elipses 3D
  for (int k = 0; k < 3; k++){
    float fk = float(k);
    float incl = 0.5 + fk*0.55;
    for (int j = 0; j < 32; j++){
      float a0 = float(j)/32.0*2.0*PI;
      float a1 = float(j+1)/32.0*2.0*PI;
      vec3 q0 = vec3(cos(a0)*1.62, sin(a0)*sin(incl)*1.62, sin(a0)*cos(incl)*1.62);
      vec3 q1 = vec3(cos(a1)*1.62, sin(a1)*sin(incl)*1.62, sin(a1)*cos(incl)*1.62);
      float d = dSegmento(ro, rd, q0, q1);      // arcos contínuos, não pontos
      col += VIOLETA * smoothstep(0.010, 0.0, d) * 0.55 * orb * (1.0-rec);
    }
  }

  // Os três sistemas orbitando em 3D
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float a = fi*2.0944 + u_t*1.1;
    vec3 q = vec3(cos(a)*R, sin(a*1.3)*R*0.45, sin(a)*R);
    vec3 cor = i == 0 ? BIZ_VERDE : (i == 1 ? AMBAR : AUR_VIOL);
    float d = dPonto(ro, rd, q);
    col += vec3(1.0) * smoothstep(0.045, 0.0, d) * orb;
    col += cor * smoothstep(0.32, 0.0, d) * 0.9 * orb;
  }

  // A bolha única que recolhe tudo — integração, não justaposição
  float rp = 1.05*rec;
  if (rp > 0.004){
    vec4 v = vidro(ro, rd, vec3(0.0), rp, VIOLETA, AZUL);
    col = mix(col, v.rgb, v.a);
    vec3 oc = ro - vec3(0.0);
    float d = length(cross(rd, normalize(oc)))*length(oc);
    col += mix(VIOLETA, AZUL, 0.5) * smoothstep(rp*2.0, rp, d) * 0.05 * rec;
  }

  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,

  /* ---- abertura.hub — "bolha central com conexões no estilo de neurônios".
     USO INTERNO (§17): o Hub nunca é produto do catálogo.
     Núcleo de luz + anéis violeta/ciano + satélites-bolha (§65.1). */
  'abertura.hub': `
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
  vec3 ro = vec3(0.0, 0.35, 4.0);
  vec3 alvo = vec3(0.0);
  vec3 f = normalize(alvo - ro);
  vec3 r = normalize(cross(vec3(0.0,1.0,0.0), f));
  vec3 u = cross(f, r);
  vec3 rd = normalize(uv.x*r + uv.y*u + 1.6*f);

  vec3 col = fundo(rd);

  float cresce = smoothstep(0.05, 0.45, u_p);
  float rede   = smoothstep(0.28, 0.86, u_p);

  // Conexões neurais em 3D, crescendo do núcleo para fora
  for (int i = 0; i < 10; i++){
    float fi = float(i);
    float fc = clamp(rede*1.6 - fi*0.06, 0.0, 1.0);
    if (fc <= 0.0) break;
    vec3 h = hash33(vec3(fi, 11.0, 3.0)) - 0.5;
    vec3 no = normalize(h)*2.05;

    // A conexão cresce do núcleo para fora, como traço contínuo
    float d = dSegmento(ro, rd, no*0.28, no*fc);
    col += AUR_TEAL * smoothstep(0.012, 0.0, d) * 0.85;
    col += AUR_TEAL * smoothstep(0.055, 0.0, d) * 0.10;   // brilho ao redor

    // satélite-bolha na ponta
    if (fc > 0.9){
      vec4 v = vidro(ro, rd, no, 0.13, AUR_VIOL, AUR_TEAL);
      col = mix(col, v.rgb, v.a);
    }
  }

  // Núcleo de luz + esfera técnica liquid-glass
  float rp = 0.62*cresce;
  if (rp > 0.004){
    vec4 v = vidro(ro, rd, vec3(0.0), rp, AUR_VIOL, AUR_TEAL);
    col = mix(col, v.rgb, v.a);
    vec3 oc = ro;
    float d = length(cross(rd, normalize(oc)))*length(oc);
    col += mix(AUR_VIOL, AUR_TEAL, 0.5) * smoothstep(rp*2.6, rp*0.6, d) * 0.07 * cresce;
  }

  gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
}`,
};

/* ==========================================================================
   Motor 3D
   ========================================================================== */

export class Motor3D {
  /** WebGL disponível neste aparelho?
   *  MEMOIZADO de propósito: cada chamada criava um contexto WebGL novo e não
   *  o liberava. Como tem3D() consulta isto a cada animação, o navegador
   *  estourava o limite de contextos vivos (~16) e passava a recusar TODOS —
   *  inclusive os do Céu Vivo. O teste só falha uma vez; guarde a resposta. */
  static suportado() {
    if (Motor3D._suporte !== undefined) return Motor3D._suporte;
    let ok = false;
    let c = null, gl = null;
    try {
      c = document.createElement('canvas');
      gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        // Sem precisão alta no fragment shader, o vidro e o volume ficam
        // manchados — melhor cair no Canvas 2D do que entregar isso.
        const p = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
        ok = !!p && p.precision > 0;
      }
    } catch { ok = false; }
    finally {
      // Devolve o contexto de sondagem em vez de deixá-lo vivo para sempre.
      try { gl?.getExtension('WEBGL_lose_context')?.loseContext(); } catch { /* ignora */ }
      if (c) { c.width = c.height = 0; }
    }
    Motor3D._suporte = ok;
    return ok;
  }

  static get slots() { return Object.keys(CENAS_GL); }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [opcoes]
   * @param {string} [opcoes.nivel='pleno']  §36
   */
  constructor(canvas, opcoes = {}) {
    if (!canvas?.getContext) throw new TypeError('Motor3D exige um <canvas>.');
    this.canvas = canvas;
    this.nivel = opcoes.nivel || 'pleno';
    this.programas = new Map();
    this._raf = 0;
    this._resolver = null;
    this.perdido = false;

    if (!canvas.style.inlineSize) canvas.style.inlineSize = '100%';
    if (!canvas.style.blockSize) canvas.style.blockSize = '100%';
    if (!canvas.style.display) canvas.style.display = 'block';

    const attrs = { alpha: false, antialias: false, depth: false,
                    powerPreference: 'high-performance', preserveDrawingBuffer: true };
    this.gl = canvas.getContext('webgl', attrs)
           || canvas.getContext('experimental-webgl', attrs);
    if (!this.gl) throw new Error('WebGL indisponível.');

    // Perda de contexto é normal (aba em segundo plano, GPU reiniciada).
    // Quem chama trata como falha e cai no Canvas 2D — §49.3.
    this._onPerda = (ev) => { ev.preventDefault(); this.perdido = true; this.parar(); };
    canvas.addEventListener('webglcontextlost', this._onPerda);

    const gl = this.gl;
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    // Triângulo de tela cheia
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  }

  _compilarShader(tipo, fonte) {
    const gl = this.gl;
    const s = gl.createShader(tipo);
    gl.shaderSource(s, fonte);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(`Falha ao compilar shader: ${log}`);
    }
    return s;
  }

  _programa(slot) {
    if (this.programas.has(slot)) return this.programas.get(slot);
    const corpo = CENAS_GL[slot];
    if (!corpo) throw new RangeError(`Sem cena 3D para o slot: ${slot}`);

    const gl = this.gl;
    const vs = this._compilarShader(gl.VERTEX_SHADER, VS);
    const fs = this._compilarShader(gl.FRAGMENT_SHADER, COMUM + corpo);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(`Falha ao ligar programa: ${log}`);
    }
    const info = {
      prog,
      u_res: gl.getUniformLocation(prog, 'u_res'),
      u_t: gl.getUniformLocation(prog, 'u_t'),
      u_p: gl.getUniformLocation(prog, 'u_p'),
      u_q: gl.getUniformLocation(prog, 'u_q'),
    };
    this.programas.set(slot, info);
    return info;
  }

  _dimensionar() {
    const gl = this.gl;
    // O raymarching custa por pixel: em nível econômico o buffer cai e o
    // navegador escala na composição. Barato e quase imperceptível.
    const teto = this.nivel === 'economico' ? 1 : 2;
    const escala = this.nivel === 'economico' ? 0.75 : 1;
    const dpr = Math.min(devicePixelRatio || 1, teto) * escala;
    const r = this.canvas.getBoundingClientRect();
    const L = Math.max(1, Math.round((r.width || this.canvas.width) * dpr));
    const A = Math.max(1, Math.round((r.height || this.canvas.height) * dpr));
    if (this.canvas.width !== L || this.canvas.height !== A) {
      this.canvas.width = L;
      this.canvas.height = A;
    }
    gl.viewport(0, 0, L, A);
    return [L, A];
  }

  _desenhar(info, p, t) {
    const gl = this.gl;
    const [L, A] = this._dimensionar();
    gl.useProgram(info.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(info.u_res, L, A);
    gl.uniform1f(info.u_t, t);
    gl.uniform1f(info.u_p, p);
    gl.uniform1f(info.u_q, this.nivel === 'economico' ? 0.6 : 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /**
   * Toca a cena 3D de um slot.
   * @returns {Promise<void>} resolve ao terminar
   */
  tocar(slot, duracao = 4000) {
    this.parar();
    const info = this._programa(slot);           // pode lançar: quem chama cai no 2D
    return new Promise((resolve) => {
      const inicio = performance.now();
      let ativo = true;
      this._resolver = () => { ativo = false; resolve(); };
      const laco = (agora) => {
        if (!ativo || this.perdido) { resolve(); return; }
        const dt = (agora - inicio) / 1000;
        const p = Math.min(1, (agora - inicio) / duracao);
        this._desenhar(info, p, dt);
        if (p >= 1) { ativo = false; this._resolver = null; resolve(); return; }
        this._raf = requestAnimationFrame(laco);
      };
      this._raf = requestAnimationFrame(laco);
    });
  }

  /** Pôster estático: o quadro final. §49.3, caminho de movimento reduzido. */
  poster(slot) {
    const info = this._programa(slot);
    this._desenhar(info, 1, 3.2);
  }

  parar() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    if (this._resolver) { this._resolver(); this._resolver = null; }
  }

  destruir() {
    this.parar();
    this.canvas.removeEventListener('webglcontextlost', this._onPerda);
    const gl = this.gl;
    for (const { prog } of this.programas.values()) gl.deleteProgram(prog);
    this.programas.clear();
    gl.deleteBuffer(this.buffer);
    const ext = gl.getExtension('WEBGL_lose_context');
    if (ext) ext.loseContext();
  }
}

export { CENAS_GL };
