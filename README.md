# StockFlow

Sistema de control de inventario multi-sucursal con procesamiento asíncrono de movimientos vía RabbitMQ.

> **Demo:** [https://stock-flow-backend-six.vercel.app](https://stock-flow-backend-six.vercel.app) — Frontend en Vercel · Backend en Render

---

## Setup local

### Requisitos

- Node.js 18+
- Docker & Docker Compose (para RabbitMQ local)
- Cuenta en MongoDB Atlas (free tier) o instancia local

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/aricardohl/StockFlow.git
cd stockflow
npm install          # instala workspaces: backend + frontend
```

### 2. Variables de entorno

**Backend** — crea `packages/backend/.env`:

```env
PORT=3000
MONGO_URI= // LINK DE MONGODB PARA CONEXION
JWT_SECRET=un_secreto_largo_y_aleatorio
RABBITMQ_URL=amqp://guest:guest@localhost:5672
ENABLE_WORKER=true
```

**Frontend** — crea `packages/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Levantar RabbitMQ con Docker

```bash
# Desde la raíz o packages/backend/
docker compose up -d
```

RabbitMQ escucha en `localhost:5672`. UI de gestión: `http://localhost:15672` (guest / guest).

### 4. Arrancar backend

```bash
npm run dev -w packages/backend
```

El servidor escucha en `http://localhost:3000`. Al arrancar conecta a MongoDB y RabbitMQ, y levanta el worker de movimientos en el mismo proceso.

### 5. Arrancar frontend

```bash
npm run dev -w packages/frontend
```

El frontend escucha en `http://localhost:3001`.

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cliente (Browser)                        │
│                   Next.js — Vercel (SSR/CSR)                    │
│                                                                 │
│  Dashboard ──► usePolling (cada 3s) ──► GET /api/movement       │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Backend — Render Web Service                   │
│                   Node.js + Express (REST API)                  │
│                                                                 │
│  POST /api/movement                                             │
│    1. Guarda movimiento estado = "pending"                      │
│    2. Publica { movementId } en cola RabbitMQ ─────────────┐   │
│    3. Responde HTTP 202 inmediatamente                      │   │
└────────────────────────────────────────────────────────────┼───┘
                                                             │ AMQP
                        ┌────────────────────────────────────▼───┐
                        │   CloudAMQP — cola: inventory_movements │
                        └────────────────────────┬───────────────┘
                                                 │ AMQP consume
                        ┌────────────────────────▼───────────────┐
                        │  Background Worker — Render             │
                        │  node src/worker.js                     │
                        │                                        │
                        │  1. Consume mensaje                    │
                        │  2. Valida stock (MongoDB atómico)     │
                        │  3. Actualiza stock con $inc           │
                        │  4. Marca "processed" o reintenta      │
                        │     (máx 2 intentos) → "failed"        │
                        └────────────────────────┬───────────────┘
                                                 │ Mongoose
                        ┌────────────────────────▼───────────────┐
                        │           MongoDB Atlas                 │
                        │  collections: movements, stocks,        │
                        │  products, branches, users              │
                        └────────────────────────────────────────┘
```

**Flujo de movimiento:**
1. `POST /api/movement` → guarda el movimiento en estado `pending` → publica `{ movementId }` en la cola → responde `202` inmediatamente.
2. El worker consume el mensaje, valida stock atómicamente con `findOneAndUpdate`, actualiza inventario y marca `processed` o `failed`.
3. Si falla (ej. stock insuficiente por concurrencia), reintenta una vez. Tras el segundo fallo marca `failed` con razón legible.
4. El frontend detecta el cambio de estado vía polling cada 3 segundos.

---

## Endpoints principales

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/auth` | — | Login → devuelve JWT |
| POST | `/api/user` | — | Registro de usuario |
| GET / POST / PUT / DELETE | `/api/product` | ✓ | CRUD productos |
| GET / POST / PUT / DELETE | `/api/branch` | ✓ | CRUD sucursales |
| GET | `/api/stock` | ✓ | Stock por producto y sucursal |
| POST | `/api/movement` | ✓ | Crear movimiento (async, responde 202) |
| GET | `/api/movement` | ✓ | Listar con filtro por estado/sucursal |
| GET | `/api/movement/report` | ✓ | Reporte por rango de fechas |

Todas las rutas marcadas con ✓ requieren `Authorization: Bearer <token>`.

---

## Decisiones de arquitectura y trade-offs

### 1. Express + RabbitMQ separado de Vercel

El examen recomienda Next.js full-stack en Vercel, pero RabbitMQ requiere un proceso persistente (el worker AMQP) que no puede vivir en un entorno serverless. Elegí separar el backend en Render como Web Service + Background Worker independiente. El trade-off: más configuración de CORS y variables de entorno, pero permite escalar el worker de forma independiente y usar Docker en producción sin restricciones de plataforma.

### 2. Worker en proceso independiente en producción (`ENABLE_WORKER`)

Localmente el worker corre en el mismo proceso que la API para simplificar el setup. En producción, `src/worker.js` es un entrypoint separado que corre como Background Worker en Render (`node src/worker.js`). La variable `ENABLE_WORKER=false` en el Web Service evita que arranque un segundo consumidor. Esto aisla fallos: si el worker se cae, la API sigue respondiendo y los movimientos se quedan en `pending` hasta que el worker se recupere.

### 3. Concurrencia con `findOneAndUpdate` atómico en MongoDB

La validación de stock se delega a MongoDB con una sola operación condicional:

```js
const result = await Stock.findOneAndUpdate(
  { product, branch: origin, quantity: { $gte: amount } },
  { $inc: { quantity: -amount } },
  { new: true }
);
if (!result) throw new Error('Stock insuficiente');
```

Si el filtro `$gte` no se cumple, el update no se aplica y devuelve `null`. No hay ventana entre lectura y escritura, por lo que dos movimientos concurrentes no pueden decrementar el mismo stock dos veces. El worker reintenta hasta 2 veces antes de marcar `failed`.

---

## Despliegue

| Servicio | Plataforma | Notas |
|----------|-----------|-------|
| Frontend (Next.js) | Vercel | Deploy automático desde `main` |
| Backend API (Express) | Render — Web Service | `node src/index.js`, `ENABLE_WORKER=false` |
| Movement Worker | Render — Background Worker | `node src/worker.js` |
| RabbitMQ | CloudAMQP (free tier) | Broker gestionado, accesible vía `RABBITMQ_URL` |
| Base de datos | MongoDB Atlas (free tier) | IPs de Render en allowlist |

**Alternativa todo-en-Vercel:** reemplazar RabbitMQ por una cola gestionada compatible con serverless (Upstash/Redis, SQS, Cloud Tasks). El worker se convertiría en un cron job o función activada por trigger. Pierde la persistencia de conexión AMQP pero gana simplicidad de deploy.

---

## ¿Qué haría diferente con una semana?

- **Tests de integración**: cubrir el flujo completo `POST /movement → queue → worker → DB` con mocks de RabbitMQ (`amqplib-mocks`) y MongoDB in-memory (`mongodb-memory-server`). Es lo que más duele no tener.

- **Server-Sent Events en lugar de polling**: reemplazar `usePolling` con `GET /api/movement/stream` (SSE). Más simple que WebSockets, unidireccional, y elimina el tráfico constante del polling; el frontend recibe push sólo cuando cambia algo.

- **Dead Letter Queue (DLQ)**: en lugar de reintentar inline manualmente, configurar en RabbitMQ un `x-dead-letter-exchange` para que los mensajes fallidos se enruten automáticamente a una DLQ inspeccionable, sin lógica de reintento en el código del worker.

- **Validación de entorno al arrancar**: usar `zod` para validar `process.env` al inicio (`PORT`, `MONGO_URI`, `JWT_SECRET`, `RABBITMQ_URL`). El servidor falla rápido con un mensaje claro en lugar de explotar 30 segundos después por una variable faltante.

- **Paginación cursor-based**: `GET /api/movement` y `GET /api/stock` hoy devuelven todo sin límite. Con volumen real necesitaría paginación por cursor (`_id` + `limit`) para no saturar la red ni el cliente.

- **Roles de usuario (RBAC)**: implementaría tres roles con permisos diferenciados:
  - `admin` — CRUD completo sobre productos, sucursales y usuarios; acceso a reportes globales.
  - `branch_manager` — operaciones sobre su(s) sucursal(es) asignada(s); puede aprobar transferencias entrantes y ver reportes de su sucursal.
  - `seller` — solo puede crear movimientos de entrada/salida en su sucursal y consultar stocks.

  El rol se guarda en `User.role` y se emite en el JWT. El backend aplica `authorize(roles)` middleware en cada ruta. Para reglas por sucursal se añade `user.branches: [branchId]` y se valida scope en el handler. Si se necesita granularidad por recurso, migrar a `casl` o `accesscontrol`.

- **Transacciones MongoDB multi-document**: en transferencias entre sucursales, hoy son dos `findOneAndUpdate` separados. Con transacciones ACID (disponibles en Atlas desde MongoDB 4.x) ambas operaciones serían atómicas: si falla el crédito en destino, se revierte el débito en origen.
