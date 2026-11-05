# The Stars Barbershop — PWA (prototipo)

Proyecto React + Vite. Versión de demostración v2.1.

## Desarrollo local

```bash
npm install
npm run dev
```

## Compilación

```bash
npm run build
npm run preview
```

**Aviso:** prototipo sin backend, base de datos centralizada ni autenticación real. Las citas de demostración se guardan localmente en el navegador; no usar información real de clientes ni publicar el acceso Staff sin protegerlo.

## Próximos pasos

1. Subir el contenido completo de la v2.1.
2. Verificar la compilación.
3. Configurar un despliegue HTTPS de acceso restringido antes de probar la instalación en el teléfono.

## Estado de integración Firebase (rama integracion-final-pwa)

- Se añadió `src/firebase.js` con Firebase Authentication y Cloud Firestore.
- Copia `.env.example` a `.env.local` y completa la API key web de Firebase; nunca subas `.env.local`.
- La ruta `/staff` usa `src/StaffAccess.jsx`. Está **cerrada por defecto**: comprueba sesión y un documento `staff/{uid}` con `active: true` y `role: owner|barber`; **no abre los paneles legacy**.
- Las reglas de Firestore siguen bloqueadas (`allow read, write: if false`). Deben diseñarse, probarse y desplegarse antes de habilitar cuentas, calendarios y reservas reales.
- Las reservas y perfiles del sitio público todavía usan la demo local. **No usar con datos reales ni publicarlo como sistema de producción.**
- `package.json` incluye `firebase` y un override de `@grpc/grpc-js`; **el package-lock.json todavía no está sincronizado** con estos cambios. En un equipo con acceso a npm, ejecutar `npm install`, revisar `npm audit` y `npm run build`, y subir el lockfile generado. `npm ci` puede fallar mientras tanto.
- No hay usuarios creados ni contraseña de propietario incorporada al repositorio. El alias Luna y la credencial del propietario se provisionarán de forma privada, sin forzar un cambio de contraseña hasta que el dueño lo solicite.
- Esta rama no se ha desplegado.

