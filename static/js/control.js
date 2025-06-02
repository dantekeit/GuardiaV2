/* ===============================
   1) Variables globales
   =============================== */
const days = ['Sábado', 'Domingo'];
const timeCols = days.flatMap(d => [`Ingreso ${d}`, `Egreso ${d}`]);
const allCols = JSON.parse(document
  .getElementById('allColsData')
  .textContent); // inyectamos columns desde el HTML

/* ===============================
   2) Funciones auxiliares
   =============================== */
function isFree(el, day) {
  const inVal = el.querySelector(`[data-col="Ingreso ${day}"]`).value;
  const egVal = el.querySelector(`[data-col="Egreso ${day}"]`).value;
  return (!inVal || inVal === '00:00') && (!egVal || egVal === '00:00');
}

function canSwapFranco(aEl, bEl) {
  const fsA = isFree(aEl, 'Sábado'), fsB = isFree(bEl, 'Sábado');
  const fdA = isFree(aEl, 'Domingo'), fdB = isFree(bEl, 'Domingo');
  return (fsA !== fsB) || (fdA !== fdB);
}

function canSwapHorario(aEl, bEl) {
  return days.some(d => {
    const worksA = !isFree(aEl, d);
    const worksB = !isFree(bEl, d);
    return worksA && worksB;
  });
}

function swapCell(aEl, bEl, col) {
  const inpA = aEl.querySelector(`[data-col="${col}"]`);
  const inpB = bEl.querySelector(`[data-col="${col}"]`);
  if (inpA && inpA.type === 'time') {
    [inpA.value, inpB.value] = [inpB.value, inpA.value];
  } else {
    const tdA = aEl.querySelector(`[data-col="${col}"]`);
    const tdB = bEl.querySelector(`[data-col="${col}"]`);
    [tdA.textContent, tdB.textContent] = [tdB.textContent, tdA.textContent];
  }
}

/* ===============================
   3) Al cargar el DOM: poblar selects y listeners
   =============================== */
document.addEventListener('DOMContentLoaded', () => {
  // Seleccionamos todas las filas (<tr>) y las guardamos en un array
  const rows = Array.from(document.querySelectorAll('tbody tr'))
                    .map(tr => ({ el: tr }));

  // Para cada fila, llenamos el <select class="swap-select"> con los nombres del mismo “Segmento”
  rows.forEach(r => {
    const sel = r.el.querySelector('.swap-select');
    const seg = r.el.dataset.segmento;
    rows
      .filter(o => o.el.dataset.segmento === seg && o.el !== r.el)
      .forEach(o => {
        const name = o.el.querySelector('[data-col="Nombre"]').textContent.trim();
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });

    // Listener para manejar cuando el usuario elige a quién intercambiar
    sel.addEventListener('change', e => {
      const other = rows.find(o =>
        o.el.querySelector('[data-col="Nombre"]').textContent.trim() === e.target.value
      );
      const type = r.el.querySelector('.type-select').value;
      if (other) {
        if (type === 'franco') {
          if (!canSwapFranco(r.el, other.el)) {
            alert('No se puede intercambiar franco: mismo día libre');
          } else {
            [...allCols, ...timeCols].forEach(c =>
              swapCell(r.el, other.el, c)
            );
          }
        } else {
          if (!canSwapHorario(r.el, other.el)) {
            alert('No se puede intercambiar horario: no comparten jornada');
          } else {
            days.forEach(d => {
              swapCell(r.el, other.el, `Ingreso ${d}`);
              swapCell(r.el, other.el, `Egreso ${d}`);
            });
          }
        }
      }
      // Limpiamos el <select> para que no quede seleccionada la opción
      e.target.value = '';
    });
  });

  // Listener para el botón “Generar Guardia”
  document.getElementById('generateBtn').addEventListener('click', () => {
    const finalData = rows.map(r => {
      const obj = {};
      allCols.forEach(c => {
        if (timeCols.includes(c)) {
          obj[c] = r.el.querySelector(`[data-col="${c}"]`).value;
        } else {
          obj[c] = r.el.querySelector(`[data-col="${c}"]`).textContent.trim();
        }
      });
      obj.observacion = r.el.querySelector('.obs-initial').value.trim();
      return obj;
    });
    localStorage.setItem('guardiaData', JSON.stringify(finalData));
    window.location.href = '/guardia';
  });
});
