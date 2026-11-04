/**
 * Reads an API response safely and reports HTML/proxy/fallback responses clearly.
 * This prevents JSON.parse errors such as "Unexpected token '<'" from hiding
 * the actual backend or deployment problem.
 */
export async function readApiJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const trimmed = body.trim();

  if (!trimmed) {
    throw new Error(`El backend devolvió una respuesta vacía (HTTP ${response.status}). Compruebe que el servicio API esté activo.`);
  }

  const looksLikeHtml = /^(<!doctype\\s+html|<html|<head|<body)/i.test(trimmed);
  if (looksLikeHtml || contentType.toLowerCase().includes('text/html')) {
    throw new Error(`El endpoint de API devolvió HTML en lugar de JSON (HTTP ${response.status}). Esto suele indicar que el backend no está conectado, que la ruta /api no existe en el despliegue o que un proxy está redirigiendo la petición. Verifique que el servidor Express esté ejecutándose junto con el frontend.`);
  }

  let data: any;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error(`El backend devolvió una respuesta que no es JSON (HTTP ${response.status}, Content-Type: ${contentType || 'no especificado'}). Inicio de respuesta: ${trimmed.slice(0, 100)}`);
  }

  if (!response.ok) {
    const message = data && typeof data === 'object' ? data.error || data.message : null;
    throw new Error(message || `Error HTTP ${response.status} al consultar el backend.`);
  }

  return data as T;
}
