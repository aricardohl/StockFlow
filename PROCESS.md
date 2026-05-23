# PROCESS.md — StockFlow

## Cómo abordé el problema

Lo primero que hice fue leer el enunciado completo y priorizar: el núcleo del reto era el procesamiento asíncrono de movimientos con RabbitMQ, no el CRUD. Decidí construir de adentro hacia afuera — empezar por el backend con una estructura sólida antes de tocar el frontend.

**Orden real de trabajo:**

1. Setup del monorepo (npm workspaces + Turborepo), configuración de MongoDB Atlas y autenticación JWT — quería que la base estuviera firme antes de agregar complejidad.
2. CRUDs de Producto, Sucursal y Stock con sus modelos de Mongoose.
3. Integración de RabbitMQ: productor en el controller de movimientos + worker consumidor con lógica de reintentos. Esta fue la parte más delicada — la dejé para cuando el resto ya funcionaba localmente.
4. Frontend en Next.js: primero la capa de servicios y tipos TypeScript, luego las vistas del dashboard, y al final el polling para reflejar el cambio de estado `pending → processed`.
5. Deploy: intenté primero unificar todo en Vercel, pero Vercel es serverless y no puede mantener un proceso worker TCP persistente. Terminé con frontend en Vercel y backend en Render.

Lo que dejé para el final (y casi me come el tiempo): el deploy. Subestimé cuántos problemas aparecen cuando pasas de localhost a producción — binding de puerto dinámico en Render, IPs dinámicas vs MongoDB Atlas, separar el worker en un proceso independiente.

---

## Herramientas usadas

- **VS Code** con GitHub Copilot para acelerar boilerplate y debugging de la pipeline de agregación de MongoDB.
- **Postman** para probar los endpoints del backend durante desarrollo.
- **Docker Compose** para levantar RabbitMQ localmente sin instalarlo en el sistema.
- **MongoDB Atlas** (free tier) como base de datos en la nube.
- **CloudAMQP** (free tier) como broker RabbitMQ en producción.
- **Render.com** para el backend (Web Service + Background Worker).
- **Vercel** para el frontend.
- **Git** con ramas por feature (`SF/feat-1_setup_inicial`, `feat/SF-9_movimientos_mensajeria`) y PRs para mantener historial limpio, por falta de tiempo no trabajé ramas por issue; usé PRs y Copilot como revisor, práctica habitual que no pude aplicar al 100%
---

## Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cliente (Browser)                        │
│                    Next.js — Vercel (SSR/CSR)                    │
│                                                                  │
│   Dashboard ──► usePolling (cada 3s) ──► GET /api/movement      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend — Render Web Service                   │
│                    Node.js + Express (REST API)                  │
│                                                                  │
│  POST /api/movement                                              │
│    1. Guarda movimiento con estado = "pending"                   │
│    2. Publica { movementId } en cola RabbitMQ ──────────────┐   │
│    3. Responde HTTP 202 inmediatamente                       │   │
└─────────────────────────────────────────────────────────────┼───┘
                                                              │ AMQP
                           ┌──────────────────────────────────▼───┐
                           │     CloudAMQP — cola: inventory_      │
                           │              movements                │
                           └──────────────────────┬───────────────┘
                                                  │ AMQP consume
                           ┌──────────────────────▼───────────────┐
                           │  Background Worker — Render           │
                           │  node src/worker.js                   │
                           │                                       │
                           │  1. Consume mensaje                   │
                           │  2. Valida stock (MongoDB atómico)    │
                           │  3. Actualiza stock con $inc          │
                           │  4. Marca movimiento "processed"      │
                           │     o reintenta (max 2 intentos)      │
                           │     o marca "failed" con razón        │
                           └──────────────────────┬───────────────┘
                                                  │ Mongoose
                           ┌──────────────────────▼───────────────┐
                           │           MongoDB Atlas               │
                           │  collections: movements, stocks,      │
                           │  products, branches, users            │
                           └───────────────────────────────────────┘
