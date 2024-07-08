# Code Smells
## Desarrollo Conceptual
Los code smells es cualquier sintoma en el código fuente de un programa que posiblemente indica un problema. Estos *code smells* no son necesariamente un bug en la programación, ya que no son incorrectos en sí y no impiden el funcionamiento del programa. Sin embargo, sí indican deficiencias en el diseño del software ya que aumentan el riesgo a errores y o fallos a futuro.

### Hediondeces de código más comunes
- Código Duplicado: Existencia de código idéntico o similar en más de una parte del código.
- Método grande: Un método, función o procedimiento el cual es excesivamente grande.
- Clase grande: una clase que ha crecido hasta hacerse demasiado grande. Estas se caracterizan por poseer funciones que no debern ir juntas.
- Demasiados parámetros: Posee una larga lista de parámetros de un procedimiento o función, la cual empeora la legibilidad y la calidad del código.
- Envidia de características: Una clase usa excesivamente métodos de otra clase.
- Clase perezosa: Una clase que hace muy poco.
- Complejidad artificiosa: Uso forzado de patrones de diseño demasiado complicados.
- Excesivo uso de literales: Estos deben codificarse como constantes con nombre, para mejorar la legibilidad y evitar errores de programación.

### Como identificar los Code Smells
Existen diversas técnicas para identificar code smells, entre las que se encuentran:

- Revisiones de código: Las revisiones de código son una práctica importante para identificar code smells. Durante una revisión de código, los desarrolladores pueden revisar el código de otros desarrolladores y buscar code smells.
- Herramientas de análisis estático: Las herramientas de análisis estático son herramientas que pueden analizar el código fuente y buscar code smells. Estas herramientas pueden ser útiles para identificar code smells que pueden ser difíciles de detectar manualmente.
- Experiencia: La experiencia en programación y la familiaridad con las mejores prácticas de desarrollo de software pueden ayudar a los desarrolladores a identificar code smells de manera más efectiva.

### ¿Cómo corregir code smells?

Existen diversas técnicas para corregir code smells, entre las que se encuentran:

- Refactorización: La refactorización es el proceso de modificar el código sin cambiar su comportamiento externo. La refactorización se puede utilizar para corregir code smells y mejorar la calidad del código.
- Patrones de diseño: Los patrones de diseño son soluciones probadas para problemas comunes de diseño de software. Se pueden utilizar para implementar código que sea más limpio, fácil de mantener y menos propenso a code smells.
- Programación en pares: La programación en pares es una técnica en la que dos desarrolladores trabajan juntos en una sola estación de trabajo para escribir y depurar código. La programación en pares puede ayudar a identificar code smells antes de que se acrecenten.

## Consideraciones Técnicas

Para el desarrollo de la demo, se utilizará Sonarqube con la finalidad de analizar el código y encontrar los code smells y otros indicadores de errores.

Para esto, se requiere de lo siguiente antes de empezar:
- Definir si se usará la versión instalable para Windows, Mac y distribuciones Linux o en docker.
- Tener instalado Java 17 (no funciona con Java 18 o versiones anteriores, solo con Java 17).

### Instalación/Configuración del Servicio

1. El primer paso es ingresar al enlace de https://docs.sonarsource.com/sonarqube/latest/try-out-sonarqube, para poder descargar el .zip que contiene las versiones de SonarQube correspondientes.
2. Posterior a ello, creamos en el disco local c una carpeta llamada __sonarqube__ y en ella descomprimimos el contenido del .zip.
3. Ingresamos a la carpeta resultante de la descompresión, luego entramos a la carpeta bin, luego a windows-x86-64 y ejectuamos el archivo de nombre __Start Sonar.bat__.
4. Se abrirá un CMD y deberás de concederle los permisos de conexión. Una vez terminada la carga del CMD, deberemos entrar al siguiente enlace http://localhost:9000 donde veremos la inferfaz de Sonarqube.
5. Aparecerá una ventana de Login, en la cual pondremos admin tanto en user como en password.
6. Una vez accedido, nos pedirá cambiar la contraseña, debemos hacer esto con fines de seguridad.

### Primeros Pasos
1. Una vez logramos acceder a la intefaz de Sonarqube, nos dejará crear un proyecto desde algún repositorio o de forma local. Por motivos del tutorial, lo haremos de forma local.
2. Aparecerá una venta en la cual asignaremos el nombre del proyecto. Para este caso, usaremos el nombre de PRUEBA.
3. Ahora nos preguntará sobre donde se encuentra alojado nuestro proyecto, para este caso, elegiremos la opción de *locally*.
4. Ahora nos proveerá de un token, el cual usaremos para ejecutar nuestro proyecto, de aquí lo generamos.
5. Una vez generado el token, nos preguntará sobre el tipo de proyecto, acá elegiremos en base al proyecto que estemos manejando, sea un .net, js, python, etc.
6. Terminamos elegidiendo el sistema operativo, para este caso, Windows.   
*Nota importante*: Si es la primera vez que ejecutamos un proyecto, hacemos clic en el enlace donde nos dirigirá a la herramienta de Scanner. Descargamos el .zip en base a la versión de nuestro sistema operativo. Luego lo vamos a descomprimir en la carpeta __sonarqube__. Una vez realizado esto, deberemos de agregar la carpeta Bin del scanner a las variables de entorno del sistema.
7. Una vez realizado lo anterior, iremos a la carpeta de un proyecto que tengamos localente, hacemos clic derecho y abrimos un cmd, y pegaremos el comando que nos indica Sonarqube para ejecutar el escaner.
8. Una vez terminada, la página de sonarqube se actualizará y nos mostrará información relacionada a los code smells y el análisis del código.
## Demo
Enlace de la demo: https://youtu.be/uEwDq1j9Jaw