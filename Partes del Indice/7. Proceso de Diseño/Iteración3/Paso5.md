# Elementos de arquitecturas y asignación de responsabilidades

| Código | Decisión de diseño                                                              | Fundamentación                                                                 |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| DEC-13 | Desplegar los mensajes de forma anticipada en otro nodo para ganar rendimiento. | Utilizar la interacción asíncrona para mejorar el rendimiento de los mensajes. |
| DEC-14 | Aplicar un balanceador de carga para mejorar el rendimiento                     | Tener dos servidores para poder balancear las cargas entre ambos servidores.   |
