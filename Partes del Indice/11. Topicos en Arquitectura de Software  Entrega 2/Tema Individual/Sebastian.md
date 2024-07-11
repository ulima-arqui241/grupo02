# Micro Frontends

Debido a las complicaciones que existen dentro de las aplicaciones modernas. Ademas, varias de estas aplicaciones son desarrolladas y/o mantenidas por multiples equipos de trabajo. Todo esto puede generar errores y dificultades durante el mantenimiento, sobretodo si todo se desarrolla en un único repositorio.

Para solucionar este problema, se desarrollo la arquitectura de Micro Frontend. El cual, según Aplyca (2023), consiste en un tipo de arquitectura donde se divide una aplicación web en diferentes módulos o funciones individuales, implementados de manera autónoma, permitiendo a los equipos de frontend el mismo nivel de flexibilidad y velocidad que los microservicios brindan a los equipos de backend.

El término de "micro frontends" fue usado por primera vez en 2016. En el cual, inspirandose en el modelo de microservicios, este nacio como solución para el desarrollo de aplicaciones web complejas, permitiendo dividirlas en modulos pequeños que actuan independientes.

Algunos conceptos claves de micro frontends son los siguientes:

- **Desarrollo independiente:** Los equipos de desarrollo pueden trabajar como unidades separadas dentro de un proyecto más grande o como unidades más pequeñas. Cada uno de los subelementos anteriores se convierte en un elemento independiente, responsable de una característica o función específica.
- **Autonomía del módulo:** Cada módulo está diseñado para ser único e independiente. Estos módulos no necesitan depender de otras partes de la aplicación para funcionar correctamente. Este nivel de autonomía se extiende al desarrollo y operación del micro frontend.

Para el desarrollo de esta demostracion de micro frontend, se ha utilizado el framework de Single-spa (https://single-spa.js.org/). En el cual, en resumidas palabras, se necesitan dos comandos basicos para el desarrollo del micro frontend, los cuales son los siguientes:

```javascript
npx create-single-spa --moduleType root-config
```

El cual crea el modulo base que existe para ejecutar las aplicaciones single-spa.

```javascript
npx create-single-spa --moduleType app-parcel
```

El cual crea la aplicacion single-spa que puede utilizar sus propios frameworks o librerias. El cual tiene libertad siempre que se encuentre montada dentro de single-spa.

[Video demo](https://drive.google.com/file/d/1vmHfjbHt9MdtxZ-OTCJ6PWXpx6_bm-hc/view?usp=sharing)
