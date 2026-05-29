// ============================================================
// lib/validar-cedula.ts — Validación Cédula Ecuatoriana
// Algoritmo Módulo 10 (Dígito Verificador)
// ============================================================
// IMPORTANTE: Las cédulas se manejan como STRING (TEXT en DB)
// para preservar ceros iniciales (ej: "0912345678").
// NUNCA convertir a Number antes de validar.
// ============================================================

/**
 * Resultado de la validación de cédula
 */
export interface ResultadoValidacion {
  valida: boolean;
  error?: string;
}

/**
 * Valida una cédula ecuatoriana usando el Módulo 10.
 * Acepta cédulas que empiezan con 0 (zona rural, etc.)
 *
 * @param cedula - String de 10 dígitos (puede iniciar en 0)
 * @returns Objeto con resultado y mensaje de error opcional
 */
export function validarCedula(cedula: string): ResultadoValidacion {
  // Limpiar espacios
  const cedulaLimpia = cedula.trim();

  // Verificar que sea string de exactamente 10 dígitos
  if (!/^\d{10}$/.test(cedulaLimpia)) {
    return {
      valida: false,
      error: "La cédula debe tener exactamente 10 dígitos.",
    };
  }

  // Verificar provincia válida (01-24 y 30)
  const provincia = parseInt(cedulaLimpia.substring(0, 2), 10);
  if ((provincia < 1 || provincia > 24) && provincia !== 30) {
    return {
      valida: false,
      error: "El código de provincia no es válido.",
    };
  }

  // El tercer dígito debe ser menor a 6 (personas naturales)
  const tercerDigito = parseInt(cedulaLimpia[2], 10);
  if (tercerDigito >= 6) {
    return {
      valida: false,
      error: "El tercer dígito debe ser menor a 6 para personas naturales.",
    };
  }

  // Aplicar coeficientes Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let producto = parseInt(cedulaLimpia[i], 10) * coeficientes[i];
    if (producto > 9) {
      producto -= 9;
    }
    suma += producto;
  }

  // Calcular dígito verificador esperado
  const digitoVerificador = (10 - (suma % 10)) % 10;
  const digitoReal = parseInt(cedulaLimpia[9], 10);

  if (digitoVerificador !== digitoReal) {
    return {
      valida: false,
      error: "La cédula no es válida (dígito verificador incorrecto).",
    };
  }

  return { valida: true };
}

/**
 * Versión booleana simple para uso en condicionales
 */
export function esCedulaValida(cedula: string): boolean {
  return validarCedula(cedula).valida;
}

/**
 * Valida que un número de teléfono ecuatoriano sea válido.
 * Formato: 10 dígitos, inicia en 0 (ej: 0987654321).
 * Se almacena como TEXT para preservar el 0 inicial.
 */
export function validarTelefono(telefono: string): ResultadoValidacion {
  const telefonoLimpio = telefono.trim();

  if (!/^\d{10}$/.test(telefonoLimpio)) {
    return {
      valida: false,
      error: "El teléfono debe tener 10 dígitos.",
    };
  }

  if (!telefonoLimpio.startsWith("0")) {
    return {
      valida: false,
      error: "El número de teléfono debe iniciar con 0 (ej: 0987654321).",
    };
  }

  return { valida: true };
}
