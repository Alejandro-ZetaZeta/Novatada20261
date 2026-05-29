# SPEC.md — Sistema de Tickets Digitales Novatada ULEAM 2026

> Documento fundacional del proyecto. Define la arquitectura, convenciones, restricciones y flujos del sistema.

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend / Server | Next.js 15 (App Router, TypeScript) |
| Estilos | Tailwind CSS v4 + CSS custom properties |
| Base de datos | PostgreSQL vía **InsForge** |
| Almacenamiento | Bucket privado **InsForge** (`comprobantes`) |
| Autenticación | InsForge Auth (email/password para staff) |
| Gestor de paquetes | pnpm |

---

## 🚫 Restricción Arquitectónica Crítica

El backend **única y exclusivamente** usa InsForge. Está completamente prohibido:
- Integrar Supabase, Firebase, AWS S3, Cloudinary o cualquier servicio externo de persistencia.
- Usar variables `NEXT_PUBLIC_INSFORGE_SERVICE_KEY` (la service key nunca llega al browser).
- Hardcodear cualquier credencial en el código fuente.

---

## 💰 Datos de Negocio

| Parámetro | Valor |
|-----------|-------|
| Precio preventa por persona | **$3.00 USD** |
| Fecha del evento | **31 de julio de 2026** |
| Organización | Asociación de Estudiantes Uleam Chone |
| Cuenta Pichincha 1 | `2211135976` — Cristhian Alejandro Zambrano Zambrano |
| Cuenta Pichincha 2 | *(por definir — placeholder igual a cuenta 1)* |
| QR estáticos | `public/qr/cuenta-1.png`, `public/qr/cuenta-2.png` |

---

## 🗄️ Esquema de Base de Datos

### Convenciones críticas

> **⚠️ IMPORTANTE:** Los campos de cédula y teléfono ecuatorianos se almacenan como `TEXT`, NUNCA como `INTEGER` o `BIGINT`. Esto preserva los ceros iniciales:
> - Cédulas: 10 dígitos, pueden iniciar en `0` (ej: `0912345678`)
> - Teléfonos: 10 dígitos, SIEMPRE inician en `0` (ej: `0987654321`)
> - En WhatsApp: el número con código de país es `+593` + cédula sin el `0` inicial

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `lideres` | Compradores/responsables de grupo |
| `ordenes` | Orden padre que agrupa N tickets |
| `tickets` | Ticket individual (uno por cédula del grupo) |
| `staff` | Miembros con acceso al panel interno |
| `auditoria` | Registro inmutable de acciones críticas |

### Estados del sistema

**Orden (`ordenes.estado`):**
```
pendiente → aprobado → (anulado si hay problema)
```

**Ticket (`tickets.estado`):**
```
pendiente → activo → usado
```

---

## 🔐 Roles y Seguridad (RLS)

| Rol | Auth | Permisos clave |
|-----|------|----------------|
| **Visitante** | Anónimo | INSERT lideres/ordenes/tickets; SELECT nulo (solo vía API server-side) |
| **Staff** | Email/password InsForge | SELECT ALL tablas; UPDATE estado ordenes/tickets; INSERT auditoria |
| **Admin** | Email/password InsForge | Bypass completo de RLS; gestión de staff |

### Blindaje del QR

La ruta `POST /api/tickets/[uuid]/validar` exige sesión activa de staff.  
Si un escáner no autorizado lee el QR, recibe `401 Unauthorized` y el ticket **no cambia de estado**.

---

## 🌐 Rutas del Sistema

### Públicas (sin autenticación)

| Ruta | Descripción |
|------|-------------|
| `/` | Index: Adquirir Entradas + Consultar Estado |
| `/ticket/[uuid]` | Ticket virtual del líder (QR generado en frontend) |

### Staff (requiere login)

| Ruta | Descripción |
|------|-------------|
| `/staff/login` | Autenticación staff |
| `/staff/panel` | Lista de órdenes + Venta Rápida |
| `/staff/panel/[orderId]` | Detalle orden + aprobación |
| `/staff/panel/scanner` | Escáner QR en puerta del evento |

