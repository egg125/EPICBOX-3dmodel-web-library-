# 🚀 Backend Proyecto

Este es el backend del proyecto de gestión de **assets** y **usuarios**. Está construido utilizando tecnologías modernas como **Node.js**, **Express**, **MongoDB**, y otras librerías comunes para desarrollar una API RESTful robusta y escalable.

---

## 🛠 Tecnologías y Librerías Utilizadas

- **Node.js**: Entorno de ejecución para JavaScript en el servidor.
- **Express.js**: Framework web para Node.js que facilita la creación de APIs RESTful.
- **MongoDB**: Base de datos NoSQL utilizada para almacenar usuarios, assets y otros datos.
- **Mongoose**: ODM (Object Data Modeling) para MongoDB que facilita la interacción con la base de datos.
- **JWT (JSON Web Token)**: Para la autenticación de usuarios.
- **Bcrypt.js**: Para el hashing de contraseñas de los usuarios.
- **Express-validator**: Librería para validar los datos en las solicitudes HTTP.
- **Multer**: Middleware para manejar la subida de archivos en las solicitudes HTTP.
- **Dotenv**: Para cargar variables de entorno desde un archivo `.env`.

---

## 📂 Estructura del Proyecto

```bash
BACKEND/
│
├── controllers/           # Lógica de los controladores que manejan las rutas
│   ├── assetController.js # Controlador para manejar las operaciones de los assets
│   └── userController.js  # Controlador para manejar las operaciones de los usuarios
│
├── models/                # Modelos de datos para la base de datos
│   ├── Asset.js           # Modelo de los assets
│   └── User.js            # Modelo de los usuarios
│
├── routes/                # Rutas de la API
│   ├── assetRoutes.js     # Rutas relacionadas con los assets
│   └── userRoutes.js      # Rutas relacionadas con los usuarios
│
├── middlewares/           # Middlewares para controlar el acceso y validación
│   ├── authMiddleware.js  # Middleware para verificar la autenticación de los usuarios
│   ├── adminMiddleware.js # Middleware para verificar si el usuario tiene rol de admin
│   └── upload.js          # Middleware para manejar la subida de archivos
│
├── validations/           # Archivos para validar las solicitudes
│   ├── assetValidation.js # Validación para la creación y actualización de assets
│   └── userValidation.js  # Validación para el registro y login de usuarios
│
├── .env                   # Archivo de configuración de variables de entorno
├── package.json           # Dependencias del proyecto y scripts de ejecución
├── server.js              # Archivo principal que configura y ejecuta el servidor
└── README.md              # Documentación del proyecto
```
---

## 📄 Descripción de Archivos y Funcionalidad
1. **server.js**
Este es el punto de entrada principal de la aplicación. Aquí se configura el servidor de Express y se conectan las rutas y middlewares. También carga las variables de entorno desde el archivo .env.

2. **controllers/assetController.js**
Este archivo contiene la lógica para manejar las solicitudes relacionadas con los assets. Proporciona las siguientes funciones:

_getAllAssets_: Obtiene todos los assets de la base de datos.

_createAsset_: Crea un nuevo asset después de validar los datos y verificar si el usuario existe.

_deleteAsset_: Elimina un asset si el usuario es el propietario o un admin.

3. **controllers/userController.js**
Aquí se encuentra la lógica para las operaciones relacionadas con los usuarios, como:

_registerUser_: Registra un nuevo usuario, validando los datos y guardando la contraseña de manera segura.

_loginUser_: Realiza el login de un usuario, verificando las credenciales y generando un JWT para la autenticación futura.

_getAllUsers_: Obtiene todos los usuarios, ocultando las contraseñas para mayor seguridad.

_deleteUser_: Permite a un usuario eliminar su cuenta, si es el propietario o si tiene el rol de admin.

4. **models/Asset.js**
Define el esquema de datos para los assets, utilizando Mongoose. Cada asset contiene campos como titulo, descripcion, tipo, archivo, y una referencia al usuario que lo subió (usuario_id).

5. **models/User.js**
Define el esquema de datos para los usuarios. Contiene campos como nombre, email, password, y rol (admin o usuario). Además, las contraseñas se almacenan de manera segura utilizando bcrypt.

6. **routes/assetRoutes.js**
Este archivo maneja las rutas relacionadas con los assets. Incluye:

GET /assets: Obtiene todos los assets (requiere autenticación).

POST /assets: Crea un nuevo asset (requiere autenticación).

<span style="color: red;">DELETE</span> /assets/:id: Elimina un asset (requiere autenticación y verifica si el usuario es el propietario o un admin).

7. **routes/userRoutes.js**
Este archivo maneja las rutas relacionadas con los usuarios, tales como:


POST /users/register: Registra un nuevo usuario.

POST /users/login: Permite el login de un usuario.

GET /users: Obtiene todos los usuarios (requiere autenticación).

DELETE /users/:id: Elimina un usuario (requiere que sea el propietario o un admin).

8. **middlewares/authMiddleware.js**
Este middleware verifica si el usuario ha proporcionado un JWT válido en la cabecera de la solicitud. Si el token es válido, el middleware permite el acceso a las rutas; de lo contrario, devuelve un error de autenticación.

9. **middlewares/adminMiddleware.js**
Este middleware verifica si el usuario autenticado tiene el rol de admin. Se usa en rutas donde solo los administradores tienen acceso.

10. **middlewares/upload.js**
Este middleware maneja la subida de archivos, utilizando Multer. Permite subir imágenes y otros archivos asociados con los assets.

11. **validations/assetValidation.js**
Contiene las reglas de validación para los datos de los assets (como el título, tipo, archivo, etc.), utilizando express-validator.

12. **validations/userValidation.js**
Contiene las reglas de validación para el registro y login de usuarios, también utilizando express-validator.

---
## 🛠 Configuración del Proyecto
**Variables de Entorno**:  
Asegúrate de crear un archivo **.env** en el directorio raíz del proyecto con las siguientes variables:
```
MONGO_URI=tu_uri_de_mongo
JWT_SECRET=tu_secreto_jwt
PORT=5000
```
**Instalación de Dependencias**:  
Para instalar todas las dependencias necesarias, ejecuta:

```
npm install
```
**Ejecutar el Proyecto en Desarrollo**:  
Para arrancar el servidor en modo desarrollo, ejecuta:

```
npm run dev
```
Este comando usará nodemon para reiniciar automáticamente el servidor cuando detecte cambios en los archivos.

---
## 🚀 Rutas de la API
### Registro de Usuario
POST /users/register  
Body:
```
{
  "nombre": "Nombre del usuario",
  "email": "email@example.com",
  "password": "password123"
}
```
### Login de Usuario
POST /users/login  
Body:

```
{
  "email": "email@example.com",
  "password": "password123"
}
```
### Crear un Asset
POST /assets  
Body:
```
{
  "titulo": "Título del asset",
  "tipo": "tipo del asset",
  "descripcion": "Descripción del asset",
  "archivo": "archivo_url",
  "usuario_id": "id_del_usuario"
}
```
