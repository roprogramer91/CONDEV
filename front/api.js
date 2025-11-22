import { BASE_API_URL } from './config.js';

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const mensaje = data?.error || data?.mensaje || 'Error en la peticion';
    throw new Error(mensaje);
  }
  return data;
};

export const registrarItem = async (payload) => {
  const response = await fetch(`${BASE_API_URL}/cargar`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const obtenerAlertas = async () => {
  const response = await fetch(`${BASE_API_URL}/alertas`);
  return parseResponse(response);
};

export const registrarDevolucion = async (loteId, cantidad) => {
  const response = await fetch(`${BASE_API_URL}/devolver`, {
    method: 'PATCH',
    headers: jsonHeaders,
    body: JSON.stringify({
      lote_id: Number(loteId),
      cantidad_devuelta: Number(cantidad),
    }),
  });
  return parseResponse(response);
};