### API (server-side)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/ordenes` | Crear orden + tickets |
| PATCH | `/api/ordenes/[id]/aprobar` | Aprobar orden y activar tickets |
| POST | `/api/ordenes/[id]/anular` | Anular orden |
| GET | `/api/storage/upload-url` | URL prefirmada para subir comprobante |
| GET | `/api/tickets/estado` | Consultar estado por cédula (visitante) |
| GET | `/api/tickets/[uuid]` | Datos del ticket para página pública |
| POST | `/api/tickets/[uuid]/validar` | **Requiere auth staff.** Marcar grupo como `usado` |

---

## 📱 Flujo WhatsApp (Despacho de Tickets)

El staff **NO usa API de WhatsApp** — usa el esquema nativo `wa.me`:

```
https://wa.me/593XXXXXXXXX?text=...mensaje...
```

Conversión de teléfono ecuatoriano:
- El usuario ingresa: `0987654321` (10 dígitos, inicia en 0)
- Para WhatsApp: eliminar el `0` inicial, agregar `593`
- Resultado: `59387654321`

---

## 🎨 Design System

Ver `design-system/novatada-uleam-2026/MASTER.md` para el sistema completo generado por ui-ux-pro-max.

**Resumen:**
- **Paleta:** Deep purple-black OLED (`#0A0010`) + violet (`#8B5CF6`) + orange CTA (`#F97316`)
- **Tipografía:** Space Grotesk (headings) + Inter (body)
- **Estilo:** Dark glass cards, neon glow borders, micro-animaciones 200-300ms
- **Responsive:** 375px / 768px / 1024px / 1440px

---

## 📁 Estructura de Carpetas

```
Novatada20261/
├── app/
│   ├── (public)/             # Rutas públicas (sin auth)
│   │   ├── page.tsx          # Index
│   │   └── ticket/[uuid]/    # Ticket virtual
│   ├── (staff)/              # Rutas protegidas
│   │   ├── login/            # Login staff
│   │   └── panel/            # Panel de gestión
│   └── api/                  # API routes (server-side only)
├── components/
│   ├── public/               # Componentes del frente público
│   ├── staff/                # Componentes del panel staff
│   └── ui/                   # Componentes reutilizables
├── lib/
│   ├── insforge.ts           # Cliente InsForge singleton
│   ├── validar-cedula.ts     # Validación Módulo 10 (Ecuador)
│   └── whatsapp.ts           # Generador URL wa.me
├── migrations/               # SQL migrations (aplicar en orden)
├── public/
│   └── qr/                   # QR estáticos Banco Pichincha
├── design-system/            # Design system generado
├── .env.local                # Credenciales InsForge (nunca commitear)
└── SPEC.md                   # Este archivo
```

---

## 🔧 Variables de Entorno

```env
# .env.local (nunca en .gitignore excluido)

# URL base del proyecto InsForge
INSFORGE_URL=https://ztcuv77y.us-west.insforge.app

# Clave pública (para el cliente browser - safe)
NEXT_PUBLIC_INSFORGE_ANON_KEY=...

# Clave de servicio (SOLO server-side, nunca NEXT_PUBLIC_)
INSFORGE_SERVICE_KEY=...
```

---

## 🧪 Validación de Cédula Ecuatoriana (Módulo 10)

```
1. Verificar que tenga exactamente 10 dígitos (TEXT, preservar cero inicial)
2. Los dos primeros dígitos representan la provincia (01-24, 30)
3. El tercer dígito debe ser < 6
4. Aplicar coeficientes [2,1,2,1,2,1,2,1,2] a los primeros 9 dígitos
5. Si el producto > 9, restar 9
6. Sumar todos los resultados
7. El dígito verificador (posición 10) = (10 - (suma % 10)) % 10
```

---

## 📋 Convenciones de Código

- Todo el código, comentarios y documentación en **español**
- Rutas API: kebab-case (`/api/upload-url`)
- Componentes: PascalCase (`FormularioCompra.tsx`)
- Variables y funciones: camelCase en español (`validarCedula`, `crearOrden`)
- Constantes: SCREAMING_SNAKE_CASE (`PRECIO_PREVENTA`, `FECHA_EVENTO`)
- Usar `pnpm` para todas las operaciones de paquetes

---

*Generado el 27 de mayo de 2026. Asociación de Estudiantes Uleam Chone.*
