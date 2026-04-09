## CalendGüi — Flujo de Auth y Roles

### Roles
0 = participante  → solo lectura general
1 = supervisor    → lectura + escritura en slots, challenges, estaciones
2 = admin         → todo lo anterior + config

### Registro (primer login)
1. Usuario hace clic en "Iniciar sesión con Google"
2. Firebase Auth autentica y devuelve el firebaseUser (uid, email, nombre, foto)
3. Frontend busca el documento en /registro_usuarios/{uid} // debe coincidir con el uid de sesion del usuario
4. No existe → intenta crear con rol: 'participante'
5. Firestore Rules valida: autenticado + uid coincide + rol es 'participante' + no hay campos extra
6. Se crea el documento → se devuelve el usuario al estado global

### Login (sesiones siguientes)
1. Usuario hace clic en "Iniciar sesión con Google"
2. Firebase Auth autentica y devuelve el firebaseUser
3. Frontend busca el documento en /registro_usuarios/{uid}
4. Ya existe → solo lee y devuelve los datos (con el rol actual)
5. No toca Firestore para escribir

### Cambio de roles
- Solo se hace manualmente desde la consola de Firebase
- Firestore Console → registro_usuarios → documento del usuario → editar campo rol
- Valores posibles: participante | supervisor | admin
- Las Rules bloquean cualquier update desde el frontend (allow update: if false)
- El cambio se refleja la próxima vez que el usuario inicia sesión

### Escalado futuro
3 = superadmin, etc. — solo ajustar el número en Firestore
Las rules usan >= así que escalan solas