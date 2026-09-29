# Sistema de Ventas Web

Réplica en JavaScript puro con Vite y una API Node/Express para trabajar con la base MariaDB/MySQL `mi_base` del proyecto original.

## Requisitos

- Node.js 20 o superior
- MySQL o MariaDB iniciado
- La base `mi_base` importada desde `base/mi_base.sql`

## Configuración

Instala las dependencias:

```sh
npm install
```

Si tu conexión no es `127.0.0.1:3306` con el usuario `root` sin contraseña, copia `.env.example` a `.env` y ajusta `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` y `DB_PASSWORD`.
Para TiDB Cloud, configura `DB_SSL=true`.

Inicia la API y Vite:

```sh
npm run dev
```

Abre la dirección que muestra Vite, normalmente `http://localhost:5173`.

## Acceso

El esquema original no tiene una columna de contraseña. Se conserva el inicio de sesión del proyecto Java: usuario de empleado y su DNI. No se suben credenciales de ejemplo; reemplaza este mecanismo por contraseñas con hash antes de usar datos reales.

## Funciones

- Panel con resumen de clientes, productos, empleados y ventas.
- Crear, editar, buscar y eliminar clientes, empleados y productos.
- Registrar ventas con selección de cliente, detalle, cálculo del total y validación de stock.
- Historial y detalle de ventas.

El registro de una venta y el descuento de inventario se confirman en una transacción. La sesión usa una cookie firmada para funcionar entre invocaciones serverless; establece un `SESSION_SECRET` aleatorio en Vercel.

## Despliegue en Vercel y TiDB Cloud

La API se publica como función serverless y usa una cookie firmada para conservar la sesión entre invocaciones. En Vercel, configura estas variables de entorno en Production y Preview: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL=true` y `SESSION_SECRET`. Mantén las credenciales fuera del repositorio.

Importa `base/mi_base.sql` en una base `mi_base` de TiDB Cloud antes de desplegar. El dump contiene datos personales de muestra, por lo que se excluye de Git; consérvalo solo para la importación privada.