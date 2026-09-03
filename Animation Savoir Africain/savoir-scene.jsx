// Composition: "Du savoir que l'on reçoit au savoir que l'on partage"
// Industry design system — steel accent on a light technical ground.
const { CompositionStage, useComposition, Captions, Easing, interpolate, animate, clamp } = window;
const { useTweaks, TweaksPanel, TweakSection, TweakToggle, TweakSlider, TweakRadio } = window;

const W = 1600, H = 900;
const BG = '#f2f2f3';
const INK = '#1d1f20';
const MUTED = '#5d5d60';
const HAIR = 'rgba(29,31,32,0.16)';
const ACC = '#5980a6';
const ACC7 = '#416180';
const ACC9 = '#1d2d3d';
const PAPER = '#f5f5f8';
const FH = '"Barlow Condensed", system-ui, sans-serif';
const FB = 'Barlow, system-ui, sans-serif';

const C = { x: 800, y: 520 };
const PLATE = { w: 340, h: 176 };
const NODE = { w: 212, h: 62 };

const NODES = [
  { label: 'EUROPE', x: 300, y: 300 },
  { label: 'AMÉRIQUE DU NORD', x: 152, y: 520 },
  { label: 'ASIE', x: 1300, y: 300 },
  { label: 'MOYEN-ORIENT', x: 1448, y: 520 },
  { label: 'AMÉRIQUE LATINE', x: 330, y: 762 },
  { label: 'OCÉANIE', x: 1270, y: 762 },
];

const CONN = NODES.map(function (n, i) {
  const dx = C.x - n.x, dy = C.y - n.y, len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const a = { x: n.x + ux * 124, y: n.y + uy * 124 };
  const b = { x: C.x - ux * 208, y: C.y - uy * 208 };
  return {
    i: i, node: n, a: a, b: b,
    ang: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI,
    len: Math.hypot(b.x - a.x, b.y - a.y),
  };
});

// exactly three motion helpers
const MOTION = {
  enter: function (start, dur) { return animate({ from: 0, to: 1, start: start, end: start + (dur || 0.7), ease: Easing.easeOutCubic }); },
  draw: function (start, dur) { return animate({ from: 0, to: 1, start: start, end: start + (dur || 0.9), ease: Easing.easeInOutQuart }); },
  pop: function (start, dur) { return animate({ from: 0, to: 1, start: start, end: start + (dur || 0.5), ease: Easing.easeOutBack }); },
};

const lerp = function (a, b, p) { return a + (b - a) * p; };

function Marks(props) {
  const c = props.color || ACC;
  const o = props.opacity == null ? 1 : props.opacity;
  const s = { position: 'absolute', font: '400 13px ' + FB, lineHeight: 1, color: c, opacity: o };
  return (
    <React.Fragment>
      <span style={Object.assign({ left: -5, top: -7 }, s)}>+</span>
      <span style={Object.assign({ right: -5, top: -7 }, s)}>+</span>
      <span style={Object.assign({ left: -5, bottom: -7 }, s)}>+</span>
      <span style={Object.assign({ right: -5, bottom: -7 }, s)}>+</span>
    </React.Fragment>
  );
}

function Ground(props) {
  const p = props.p;
  return (
    <React.Fragment>
      <div style={{
        position: 'absolute', inset: 0, opacity: p * 0.9,
        backgroundImage:
          'repeating-linear-gradient(to right, rgba(29,31,32,0.055) 0 1px, transparent 1px 48px),' +
          'repeating-linear-gradient(to bottom, rgba(29,31,32,0.055) 0 1px, transparent 1px 48px)',
      }} />
      <div style={{ position: 'absolute', left: 56, top: 44, right: 56, bottom: 44, border: '1px solid ' + HAIR, opacity: p }}>
        <Marks opacity={p} />
      </div>
    </React.Fragment>
  );
}

