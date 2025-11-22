import { BASE_API_URL, AUTH_API_URL } from './config.js';

let authToken = null;

const jsonHeaders = {
  'Content-Type': 'application/json',
};

const authHeaders = () => (authToken ? { Authorization: `Bearer ${authToken}` } : {});

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
    headers: { ...jsonHeaders, ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return parseResponse(response);
};

export const obtenerAlertas = async () => {
  const response = await fetch(`${BASE_API_URL}/alertas`, {
    headers: { ...authHeaders() },
  });
  return parseResponse(response);
};

export const registrarDevolucion = async (loteId, cantidad) => {
  const response = await fetch(`${BASE_API_URL}/devolver`, {
    method: 'PATCH',
    headers: { ...jsonHeaders, ...authHeaders() },
    body: JSON.stringify({
      lote_id: Number(loteId),
      cantidad_devuelta: Number(cantidad),
    }),
  });
  return parseResponse(response);
};

export const login = async (correo, contrasena) => {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ correo, contrasena }),
  });
  return parseResponse(response);
};

export const setAuthToken = (token) => {
  authToken = token || null;
};
