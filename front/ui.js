const claseFila = (categoria) => {
  const key = (categoria || '').toString().toLowerCase();
  if (key === 'urgente') return 'alerta-urgente';
  if (key === 'medio') return 'alerta-medio';
  if (key === 'aviso') return 'alerta-aviso';
  return '';
};

const formatearFecha = (valor) => {
  if (!valor) return '-';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? valor : fecha.toLocaleDateString('es-AR');
};

export const mostrarSeccion = (nombre) => {
  const objetivo = `seccion-${nombre}`;
  document.querySelectorAll('.seccion').forEach((seccion) => {
    seccion.classList.toggle('activa', seccion.id === objetivo);
  });
};

export const marcarTabActiva = (tabs, nombre) => {
  tabs.forEach((btn) => {
    btn.classList.toggle('activa', btn.dataset.seccion === nombre);
  });
};

export const actualizarMensaje = (elemento, mensaje, tipo = 'info') => {
  if (!elemento) return;
  elemento.textContent = mensaje || '';
  elemento.className = 'mensaje';
  if (mensaje) {
    elemento.classList.add('activo', tipo);
  }
};

export const renderizarTabla = (alertas, contenedor, onSolicitarDevolucion) => {
  contenedor.innerHTML = '';

  if (!Array.isArray(alertas) || alertas.length === 0) {
    const vacio = document.createElement('div');
    vacio.className = 'tabla-empty';
    vacio.textContent = 'Sin alertas pendientes. Buen trabajo!';
    contenedor.appendChild(vacio);
    return;
  }

  const tabla = document.createElement('table');
  const thead = document.createElement('thead');
  const encabezado = document.createElement('tr');
  ['Producto', 'Lote', 'Vencimiento', 'Cant. actual', 'Categoria', 'Dias restantes', 'Acciones'].forEach((titulo) => {
    const th = document.createElement('th');
    th.textContent = titulo;
    encabezado.appendChild(th);
  });
  thead.appendChild(encabezado);
  tabla.appendChild(thead);

  const tbody = document.createElement('tbody');

  alertas.forEach((alerta) => {
    const fila = document.createElement('tr');
    const clase = claseFila(alerta.categoria_alerta);
    if (clase) fila.classList.add(clase);

    const celdas = [
      alerta.nombre_producto,
      alerta.nro_lote,
      formatearFecha(alerta.fecha_vencimiento),
      alerta.cantidad_actual,
      alerta.categoria_alerta,
      alerta.dias_restantes,
    ];

    celdas.forEach((valor, idx) => {
      const td = document.createElement('td');
      if (idx === 4) {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = valor || '-';
        td.appendChild(chip);
      } else {
        td.textContent = valor ?? '-';
      }
      fila.appendChild(td);
    });

    const accionesTd = document.createElement('td');
    const btn = document.createElement('button');
    btn.className = 'btn secundario';
    btn.type = 'button';
    btn.textContent = 'Registrar devolucion';
    btn.addEventListener('click', () => onSolicitarDevolucion(alerta));

    accionesTd.appendChild(btn);
    fila.appendChild(accionesTd);
    tbody.appendChild(fila);
  });

  tabla.appendChild(tbody);
  contenedor.appendChild(tabla);
};

export const renderizarResumen = (alertas, contenedor) => {
  contenedor.innerHTML = '';
  if (!Array.isArray(alertas) || alertas.length === 0) {
    const vacio = document.createElement('div');
    vacio.className = 'tabla-empty';
    vacio.textContent = 'Sin vencimientos proximos.';
    contenedor.appendChild(vacio);
    return;
  }

  const ordenados = [...alertas].sort((a, b) => (a.dias_restantes ?? 9999) - (b.dias_restantes ?? 9999));
  const top = ordenados.slice(0, 6);

  top.forEach((alerta) => {
    const card = document.createElement('article');
    card.className = `resumen-card ${claseFila(alerta.categoria_alerta)}`;

    const header = document.createElement('div');
    header.className = 'resumen-card-head';
    const nombre = document.createElement('h4');
    nombre.textContent = alerta.nombre_producto || 'Producto';
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = alerta.categoria_alerta || 'AVISO';
    header.append(nombre, chip);

    const lote = document.createElement('p');
    lote.className = 'resumen-meta';
    lote.textContent = `Lote ${alerta.nro_lote}`;

    const fecha = document.createElement('p');
    fecha.className = 'resumen-meta';
    fecha.textContent = `Vence: ${formatearFecha(alerta.fecha_vencimiento)}`;

    const dias = document.createElement('p');
    dias.className = 'resumen-dias';
    dias.textContent = `${alerta.dias_restantes ?? '-'} días restantes`;

    const cantidad = document.createElement('p');
    cantidad.className = 'resumen-meta';
    cantidad.textContent = `Cantidad: ${alerta.cantidad_actual ?? '-'}`;

    card.append(header, lote, fecha, dias, cantidad);
    contenedor.appendChild(card);
  });
};