function Header(props) {
  const p = props.p;
  return (
    <div style={{ position: 'absolute', left: 96, top: 82, width: 720, opacity: p, transform: 'translateY(' + (1 - p) * 14 + 'px)' }}>
      <div style={{ font: '500 13px ' + FB, letterSpacing: '0.22em', color: ACC7, marginBottom: 14 }}>NOTRE VISION</div>
      <div style={{ font: '600 56px ' + FH, letterSpacing: '-0.015em', lineHeight: 1.02, color: INK, textWrap: 'pretty' }}>
        Du savoir que l’on reçoit<br />au savoir que l’on partage
      </div>
    </div>
  );
}

function Legend(props) {
  const rows = [
    { n: '01', t: 'SAVOIR IMPORTÉ' },
    { n: '02', t: 'PRODUIRE · VALORISER · TRANSMETTRE' },
    { n: '03', t: 'SAVOIR EXPORTÉ' },
  ];
  return (
    <div style={{ position: 'absolute', right: 96, top: 88, width: 320, display: 'flex', flexDirection: 'column', gap: 10, opacity: props.p }}>
      {rows.map(function (r, i) {
        const on = props.active === i;
        return (
          <div key={r.n} style={{
            display: 'flex', gap: 12, alignItems: 'baseline', padding: '9px 12px',
            border: '1px solid ' + (on ? ACC : HAIR),
            background: on ? 'rgba(89,128,166,0.10)' : 'transparent',
            transition: 'none',
          }}>
            <span style={{ font: '600 13px ' + FB, letterSpacing: '0.14em', color: on ? ACC7 : 'rgba(29,31,32,0.35)' }}>{r.n}</span>
            <span style={{ font: '600 16px ' + FH, letterSpacing: '0.05em', color: on ? INK : MUTED, opacity: on ? 1 : 0.55 }}>{r.t}</span>
          </div>
        );
      })}
    </div>
  );
}

function Node(props) {
  const p = props.p, hot = props.hot;
  return (
    <div style={{
      position: 'absolute', left: props.n.x - NODE.w / 2, top: props.n.y - NODE.h / 2,
      width: NODE.w, height: NODE.h, display: 'grid', placeItems: 'center',
      border: '1px solid ' + (hot > 0.5 ? ACC : HAIR),
      background: 'rgba(89,128,166,' + (0.10 * hot) + ')',
      opacity: p, transform: 'scale(' + lerp(0.94, 1, p) + ')',
    }}>
      <Marks opacity={p * (0.35 + 0.65 * hot)} />
      <span style={{ font: '600 21px ' + FH, letterSpacing: '0.09em', color: hot > 0.5 ? INK : MUTED, whiteSpace: 'nowrap' }}>{props.n.label}</span>
    </div>
  );
}

function Plate(props) {
  const p = props.p, fill = props.fill;
  return (
    <div style={{
      position: 'absolute', left: C.x - PLATE.w / 2, top: C.y - PLATE.h / 2,
      width: PLATE.w, height: PLATE.h,
      border: '1px solid ' + (fill > 0.2 ? ACC9 : ACC),
      opacity: p, transform: 'scale(' + lerp(0.9, 1, p) + ')',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: ACC9, opacity: fill }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ font: '600 62px ' + FH, letterSpacing: '0.07em', lineHeight: 1, color: fill > 0.5 ? PAPER : INK }}>AFRIQUE</span>
        <span style={{ font: '500 12px ' + FB, letterSpacing: '0.24em', color: fill > 0.5 ? 'rgba(245,245,248,0.72)' : ACC7 }}>PRODUCTION DU SAVOIR</span>
      </div>
      <Marks color={fill > 0.5 ? PAPER : ACC} opacity={p} />
    </div>
  );
}

function Link(props) {
  const c = props.c, rev = props.rev;
  return (
    <div style={{
      position: 'absolute',
      left: rev ? c.b.x : c.a.x, top: rev ? c.b.y : c.a.y,
      width: c.len, height: 1,
      transformOrigin: '0 50%',
      transform: 'rotate(' + (rev ? c.ang + 180 : c.ang) + 'deg) scaleX(' + props.p + ')',
      background: props.strong ? 'rgba(89,128,166,0.7)' : HAIR,
    }} />
  );
}

