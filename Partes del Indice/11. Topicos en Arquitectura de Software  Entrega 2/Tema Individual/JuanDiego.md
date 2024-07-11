# Automatización de Pruebas

Las pruebas automatizadas consisten en la aplicación de herramientas de software para automatizar el proceso manual de revisión y validación de un producto de software que lleva a cabo una persona.

## Objetivos Principales

- **Eficiencia**: Automatizar tareas repetitivas y de larga duración para liberar recursos humanos.
- **Precisión**: Reducir errores humanos en la ejecución de pruebas.
- **Cobertura**: Ejecutar un número más amplio de pruebas en menos tiempo aumentando la cobertura de prueba.

## Beneficios

- Ahorro de tiempo y costes
- Repetibilidad
- Mejora en la calidad del software

## Tipos de Pruebas Automatizadas

- **Pruebas funcionales**: Verificar que el software funciona según lo esperado.
- **Pruebas de regresión**: Asegurar que las nuevas modificaciones no afecten el funcionamiento existente.
- **Pruebas de carga y rendimiento**: Evaluar el comportamiento del software bajo carga y condiciones de rendimiento extremas.
- **Pruebas de interfaz de usuario**: Verificar la interacción del usuario con la interfaz gráfica.

## Pirámide de la Automatización

La pirámide de la automatización de pruebas ayuda con la comprensión de la frecuencia a realizar cada tipo de prueba. Esta se divide en cuatro niveles, la capa inferior representa las pruebas que deben realizarse con mayor frecuencia. Los niveles se hacen más pequeños cuanto más representan pruebas que deberían realizarse con menos frecuencia. La pirámide se ordena de mayor a menor de la siguiente forma:

1. Pruebas Unitarias: Estos tests unitarios son los encargados de testear componentes o funcionalidades individuales para validar que funciona de la manera esperada en condiciones aisladas.
2. Pruebas de Integración: Se trata de pruebas que validan la interacción de un fragmento de código con componentes externos. Estos componentes pueden variar desde bases de datos, APIs y similares fuentes de información.
3. Pruebas de Interfaz de Usuario: Estas pruebas verifican el sistema completo desde el punto de vista del usuario final, simulando escenarios reales de uso.

## Demo con Selenium IDE
### Requisitos
- Para ejecutar la demo, se requiere de un navegador basado el Chromium.
- Se debe instalar la extensión de Selenium IDE para utilizarlo dentro del navegador.

### Ejecución
1. Una vez instalado el Selenium IDE, se hace clic en la extensión y creamos un nuevo proyecto.
2. Hacemos click en el botón de la grabadora y ponemos la página web a la cual queremos testear.
3. Una vez dentro, realizamos las acciones las cuales queremos testear.
4. Terminamos la grabación y podemos modificar todos los datos que querramos para realizar diversos casos.

Enlace de la Demo: https://youtu.be/PhY0mi3knBg

## Demo con Selenium + Python
### Requisitos
- Para ejecutar la demo, se requiere de tener instalado Google Chrome.
- Como se usará python, se deberá instalar selenium, para esto se escribe en el terminal "pip install -U selenium".
- Se requiere de un web driver, para ello se debe descargar el chromedriver para la versión a la que corresponda el sistema operativo desde el siguiente enlance "https://googlechromelabs.github.io/chrome-for-testing/#stable".

### Ejecución
1. Se debe crear un archivo en python y pegar el siguiente código:

    ```
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service

    base_url = "https://www.amazon.com/"
    
    executable_path = r"C:/Users/user/Downloads/chromedriver_win32/chromedriver.exe"

    service = Service(executable_path)
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(service=service, options=options)

    driver.maximize_window()

    driver.implicitly_wait(10)

    driver.get(base_url)

    assert "Google" in driver.title

    driver.close()
    ```

2. Se ejecuta el código, pero no va a encontrar Google como titulo ya que se está buscando en la página de Amazon. Indicando que la prueba falló.

Enlace de la Demo: https://youtu.be/HWXAVONQMyg