# The Stars Barbershop — habilitación de pruebas con Firebase

**Estado:** código de pruebas subido. NO se han desplegado reglas, creado cuentas en Firebase ni publicado Hosting. No hay prueba end-to-end verificada todavía.

## Preparación imprescindible

1. En Firebase Authentication → Users, crear manualmente la cuenta de propietario con correo **luna@the-stars-barbershop.firebaseapp.com** y la contraseña inicial acordada con el administrador. **Nunca guardar ni publicar la contraseña en GitHub, Firestore o archivos de configuración.**
2. Copiar el UID exacto de la cuenta creada.
3. En Firestore → colección `staff`, crear un documento cuyo ID sea ese UID; campos `role` (string) = `owner`, `active` (boolean) = `true`, `name` (string) = `Luna`, `username` (string) = `Luna`. Este paso es la asignación inicial autorizada; no habilitar escrituras anónimas para hacerlo.
4. Revisar y probar `firestore.rules` en Firebase Rules Playground o Emulator Suite, con casos de usuario sin sesión, propietario, barbero A y barbero B. Luego desplegar esas reglas de forma explícita desde Firebase Console antes de operar el panel. El archivo de reglas en GitHub por sí solo **no cambia las reglas activas**.
5. Configurar en el equipo `.env.local` a partir de `.env.example`. **No subir el archivo .env.local**. Ejecutar `npm install`, `npm audit`, `npm run build` y `npm run dev`.
6. En `/staff`, acceder con alias `Luna` y la contraseña inicial. No se fuerza su cambio en esta fase.

## Prueba del dueño

- Crear el primer barbero con nombre, apellido y contraseña. Los usuarios creados desde esta interfaz son cuentas reales en Firebase Authentication. Evitar nombres repetidos: el alias actual se deriva del nombre de pila y todavía no implementa la política completa de colisiones.
- Registrar una cita de ejemplo desde el panel de pruebas, verificar que aparece en Firestore y que el barbero solo ve sus citas. Confirmar que la edición de otros barberos es denegada y que un invitado no puede consultar los datos.
- El panel actual permite altas, guardado, listado y borrado de citas. **No constituye la versión definitiva** de calendarios, informes PDF, perfiles con fotografías, modificación de citas o reserva pública.
- No introducir datos personales reales de clientes en esta fase sin aprobar antes la seguridad y privacidad del sistema.

## Limpieza tras aprobar la prueba

Eliminar documentos de `appointments`, `barbers` y cuentas/roles de barberos **solo después de una exportación o respaldo revisado**. Conservar el usuario y perfil de propietario y cualquier ajuste administrativo validado. Las cuentas de Firebase Authentication requieren eliminación separada: borrar documentos de Firestore no elimina usuarios Auth.

## Publicación posterior

GitHub es el repositorio del código; un dominio `.com` requiere registro y un servicio de hosting (por ejemplo Firebase Hosting) con DNS/HTTPS. Ningún dominio ni alojamiento se han contratado, conectado o desplegado. Revalidar reglas, calendario, flujo público, limpieza de pruebas y seguridad antes de publicar.