function Packet(props) {
  const pos = props.pos, solid = props.solid;
  return (
    <div style={{
      position: 'absolute', left: pos.x - 7, top: pos.y - 7, width: 14, height: 14,
      border: '1px solid ' + (solid ? ACC9 : ACC),
      background: solid ? ACC9 : 'transparent',
      opacity: props.o, transform: 'rotate(45deg) scale(' + props.s + ')',
    }} />
  );
}

function Chips(props) {
  const words = ['PRODUIRE', 'VALORISER', 'TRANSMETTRE'];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top: C.y + PLATE.h / 2 + 34,
      display: 'flex', justifyContent: 'center', gap: 14,
    }}>
      {words.map(function (w, i) {
        const p = props.ps[i];
        return (
          <div key={w} style={{
            padding: '7px 16px', border: '1px solid ' + ACC, background: '#eaedf1',
            font: '600 16px ' + FH, letterSpacing: '0.12em', color: ACC7,
            opacity: p, transform: 'translateY(' + (1 - p) * 10 + 'px)',
          }}>{w}</div>
        );
      })}
    </div>
  );
}

function Composition(props) {
  const comp = useComposition();
  const T = comp.T, CUES = comp.CUES, total = comp.authoredTotal;
  const tw = props.tw || {};
  const speed = tw.flowSpeed == null ? 1 : tw.flowSpeed;

  const gOp = interpolate([0, 0.55, total - 0.7, total], [0, 1, 1, 0], Easing.easeInOutSine)(T);
  const groundP = MOTION.enter(0.05, 0.7)(T);
  const headerP = MOTION.enter(0.35, 0.9)(T);
  const legendP = MOTION.enter(1.1, 0.8)(T);
  const plateP = MOTION.pop(0.6, 0.8)(T);

  // phase progressions
  const inFlow = animate({ from: 0, to: 1, start: CUES.Importation - 0.25, end: CUES.Importation + 0.55, ease: Easing.easeOutCubic })(T)
    * animate({ from: 1, to: 0, start: CUES.Bascule - 0.15, end: CUES.Bascule + 0.35, ease: Easing.easeInOutSine })(T);
  const fill = animate({ from: 0, to: 1, start: CUES.Bascule + 0.45, end: CUES.Bascule + 1.25, ease: Easing.easeInOutQuart })(T);
  const outFlow = MOTION.enter(CUES.Rayonnement - 0.15, 0.7)(T);

  const activeLegend = T < CUES.Bascule ? 0 : (T < CUES.Rayonnement ? 1 : 2);

  const links = CONN.map(function (c) {
    const drawIn = MOTION.draw(CUES.Importation - 0.5 + c.i * 0.12, 0.8)(T);
    const drawOut = MOTION.draw(CUES.Rayonnement - 0.35 + c.i * 0.1, 0.7)(T);
    return { c: c, base: drawIn, strong: Math.max(inFlow, outFlow) * Math.max(drawIn, drawOut) };
  });

  // packets — position is a pure function of T
  const packets = [];
  CONN.forEach(function (c) {
    const per = 2.1 / Math.max(0.35, speed);
    for (var k = 0; k < 2; k++) {
      const ph = (c.i * 0.17 + k * 0.5) % 1;
      // inbound: node -> plate
      var pi = ((T - CUES.Importation) / per + ph) % 1;
      if (pi < 0) pi += 1;
      const fadeIn = Math.min(1, pi / 0.12) * Math.min(1, (1 - pi) / 0.14);
      packets.push({
        key: 'i' + c.i + k, solid: false, s: 1,
        o: inFlow * fadeIn,
        pos: { x: lerp(c.a.x, c.b.x, pi), y: lerp(c.a.y, c.b.y, pi) },
      });
      // outbound: plate -> node
      var po = ((T - CUES.Rayonnement) / per + ph) % 1;
      if (po < 0) po += 1;
      const fadeOut = Math.min(1, po / 0.1) * Math.min(1, (1 - po) / 0.16);
      packets.push({
        key: 'o' + c.i + k, solid: true, s: lerp(0.7, 1.05, po),
        o: outFlow * fadeOut,
        pos: { x: lerp(c.b.x, c.a.x, po), y: lerp(c.b.y, c.a.y, po) },
      });
    }
  });

  const chipPs = [0, 1, 2].map(function (i) { return MOTION.pop(CUES.Bascule + 0.55 + i * 0.32, 0.5)(T); });

  const nodeHot = CONN.map(function (c) {
    const arriveIn = inFlow * 0.55;
    const arriveOut = outFlow * MOTION.enter(CUES.Rayonnement + 0.9 + c.i * 0.18, 0.5)(T);
    return clamp(Math.max(arriveIn, arriveOut), 0, 1);
  });

  return (
    <div style={{ position: 'absolute', inset: 0, background: BG, opacity: gOp, fontFamily: FB }}>
      <Ground p={groundP} />
      {tw.showTitle === false ? null : <Header p={headerP} />}
      {tw.showLegend === false ? null : <Legend p={legendP} active={activeLegend} />}

      {links.map(function (l) {
        return (
          <React.Fragment key={'L' + l.c.i}>
            <Link c={l.c} p={l.base} />
            <Link c={l.c} p={l.strong} strong rev={outFlow > 0.5} />
          </React.Fragment>
        );
      })}

      {NODES.map(function (n, i) {
        return <Node key={n.label} n={n} p={MOTION.enter(0.9 + i * 0.13, 0.6)(T)} hot={nodeHot[i]} />;
      })}

      <Plate p={plateP} fill={fill} />
      <Chips ps={chipPs} />

      {packets.map(function (p) {
        return p.o <= 0.01 ? null : <Packet key={p.key} pos={p.pos} solid={p.solid} o={p.o} s={p.s} />;
      })}

      <Captions
        style={{
          left: '12%', right: '12%', bottom: '3%',
          font: '400 27px ' + FB, color: INK, textShadow: 'none', letterSpacing: '0.005em',
        }}
        items={[
          { at: 2.7, until: CUES.Bascule + 0.1, text: 'Pendant longtemps, le savoir consommé sur notre continent venait d’ailleurs.' },
          { at: CUES.Bascule + 0.5, until: CUES.Rayonnement, text: 'Aujourd’hui : produire, valoriser et transmettre un savoir issu de nos talents et de nos réalités.' },
          { at: CUES.Rayonnement + 0.5, until: CUES.Rayonnement + 2.6, text: 'Des contenus et des solutions capables de dépasser nos frontières.' },
          { at: CUES.Rayonnement + 2.8, text: 'L’Afrique n’est pas seulement une destination du savoir : elle en devient une source.' },
        ]}
      />
    </div>
  );
}

function SavoirPiece() {
  const t = useTweaks(window.TWEAK_DEFAULTS || {});
  const vals = t[0], setTweak = t[1];
  return (
    <React.Fragment>
      <CompositionStage width={W} height={H} bg={BG} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
        <Composition tw={vals} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Animation" />
        <TweakSlider label="Vitesse des flux" value={vals.flowSpeed} min={0.4} max={2} step={0.1}
          onChange={function (v) { setTweak('flowSpeed', v); }} />
        <TweakToggle label="Légende 01·02·03" value={vals.showLegend}
          onChange={function (v) { setTweak('showLegend', v); }} />
        <TweakToggle label="Titre dans l’animation" value={vals.showTitle}
          onChange={function (v) { setTweak('showTitle', v); }} />
        <TweakSection label="Outils" />
        <TweakToggle label="Motion editor" value={vals.motionEditor}
          onChange={function (v) { setTweak('motionEditor', v); }} />
      </TweaksPanel>
    </React.Fragment>
  );
}

window.SavoirPiece = SavoirPiece;
