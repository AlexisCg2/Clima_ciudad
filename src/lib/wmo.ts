import type { CondicionClimatica } from '../types/clima';

/**
 * Mapeo oficial de códigos meteorológicos WMO (World Meteorological Organization)
 * utilizados por la API de Open-Meteo.
 * Devuelve descripciones accesibles en español e identificadores semánticos de iconos.
 */

interface DefinicionWmo {
  descripcion: string;
  icono: string;
}

const TABLA_WMO: Record<number, DefinicionWmo> = {
  0: { descripcion: 'Cielo despejado', icono: 'sol' },
  1: { descripcion: 'Principalmente despejado', icono: 'sol-nube' },
  2: { descripcion: 'Parcialmente nublado', icono: 'sol-nube' },
  3: { descripcion: 'Nublado', icono: 'nube' },
  45: { descripcion: 'Niebla', icono: 'niebla' },
  48: { descripcion: 'Niebla con escarcha', icono: 'niebla' },
  51: { descripcion: 'Llovizna ligera', icono: 'llovizna' },
  53: { descripcion: 'Llovizna moderada', icono: 'llovizna' },
  55: { descripcion: 'Llovizna densa', icono: 'llovizna' },
  56: { descripcion: 'Llovizna helada ligera', icono: 'llovizna-helada' },
  57: { descripcion: 'Llovizna helada densa', icono: 'llovizna-helada' },
  61: { descripcion: 'Lluvia ligera', icono: 'lluvia-ligera' },
  63: { descripcion: 'Lluvia moderada', icono: 'lluvia' },
  65: { descripcion: 'Lluvia fuerte', icono: 'lluvia-fuerte' },
  66: { descripcion: 'Lluvia helada ligera', icono: 'lluvia-helada' },
  67: { descripcion: 'Lluvia helada fuerte', icono: 'lluvia-helada' },
  71: { descripcion: 'Nevada ligera', icono: 'nieve' },
  73: { descripcion: 'Nevada moderada', icono: 'nieve' },
  75: { descripcion: 'Nevada fuerte', icono: 'nieve-fuerte' },
  77: { descripcion: 'Granos de nieve', icono: 'nieve' },
  80: { descripcion: 'Chubascos ligeros', icono: 'chubascos' },
  81: { descripcion: 'Chubascos moderados', icono: 'chubascos' },
  82: { descripcion: 'Chubascos violentos', icono: 'chubascos-fuertes' },
  85: { descripcion: 'Chubascos de nieve ligeros', icono: 'chubascos-nieve' },
  86: { descripcion: 'Chubascos de nieve fuertes', icono: 'chubascos-nieve' },
  95: { descripcion: 'Tormenta eléctrica', icono: 'tormenta' },
  96: { descripcion: 'Tormenta eléctrica con granizo ligero', icono: 'tormenta-granizo' },
  99: { descripcion: 'Tormenta eléctrica con granizo fuerte', icono: 'tormenta-granizo' },
};

/**
 * Obtiene la condición climática en español y el icono correspondiente a un código WMO.
 *
 * @param codigo Código numérico WMO emitido por Open-Meteo.
 * @returns Objeto CondicionClimatica { codigoWmo, descripcion, icono }.
 */
export function obtenerCondicionWmo(codigo: number): CondicionClimatica {
  const definicion = TABLA_WMO[codigo];
  if (definicion) {
    return {
      codigoWmo: codigo,
      descripcion: definicion.descripcion,
      icono: definicion.icono,
    };
  }

  return {
    codigoWmo: codigo,
    descripcion: 'Condición climática no especificada',
    icono: 'clima-desconocido',
  };
}
