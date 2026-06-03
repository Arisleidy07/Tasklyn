# ✅ PAYPAL CONFIGURADO - TASKLYN

## Estado: LISTO PARA SANDBOX

El sistema de suscripciones con PayPal ha sido instalado y configurado completamente.

---

## 📦 Instalado

```bash
✅ @paypal/paypal-server-sdk@1.0.0
```

---

## 🔧 Configuración

### Archivo: `env.example`

Variables necesarias para el Sandbox:

```bash
# PayPal Sandbox (Testing)
PAYPAL_SANDBOX_CLIENT_ID=your-sandbox-client-id
PAYPAL_SANDBOX_CLIENT_SECRET=your-sandbox-client-secret

# PayPal Mode: sandbox (PARA PRUEBAS)
PAYPAL_MODE=sandbox

# Webhook Secret (para validar webhooks)
PAYPAL_WEBHOOK_SECRET=your-webhook-secret

# Plan IDs (de PayPal Developer Dashboard)
NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID=your-pro-plan-id
NEXT_PUBLIC_PAYPAL_BUSINESS_PLAN_ID=your-business-plan-id
```

---

## 🚀 Próximos Pasos para Activar

### 1. Crear archivo `.env.local`

Copia el `env.example` a `.env.local` y llena tus credenciales:

```bash
cp env.example .env.local
```

### 2. Obtener credenciales de PayPal Sandbox

1. Ve a https://developer.paypal.com/dashboard/
2. Crea una cuenta de desarrollador (gratis)
3. Ve a "My Apps & Credentials"
4. Crea una nueva app
5. Copia el **Sandbox Client ID** y **Sandbox Secret**

### 3. Crear planes de suscripción en PayPal

1. En el dashboard, ve a "Products & Plans"
2. Crea un **Producto** llamado "Tasklyn Pro"
3. Crea un **Plan** para ese producto:
   - Tipo: Suscripción
   - Precio: $4.99 USD
   - Frecuencia: Mensual
   - Guarda el **Plan ID** (empieza con `P-`)
4. Repite para "Tasklyn Business" ($14.99 USD)

### 4. Configurar Webhooks (para pruebas locales)

Para probar webhooks localmente:

```bash
# Instala ngrok globalmente si no lo tienes
npm install -g ngrok

# Expón tu puerto 3000
npx ngrok http 3000
```

Copia la URL HTTPS que te da ngrok (ej: `https://abc123.ngrok.io`)

En PayPal Developer Dashboard:
1. Ve a tu app > Webhooks
2. Añade webhook URL: `https://abc123.ngrok.io/api/paypal/webhook`
3. Selecciona eventos:
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`

---

## 💳 Cómo Probar el Flujo

### Usuario de prueba de PayPal:

```
Email: sb-buyer@example.com (o cualquier email @example.com)
Password: Cualquier contraseña que acepte (mínimo 8 caracteres)
```

### Flujo de prueba:

1. Inicia el servidor: `npm run dev`
2. Ve a http://localhost:3000/pricing
3. Selecciona "Plan Pro" o "Plan Business"
4. Haz clic en "Actualizar Ahora"
5. Serás redirigido a PayPal Sandbox
6. Inicia sesión con las credenciales de prueba
7. Acepta la suscripción
8. Serás redirigido de vuelta y la suscripción se activará automáticamente

---

## 📂 Estructura Creada

```
src/
├── app/
│   ├── (app)/pricing/page.tsx      → Página de planes
│   ├── api/
│   │   ├── subscription/
│   │   │   ├── create/route.ts     → Crear suscripción PayPal
│   │   │   ├── capture/route.ts    → Activar suscripción
│   │   │   └── cancel/route.ts     → Cancelar suscripción
│   │   └── paypal/webhook/route.ts → Recibir eventos PayPal
│   └── subscription/
│       ├── success/page.tsx        → Éxito (con Suspense)
│       └── cancel/page.tsx         → Cancelado
├── components/
│   ├── calendar/TaskCalendar.tsx   → Calendario completo
│   └── shared/UpgradeModal.tsx     → Modal de upgrade
├── lib/
│   ├── paypal.ts                   → Config PayPal SDK
│   ├── subscriptions.ts            → Funciones Firestore
│   └── achievements.ts           → Sistema de logros
├── stores/
│   └── subscriptionStore.ts        → Estado de suscripciones
├── hooks/
│   └── usePlanLimits.ts            → Verificar límites
└── types/
    └── subscription.ts             → Tipos de suscripción
```

---

## 🎯 Planes Configurados

| Plan | Precio | Características |
|------|--------|-----------------|
| **FREE** | $0 | 3 listas, 50 tareas, 2 colaboradores |
| **PRO** | $4.99/mes | Ilimitado + modo oscuro + estadísticas |
| **BUSINESS** | $14.99/mes | Todo + equipos + ranking + reportes |

---

## ⚠️ ANTES de Producción

1. ✅ Cambiar `PAYPAL_MODE=live`
2. ✅ Usar credenciales Live de PayPal
3. ✅ Crear planes de suscripción en cuenta Live
4. ✅ Configurar webhooks con URL de producción
5. ✅ Probar flujo completo en Sandbox primero
6. ✅ Verificar downgrade automático funciona
7. ✅ Probar cancelación de suscripción

---

## 📝 Scripts Útiles

```bash
# Configuración interactiva
node scripts/setup-paypal.js

# Build de producción
npm run build

# Iniciar en modo desarrollo
npm run dev
```

---

## Estado: ✅ BUILD EXITOSO

```
✓ Compiled successfully
✓ TypeScript check passed
✓ 22 pages generated
```

**Listo para probar en Sandbox!** 🚀
