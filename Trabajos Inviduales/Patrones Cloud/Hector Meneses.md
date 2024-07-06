## Cache-Aside

Es una estrategia utilizada para mejorar el rendimiento y la escalabilidad de las aplicaciones
al reducir la carga en la base de datos. Este patrón permite que los datos se almacenen en una
caché para ser rápidamente accesibles, evitando así accesos repetidos a la base de datos.
- **Consulta en la caché:** Cuando una aplicación necesita acceder a ciertos datos, primero
consulta la caché para ver si los datos ya están almacenados allí.
- **Consulta en la base de datos:** Si los datos no se encuentran en la caché (cache miss), la
aplicación entonces consulta la base de datos.
- **Actualización de la caché:** Después de recuperar los datos de la base de datos, la aplicación
almacena (escribe) estos datos en la caché para futuras solicitudes.
- **Devolución de los datos:** Finalmente, la aplicación devuelve los datos al usuario.

Elegimos SQLite y Redis para esta demo del patrón Cache-Aside debido a sus características
complementarias y beneficios específicos. SQLite es una base de datos liviana que no requiere un servidor separado, lo que facilita su configuración y uso en entornos de desarrollo y pruebas. Su portabilidad, al almacenar los datos en un solo archivo, permite una gestión y transferencia sencilla. Además, su simplicidad la hace ideal para pequeñas aplicaciones y demostraciones, ofreciendo compatibilidad con la mayoría de los lenguajes de programación y sistemas operativos, lo que facilita su integración.

Por otro lado, Redis es una base de datos en memoria extremadamente rápida, diseñada
específicamente para ser utilizada como caché. Su capacidad para ofrecer tiempos de acceso
y recuperación de datos muy bajos la convierte en una opción eficiente para mejorar el
rendimiento de las aplicaciones. Redis soporta diversas estructuras de datos, como strings,
hashes, listas y sets, lo que la hace versátil. Aunque es una base de datos en memoria, Redis puede persistir datos en el disco, ofreciendo un balance entre velocidad y durabilidad.

Además, su capacidad de escalabilidad, a través de la replicación y particionado de datos,
permite adaptar la solución a medida que crecen las necesidades de la aplicación. Juntos,
SQLite y Redis proporcionan una solución efectiva para implementar el patrón Cache-Aside,
combinando la simplicidad y portabilidad de SQLite con la velocidad y eficiencia de Redis.

**Demo:**
- https://drive.google.com/file/d/1HTh-T6XNSieIjJ9T8ccbsGGzErB8329b/view?usp=sharing