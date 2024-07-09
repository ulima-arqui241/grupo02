# Elementos de arquitecturas y asignacion de responsabilidades

| Código | Decisión de Diseño                                                              | Fundamentación                                                                                                                        |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| DEC-04 | Retirar el origén de los datos locales de la aplicación                         | No resulta necesario el uso de almacenamiento local ya que toda la información está almacenada en un servidor MongoDB online.         |
| DEC-05 | Se debe crear un módulo enfocado en el conexión entre el frontend y el backend. | Se requiere de abstraer este componente con la finalidad de asegurar la constante interconexión de entre estas. Esto ayuda con CON-06 |

[Regresar al Proceso de Diseño](../ProcesoDeDiseño.md)
