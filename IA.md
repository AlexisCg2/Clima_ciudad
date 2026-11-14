# Gobernanza y Auditoría de Inteligencia Artificial (IA.md)

**Proyecto:** `09-clima-por-ciudad`  
**Asignatura:** Desarrollo Web / Proyecto Académico  
**Responsable del Proyecto (Estudiante):** Desarrollador y Evaluador Principal  
**Herramienta de Asistencia:** Antigravity Agent Platform (Google DeepMind) con modelo Gemini 3.8 Flash (High)

---

## 1. Declaración de Responsabilidad y Rol de la IA

La Inteligencia Artificial actúa estrictamente como un **asistente técnico de apoyo bajo supervisión interactiva**. 
* Toda propuesta arquitectónica, esquema de datos, código fuente y prueba automatizada es analizada, validada y defendida por el estudiante.
* La IA no tiene autonomía para tomar decisiones arquitectónicas de fondo, instalar dependencias, alterar el control de versiones ni desplegar software sin autorización humana.
* Todo código incorporado al proyecto debe ser comprendido en su totalidad por el estudiante para su sustentación académica en vivo.

---

## 2. Modelo de Contención y Fronteras de Seguridad

El proyecto implementa una estrategia de contención en dos capas bien diferenciadas:

1. **Capa del Asistente (Host Windows):**
   * El arnés de Antigravity opera en Windows con permisos estándar de usuario.
   * La seguridad conductual está regida por `AGENTS.md` y supervisada interactivamente por el estudiante.
   * No se asume contención por Docker para las herramientas nativas del agente que se ejecutan en Windows.
2. **Capa del Entorno de Ejecución (Contenedor Docker / DevContainer):**
   * Entorno Linux (`node:22-bookworm-slim`) diseñado para compilar, ejecutar pruebas y ejecutar dependencias bajo `--network none`.
   * **Estado:** Esta capa se encuentra actualmente **diseñada y documentada, pero pendiente de implementación física y verificación técnica**, ya que Docker Desktop y WSL2 aún no han sido desplegados en el host.
   * Una vez desplegado, los archivos de gobernanza (`AGENTS.md`, `IA.md`, `.gitignore`, `ia/`) se montarán como solo lectura a nivel de kernel VFS (`EROFS`), sin socket de Docker y con `--cap-drop=ALL`.

---

## 3. Estado de la Auditoría y Evidencias

* **Bitácora de IA:** Cada interacción relevante, prompt, validación humana y decisión técnica queda registrada cronológicamente en `ia/BITACORA.md`.
* **Configuración de Seguridad:** Documentada en detalle en `ia/CONFIGURACION.md`.
* **Pruebas de Contención:** Batería de pruebas técnicas (T-01 a T-06) y pruebas conductuales del canario registradas en `ia/PRUEBAS-CONTENCION.md`.
* **Protocolo de Secreto Canario:** El canario de auditoría jamás se almacena en texto plano ni se expone al modelo; se valida mediante comprobación ciega y hashes SHA-256.
