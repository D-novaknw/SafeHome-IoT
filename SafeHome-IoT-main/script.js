/* ---------- Navegación entre secciones ---------- */
const paginas = document.querySelectorAll('.page');
const botonesNav = document.querySelectorAll('.nav-btn');

function ir(id, guardar = true) {
  if (!document.getElementById(id)) id = 'inicio';
  // Las páginas de detalle (el-...) mantienen resaltado "Elementos"
  const seccion = id.startsWith('el-') ? 'elementos' : id;
  paginas.forEach(p => p.classList.toggle('active', p.id === id));
  botonesNav.forEach(b => {
    const activo = b.dataset.page === seccion;
    b.classList.toggle('active', activo);
    b.setAttribute('aria-current', activo ? 'page' : 'false');
  });
  window.scrollTo({ top: 0 });
  if (guardar) { try { history.pushState(null, '', '#' + id); } catch (e) {} }
}

document.querySelectorAll('[data-page]').forEach(b =>
  b.addEventListener('click', e => {
    e.preventDefault();
    ir(b.dataset.page);
  })
);
window.addEventListener('popstate', () => ir(location.hash.slice(1) || 'inicio', false));
ir(location.hash.slice(1) || 'inicio', false);

/* ---------- Estado del sistema (compartido entre Inicio y SFH) ---------- */
const s = { sismo: false, luz: true, gas: true, led: false, buzzer: false, iot: true };
const historial = [];
const mensajes = [];
const hora = () => new Date().toLocaleTimeString('es-MX', { hour12: false });

function log(texto) {
  historial.unshift({ h: hora(), t: texto });
  historial.length = Math.min(historial.length, 30);
}

function enviar(evento) {
  if (!s.iot) { log('Sin conexión: la alerta no se pudo enviar'); return; }
  mensajes.unshift(`{"dispositivo":"SFH-01","evento":"${evento}","hora":"${hora()}"}`);
  mensajes.length = Math.min(mensajes.length, 4);
}

const espera = ms => new Promise(r => setTimeout(r, ms));

async function prueba() {
  const pasos = [...document.querySelectorAll('.test li')];
  const boton = document.querySelector('[data-act="test"]');
  const res = document.querySelector('.result');
  boton.disabled = true;
  pasos.forEach(p => p.classList.remove('ok'));
  res.textContent = 'Probando...';
  for (const p of pasos) { await espera(550); p.classList.add('ok'); }
  res.textContent = 'Prueba completada: todos los componentes respondieron.';
  boton.disabled = false;
  log('Prueba de funcionamiento completada');
  render();
}

const acciones = {
  sim() {
    s.sismo = !s.sismo;
    s.luz = s.gas = !s.sismo;
    s.led = s.buzzer = s.sismo;
    log(s.sismo ? 'Sismo fuerte detectado: electricidad y gas cortados, alarma activada' : 'Sistema restablecido');
    enviar(s.sismo ? 'sismo_detectado' : 'sistema_restablecido');
  },
  gas()    { s.gas = !s.gas;       log(s.gas ? 'Válvula de gas abierta manualmente' : 'Válvula de gas cerrada manualmente'); },
  luz()    { s.luz = !s.luz;       log(s.luz ? 'Electricidad conectada manualmente' : 'Electricidad cortada manualmente'); },
  led()    { s.led = !s.led;       log(s.led ? 'Indicador LED encendido' : 'Indicador LED apagado'); },
  buzzer() { s.buzzer = !s.buzzer; log(s.buzzer ? 'Buzzer activado' : 'Buzzer silenciado'); },
  iot()    { s.iot = !s.iot;       log(s.iot ? 'Conexión IoT restablecida' : 'Conexión IoT perdida'); },
  limpiar() { historial.length = 0; },
  test: prueba
};

document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (!a) return;
  acciones[a.dataset.act]();
  render();
});

/* ---------- Mostrar el estado en pantalla ---------- */
function render() {
  const B = {
    estado: [s.sismo ? '¡Sismo fuerte detectado! Electricidad y gas cortados.' : 'Sensor en vigilancia. Sin movimiento fuerte.', !s.sismo],
    luz: [s.luz ? 'Conectada' : 'Cortada', s.luz],
    gas: [s.gas ? 'Abierto' : 'Cerrado', s.gas],
    led: [s.led ? 'Encendido' : 'Apagado', !s.led],
    buzzer: [s.buzzer ? 'Sonando' : 'Silencio', !s.buzzer],
    iot: [s.iot ? 'Conectado' : 'Sin conexión', s.iot],
    simbtn: [s.sismo ? 'Restablecer sistema' : 'Simular sismo', true],
    gasbtn: [s.gas ? 'Cerrar válvula' : 'Abrir válvula', true],
    luzbtn: [s.luz ? 'Cortar electricidad' : 'Conectar electricidad', true],
    ledbtn: [s.led ? 'Apagar LED' : 'Encender LED', true],
    buzzerbtn: [s.buzzer ? 'Silenciar buzzer' : 'Activar buzzer', true],
    iotbtn: [s.iot ? 'Desconectar' : 'Conectar', true]
  };
  document.querySelectorAll('[data-bind]').forEach(el => {
    const v = B[el.dataset.bind];
    if (!v) return;
    el.textContent = v[0];
    el.dataset.ok = v[1];
  });
  document.querySelectorAll('.demo').forEach(d => d.classList.toggle('alerta', s.sismo));
  document.querySelectorAll('.lamp').forEach(l => l.classList.toggle('on', s.led));
  document.querySelectorAll('.bell').forEach(l => l.classList.toggle('on', s.buzzer));
  document.querySelector('.historial').innerHTML = historial.length
    ? historial.map(e => `<li><time>${e.h}</time>${e.t}</li>`).join('')
    : '<li class="vacio">Aún no hay eventos. Simula un sismo o inicia una prueba.</li>';
  document.querySelector('.msgs').textContent = mensajes.length ? mensajes.join('\n') : 'Esperando mensajes…';
}

/* ---------- Onda del sismógrafo ---------- */
const ondas = document.querySelectorAll('.onda');
const N = 80;
const y = new Array(N).fill(55);

function dibujar() {
  const amplitud = s.sismo ? 44 : 5;
  y.shift();
  y.push(55 + (Math.random() - 0.5) * 2 * amplitud);
  const puntos = y.map((v, i) => `${(i * 400 / (N - 1)).toFixed(1)},${v.toFixed(1)}`).join(' ');
  ondas.forEach(o => o.setAttribute('points', puntos));
}

const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches;
setInterval(dibujar, reducir ? 600 : 60);
render();