```

---

## Las 3 decisiones técnicas más importantes

### 1. Control de concurrencia con operaciones atómicas de MongoDB

El requerimiento de "reintentos cuando falla por concurrencia" implica que dos movimientos pueden competir por el mismo stock. La solución naive — leer el stock, validar en JS, escribir — tiene una race condition clásica.

Decidí delegar la validación a MongoDB con un update condicional atómico:

```js
// Descuenta solo si hay suficiente stock — operación atómica
const result = await Stock.findOneAndUpdate(
  { producto, sucursal: origen, cantidad: { $gte: cantidad } },
  { $inc: { cantidad: -cantidad } },
  { new: true }
);
if (!result) throw new Error('Stock insuficiente en la sucursal origen');
```

Si el documento no cumple el filtro `$gte`, el update no se aplica y retorna `null`. No hay ventana entre la lectura y la escritura. El worker lo reintenta hasta 2 veces antes de marcar `failed`, lo que cumple el requisito de reintentos del examen.

### 2. Separar el worker en un proceso completamente independiente

Mi primer instinto fue arrancar el worker dentro del mismo proceso de Express (al conectar RabbitMQ en `index.js`). Funciona en local, pero en Render presentó un problema: si el worker falla o bloquea, puede afectar al servidor HTTP.

Además, Vercel (serverless) directamente no puede sostener un consumidor AMQP persistente.

Solución: `src/worker.js` es un entrypoint independiente. En producción corre como un **Background Worker** separado en Render con `node src/worker.js`. El Web Service se controla con `ENABLE_WORKER=false` para que no intente arrancar un segundo consumidor. Esto también permite escalar el worker de forma independiente si la cola crece.

### 3. Polling activo en el frontend en lugar de WebSockets

Para reflejar el cambio `pending → processed` en la UI, la alternativa natural sería WebSockets. Decidí no usarla por estas razones:

- Por limitaciones de tiempo y complejidad de infraestructura se eligió polling; en una iteración posterior implementaría  WebSockets.
- Agrega complejidad de infraestructura (el servidor Render necesita sticky sessions o un pub/sub externo para múltiples instancias).
- El caso de uso no requiere latencia por debajo del segundo — el worker procesa en < 500ms y el usuario puede esperar 3 segundos.
- Un `setInterval` con un hook `usePolling` es predecible, fácil de debuggear y de apagar (cuando el usuario sale de la vista, el intervalo se limpia con el `useEffect` cleanup).

El tradeoff: genera tráfico constante aunque no haya cambios. Si tuviera una semana, implementaría Server-Sent Events (SSE) — más simple que WebSockets, unidireccional, y funciona sin infraestructura adicional.

---

## ¿Qué haría diferente con una semana?

- **Tests**: al menos tests de integración sobre el worker (mock de RabbitMQ con `amqplib-mocks` y MongoDB in-memory con `mongodb-memory-server`). Es lo que más duele no tener.
- **WebSocket en lugar de polling**: reemplazar `usePolling` con un endpoint `GET /api/movement/stream` que emita eventos cuando el worker actualiza un movimiento.
- **Variables de entorno validadas al arrancar**: usar `zod` o similar para que el servidor falle rápido y con un mensaje claro si falta `MONGODB_URI` o `RABBITMQ_URL`, en lugar de descubrir el problema a los 30 segundos de startup.
- **Dead Letter Queue**: en lugar de reintentar inline re-encolando el mensaje manualmente, configurar una DLQ en RabbitMQ con `x-dead-letter-exchange` para que los mensajes fallidos sean enrutados automáticamente.
- **Paginación en los listados**: los endpoints de `GET /api/movement` y `GET /api/stock` devuelven todo sin límite. Con volumen real necesitaría cursor-based pagination.
- **Rol de usuarios:** Implementaría un sistema de roles/permiso sencillo pero extensible (RBAC) con tres roles iniciales: Administrador, Gerente de Sucursal, Vendedor. El rol se almacena en User.role y se emite en el JWT; el backend aplica authorize(roles) middleware en endpoints sensibles.
- **Responsividad:** Enfoque mobile-first con breakpoints claros, componentes fluidos y tablas/formularios adaptativos; probar en dispositivos reales para garantizar usabilidad.