#!/usr/bin/env node
// ============================================
// TASKLYN — PayPal Sandbox Setup Script
// ============================================

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

async function main() {
  console.log('\n🚀 TASKLYN — Configuración de PayPal Sandbox\n');
  console.log('Este script te ayudará a configurar PayPal para pruebas.\n');
  console.log('Instrucciones previas:');
  console.log('1. Ve a https://developer.paypal.com/dashboard/');
  console.log('2. Crea una app en "My Apps & Credentials"');
  console.log('3. Obtén tu Client ID y Secret de SANDBOX\n');

  const clientId = await question('PayPal Sandbox Client ID: ');
  const clientSecret = await question('PayPal Sandbox Client Secret: ');

  console.log('\nAhora necesitas crear planes de suscripción:');
  console.log('Ve a https://developer.paypal.com/dashboard/ > Products & Plans\n');

  const proPlanId = await question('Plan ID para PRO ($4.99/mes): ');
  const businessPlanId = await question('Plan ID para BUSINESS ($14.99/mes): ');

  // Create env.local content
  const envContent = `# PayPal Sandbox Configuration (Auto-generated)
PAYPAL_SANDBOX_CLIENT_ID=${clientId.trim()}
PAYPAL_SANDBOX_CLIENT_SECRET=${clientSecret.trim()}
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_SECRET=webhook_secret_placeholder
NEXT_PUBLIC_PAYPAL_PRO_PLAN_ID=${proPlanId.trim()}
NEXT_PUBLIC_PAYPAL_BUSINESS_PLAN_ID=${businessPlanId.trim()}
`;

  const envPath = path.join(__dirname, '..', '.env.local');

  // Append to existing or create new
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf8');
    if (existing.includes('PAYPAL_SANDBOX_CLIENT_ID')) {
      console.log('\n⚠️  Ya existe configuración de PayPal en .env.local');
      const overwrite = await question('¿Sobrescribir? (s/n): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('\n❌ Cancelado. Configuración no modificada.');
        rl.close();
        return;
      }
    }
    // Remove old PayPal config and add new
    const lines = existing.split('\n');
    const filtered = lines.filter(line =>
      !line.startsWith('PAYPAL_') &&
      !line.startsWith('NEXT_PUBLIC_PAYPAL_')
    );
    fs.writeFileSync(envPath, filtered.join('\n') + '\n' + envContent);
  } else {
    fs.writeFileSync(envPath, envContent);
  }

  console.log('\n✅ Configuración guardada en .env.local');
  console.log('\n📝 Próximos pasos:');
  console.log('1. Inicia el servidor: npm run dev');
  console.log('2. Ve a http://localhost:3000/pricing');
  console.log('3. Selecciona un plan y haz clic en "Actualizar"');
  console.log('4. Usa las credenciales de prueba de PayPal para pagar');
  console.log('\n💳 Credenciales de prueba de PayPal:');
  console.log('   Email: sb-buyer@example.com');
  console.log('   Password: cualquier_contraseña_que_acepte');
  console.log('\n🌐 Para webhooks en desarrollo local:');
  console.log('   Usa ngrok: npx ngrok http 3000');
  console.log('   Configura el webhook en PayPal apuntando a tu URL ngrok + /api/paypal/webhook');
  console.log('');

  rl.close();
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
