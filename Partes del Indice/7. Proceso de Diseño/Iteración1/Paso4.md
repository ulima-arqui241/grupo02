# Decisiones de Diseño

| Codigo | Decisión de Diseño                                                          | Justificación                                                                                                                                                                                                      |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DEC-01 | Se usará el Patron Modelo-Vista-Controlador                                 | Debido a que se trabajará constantemente en la interfaz de usuario, resulta clave el mantener los componentes separados. Esto ayuda con el CON-05.                                                                 |
| DEC-02 | Utilización de Web Sockets                                                  | El uso de websockets mejora el rendimiento ante el uso del http, generando una menor sobrecarga y una menor latencia. Ante la necesidad de una comunicación inmediata, resulta una mejor opción. Util para CON-01. |
| DEC-03 | Las contraseñas de los usuarios estará encriptada al almacenarse en la BBDD | Es crucial que la información de los usuarios se proteja ante ataques, especialmente las. contraseñas. Esto contribuye con CON-04 y el CRN-03                                                                      |

## Diagrama del Modelo Vista Controlador

![ModeloVistaControlador](../../../PNGs/MVC_PT.png)
