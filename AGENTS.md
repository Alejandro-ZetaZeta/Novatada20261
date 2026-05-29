# Especificación Técnica de Producto: Sistema de Tickets Digitales - Novatada Uleam

## 🚨 Restricción de Arquitectura Crítica

El backend de este proyecto debe ser construido **única y estrictamente** bajo el ecosistema de **InsForge** (PostgreSQL gestionado y almacenamiento de objetos nativo). Está completamente prohibido estructurar el código pensando en Supabase, Firebase o servicios externos de AWS. Toda persistencia y manejo de archivos privados debe depender de las herramientas nativas de InsForge. Todo el código debe estar en español, incluyendo comentarios y documentación. Usa pnpm install para instalar dependencias.

---

## 1. Stack Tecnológico

- **Frontend / Server:** Next.js (App Router, Tailwind CSS, TypeScript).
- **Base de Datos:** PostgreSQL en entorno gestionado por InsForge.
- **Almacenamiento:** Bucket Privado de InsForge (almacenamiento de comprobantes financieros).
- **Seguridad de Datos:** Políticas de Seguridad a Nivel de Fila (RLS) aplicadas directamente en la base de datos de InsForge.
- **Privacidad del Repositorio:** Proyecto privado de único desarrollador (sin bifurcaciones ni accesos públicos).

---

## 2. Estructura de Roles y Políticas de Seguridad (RLS)

El acceso a los datos se rige estrictamente por tres niveles de privilegios implementados en el motor de base de datos para evitar vulnerabilidades de acceso directo (IDOR):

- **Rol Visitante (Público):**
  - Permiso para crear registros de usuarios (líderes de grupo) y transacciones pendientes.
  - Permiso de lectura limitado exclusivamente al estado de su propio ticket (`Pendiente` o `Aprobado`), requiriendo verificación mediante consulta directa de su número de cédula. No tiene acceso visual a los códigos QR ni a datos de otros usuarios en el index.
- **Rol Staff (Dirigencia de la Asociación):**
  - Acceso protegido mediante credenciales.
  - Permiso de lectura global sobre el listado de transacciones para conciliación de caja.
  - Permiso de escritura para registrar de forma física e inmediata a estudiantes en la oficina.
  - Permiso de actualización restringido únicamente al cambio de estados de entradas (`Pendiente` -> `Activo` -> `Usado`) y generación de bitácoras de auditoría.
- **Rol Administrador (Control Total):**
  - Bypass completo de restricciones RLS.
  - Capacidad para corregir datos mal ingresados, anular transacciones, emitir reembolsos y gestionar credenciales de los miembros del staff más responsables.

---

## 3. Flujos Lógicos del Sistema

### A. Registro, Compra y Tolerancia a Redes Móviles Inestables (Frente Público)

1. **Acceso Inicial:** El index público se divide en dos secciones limpias basadas en componentes reactivos: Adquirir Entradas y Consultar Estado.
2. **Selección de Cuenta:** La interfaz presenta visualmente los datos de las dos cuentas del Banco Pichincha disponibles (los códigos QR de recaudación son estáticos y residen en la carpeta local pública del repositorio).
3. **Validación de Identidad:** El usuario ingresa su Nombre, Teléfono y Cédula. El frontend valida matemáticamente la cédula ecuatoriana en tiempo real (Módulo 10) antes de permitir el envío.
4. **Modalidad Grupal:** El sistema permite añadir dinámicamente múltiples acompañantes ingresando únicamente sus números de cédula (también validadas por el cliente). El sistema calcula en vivo el monto total multiplicando la cantidad de cédulas por la tarifa fija de preventa.
5. **Estrategia Anticaídas de Conexión:**
   - **Vía Multimedia (Recomendada):** El estudiante sube la captura de la transferencia. El servidor genera una URL pre-firmada de InsForge para alojar la imagen de forma directa y segura en el bucket privado.
   - **Vía Texto (Respaldo por mala señal):** Si la red móvil falla, se omite el archivo y el usuario digita tres campos de texto: Fecha de transferencia, Número de comprobante/referencia y Cuenta de origen.
6. **Finalización:** Se genera una Orden Padre en estado `Pendiente` y se crean los $N$ Tickets Hijos correspondientes en la base de datos, asignándoles un identificador único global (UUID) único e inadivinable para la URL pública del ticket virtual.

### B. Venta Rápida en Oficina

1. Un estudiante acude físicamente a la oficina de la asociación y paga en efectivo.
2. El staff inicia sesión, abre un modal de "Venta Rápida", ingresa los datos del comprador y el sistema almacena la transacción directamente con estado `Aprobado` y tickets `Activos`, saltando el flujo de comprobantes bancarios.

### C. Conciliación, Auditoría y Despacho Manual por WhatsApp

1. El staff accede al panel de validación interna. Al abrir una orden pendiente, el sistema solicita a InsForge una URL firmada de corta duración para renderizar la imagen del comprobante de forma segura en pantalla y validar el QR interno del banco. Si la orden fue manual, se muestran los datos de referencia en texto plano.
2. Tras verificar el ingreso del dinero en la app del Banco Pichincha/Deuna de la asociación, el staff presiona **"Aprobar y Enviar"**.
3. El backend actualiza los estados de los tickets y genera un registro histórico inmutable en la tabla de auditoría detallando qué cuenta del staff autorizó la transacción.
4. El sistema ejecuta una redirección nativa al esquema de URL de WhatsApp (`api.whatsapp.com/send`), abriendo el chat del líder con un mensaje pre-redactado que contiene el enlace seguro del ticket basado en su UUID único (`/ticket/[UUID]`). El staff solo debe presionar el botón físico de enviar, eliminando el riesgo de baneos por uso indebido de APIs automatizadas.

### D. Control de Acceso en Puerta y Seguridad de Escaneo

1. El líder del grupo abre el enlace de WhatsApp en la fila del evento, mostrando los nombres de los asistentes, cantidad de cupos y el código QR generado en tiempo real por el frontend.
2. **Blindaje del QR:** Si una cámara ajena al staff escanea el código QR, la petición web a la ruta de validación interna devuelve un error de falta de autorización (_401 Unauthorized_). El estado del ticket permanece intacto en la base de datos de InsForge.
3. El staff escanea el QR desde su sesión activa o busca el número de cédula del líder. La interfaz despliega un modal detallado con la previsualización del líder y la lista de todas las cédulas asociadas al grupo.
4. El staff corrobora físicamente las identidades con las cédulas en mano. Al estar el grupo completo en la fila, presiona **"Confirmar Ingreso Total"**.
5. Los tickets pasan instantáneamente a estado `Usado` en bloque dentro de PostgreSQL.
6. **Política de Reingreso:** Se le coloca un sello de tinta UV (invisible) en la mano a todos los integrantes del grupo validado. Si un estudiante sale de la discoteca y decide regresar, el personal de control verifica visualmente el sello con una linterna de luz negra. No se realizan consultas digitales ni re-escaneos del QR para evitar cuellos de botella en la puerta y fraude por intercambio de capturas de pantalla.

<!-- INSFORGE:START -->

## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **Novatada20261** (API base `https://ztcuv77y.us-west.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->
