# Grupo 02
## Integrantes
- [Castillo Carnero, Juan Diego](./Integrantes/castillo/jd.md)
- [Flores Tavara, Sergio David](./Integrantes/flores/flores.md)
- [Herrera Solis, Sebastian Martin](./Integrantes/herrera/herrera.md)
- [Meneses Gutierrez, Hector Jose](./Integrantes/hector/hector.md)

## Tema de proyecto
Desarrollo de un aplicativo movil y web que permita la mensajeria entre usuarios
 
## 1.4 Stakeholders
- Analista: Juan Diego Castillo
- Arquitecto: Equipo de programadores (Grupo 02)
- Gestor de negocio: Encargado brindado por la universidad
- Conformance checker: Hector Meneses
- Cliente: La entidad universitaria.
- DBA: Hector Meneses
- Especialista en despliegue: Sebastian Herrera
- Diseñador: Sergio Flores 
- Evaluador: Sebastian Herrera
- Implementador: Equipo de programadores (Grupo 02)
- Integrador: Equipo de programadores (Grupo 02)
- Responsable de mantenimento: Area de TI de la universidad
- Administrador de Línea de producto: Departamento de Innovacion
- Jefe de proyecto: Experto relacionado a la gestion de proyectos
- Ingenierio de sistemas: Ingeniero contratado por la universidad
- Responsable de pruebas: Equipo de programadores (Grupo 02)
-  Usuarios finales: Estudiantes, profesores y jefes de practica.

## Business Model Canvas
![Business Model Canvas](./PNGs/Canvas.png)

## Stack tecnológico 

- Lenguaje de programacion Dart
- Flutter SDK
- Docker - instancia de contenedor RethinkDB 

## Requerimientos del Sistema
Requerimientos Funcionales:
1. Registro e inicio de sesión con roles definidos: La aplicación debe permitir el registro e inicio de sesión de usuarios con roles específicos: profesor, alumno y personal administrativo. Cada rol tendrá diferentes permisos y funcionalidades.
2. Perfiles de usuario: Cada usuario tendrá un perfil con información básica como nombre, foto de perfil, rol en la institución, etc.
3. Mensajería one-to-one: Los usuarios podrán enviar mensajes directos a otros usuarios, independientemente de su rol.
4. Mensajería de grupo: Los usuarios podrán crear y unirse a grupos de chat, ya sean por curso, grupo de trabajo, departamento, etc.
5. Gestión de cursos: Los profesores podrán crear y gestionar cursos, agregar alumnos y personal administrativo, compartir materiales, etc.
6. Anuncios y notificaciones: Los profesores y el personal administrativo podrán enviar anuncios y notificaciones importantes a los grupos de estudiantes o a toda la institución.
7. Calendario académico: La aplicación debe incluir un calendario académico donde se muestren eventos importantes, fechas límite, horarios de clase, etc.
8. Compartir archivos: Todos los usuarios podrán compartir archivos multimedia, documentos, presentaciones, etc., dentro de los chats individuales o de grupo.
9. Búsqueda de usuarios y cursos: Los usuarios podrán buscar y encontrar a otros usuarios o cursos específicos dentro de la aplicación.
10. Integración con sistemas académicos: La aplicación puede integrarse con los sistemas académicos de la institución para acceder a información de calificaciones, horarios, etc.
11. Privacidad y seguridad: Los mensajes y archivos compartidos deben estar cifrados, y se deben implementar medidas de seguridad para proteger la privacidad de los usuarios.
12. Notificaciones push: Los usuarios recibirán notificaciones push en tiempo real sobre nuevos mensajes, anuncios, eventos, etc.
13. Soporte multiplataforma: La aplicación debe ser compatible con iOS y Android para una mejor accesibilidad.