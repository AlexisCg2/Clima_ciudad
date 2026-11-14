# Especificación de Configuración de Seguridad y Contención

**Documento:** `ia/CONFIGURACION.md`  
**Proyecto:** `09-clima-por-ciudad`  
**Estado:** Preparación de Arquitectura de Seguridad (Pendiente de despliegue de Docker)

---

## 1. Arquitectura de Aislamiento y Topología

El entorno técnico del proyecto se divide en dos planos con responsabilidades y límites distintos:

### Plano 1: Orquestación del Asistente (Host Windows)
* **Sistema Operativo:** Windows 11.
* **Proceso del Agente:** Antigravity Platform Desktop App.
* **Shell de Herramientas:** PowerShell.
* **Controles Observados Empíricamente en el Host:**
  * Se verificó que comandos de red como `Test-NetConnection` hacia `1.1.1.1:80` fallan por defecto dentro del modo sandbox estándar.
  * Se verificó que las operaciones de escritura fuera del workspace (ej. crear archivos en `Downloads/`) son bloqueadas con `UnauthorizedAccessException`.
  * *Limitación observada:* La lectura y listado de directorios superiores (`Get-ChildItem ..`) sí fue permitida en PowerShell. No se puede afirmar que todas las herramientas o comandos en el host carezcan de acceso a red sin una auditoría exhaustiva de cada binario individual.
* **Controles Pendientes de Verificación:**
  * La contención estricta de terminal y ejecución depende del despliegue del contenedor Linux.
  * El control de integridad actual en el host descansa en la supervisión humana y la posterior inicialización de Git.

### Plano 2: Entorno de Ejecución Hermético (Contenedor Docker / DevContainer)
* **Estado:** Diseñado, pero **pendiente de despliegue y verificación física** (Docker y WSL2 no están instalados aún en el host).
* **Imagen Base:** `node:22-bookworm-slim` (Debian GNU/Linux 12).
* **Usuario en Ejecución:** `node` (UID: 1000, GID: 1000). Usuario sin privilegios y sin acceso a `sudo`.
* **Mecanismos de Kernel de Linux (en tiempo de ejecución):**
  * `--security-opt=no-new-privileges:true`: Impide la escalada mediante binarios `setuid`/`setgid`.
  * `--cap-drop=ALL`: Elimina todas las capacidades administrativas del kernel (sin `CAP_SYS_ADMIN`, `CAP_NET_ADMIN`, etc.).
  * `--network=none`: Red WAN completamente bloqueada (sin gateway por defecto ni DNS externo). Loopback (`127.0.0.1`) habilitado para desarrollo web local.
    * **Alcance de `--network=none`:** Esta directiva rige exclusivamente para el **contenedor en tiempo de ejecución (runtime)** durante el desarrollo y ejecución de pruebas. **No implica que el proceso de construcción de imágenes (`docker build`) carezca de acceso a Internet**, ya que la fase de build requiere conectividad en el host para descargar la imagen base de Debian y los paquetes de dependencias iniciales (`ca-certificates`, `git`).
  * Socket Docker: **No montado** (`/var/run/docker.sock` inexistente en el contenedor).

---

## 2. Mapa de Montajes y Mecánica VFS

La estructura de montajes definida en `.devcontainer/devcontainer.json` utiliza la capacidad de sub-montajes del Kernel de Linux para aislar la gobernanza:

| Punto de Montaje en Contenedor | Tipo de Montaje | Flag VFS Kernel | Propiedad / Permisos | Propósito |
|---|---|---|---|---|
| `/workspace` | Bind Mount | `rw` (Read/Write) | `node:node` | Código de la aplicación, esquemas, componentes y pruebas. |
| `/workspace/node_modules` | Named Volume | `rw` (Read/Write) | `node:node` | Dependencias aisladas del sistema de archivos del host. |
| `/workspace/AGENTS.md` | Bind Mount | `ro` (Read-Only) | `MS_RDONLY` | Directivas inmutables; escrituras abortadas con `EROFS`. |
| `/workspace/IA.md` | Bind Mount | `ro` (Read-Only) | `MS_RDONLY` | Resumen de gobernanza inmutable. |
| `/workspace/.gitignore` | Bind Mount | `ro` (Read-Only) | `MS_RDONLY` | Reglas de exclusión inmutables; eliminación abortada con `EBUSY`/`EROFS`. |
| `/workspace/ia` | Bind Mount | `ro` (Read-Only) | `MS_RDONLY` | Directorio de evidencias y bitácora protegido contra alteraciones. |

---

## 3. Política de Secretos y Variables de Entorno

1. **Variables de Servidor (Privilegiadas):** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`. Residen exclusivamente en el entorno de ejecución de producción (Vercel) o en `.env.local` temporal en el host, ignorado por Git.
2. **Variables Públicas de Cliente:** `NEXT_PUBLIC_FIREBASE_*`. Exclusivamente para configuración web pública de Firebase Auth.
3. **Manejo del Canario:** El valor secreto de auditoría jamás se almacena en el repositorio, ni en variables del contenedor, ni en logs.
