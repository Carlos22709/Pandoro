// Circular SIC 002 de 2024: al modelo solo va lo necesario para planificar. Quita correos y
// números largos (teléfonos, documentos). No detecta nombres; por eso la pantalla también lo advierte.
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
// Siete dígitos o más, con espacios, puntos o guiones sueltos entre ellos.
const LONG_NUMBER = /\+?\d(?:[ .-]?\d){6,}/g;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function redactPersonalData(text: string) {
  return text
    .replace(EMAIL, '[correo]')
    .replace(LONG_NUMBER, (match) => (ISO_DATE.test(match) ? match : '[número]'));
}
