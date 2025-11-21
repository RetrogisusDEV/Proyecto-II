# StarNet : Sistema de Gestión (Proyecto-II)

![starnet](./src/images/logo.png)

---

Pequeña aplicación cliente para gestión de nodos y generación de reportes con mapa interactivo. Incluye:

- Interfaz web con panel lateral izquierdo/derecho y mapa (OpenLayers).
- Autenticación simple (registro/inicio de sesión) y persistencia local, con integración opcional a Firebase Realtime Database para sincronizar usuarios y datos.
- Generación y envío de reportes, y visualización de nodos geolocalizados.

Uso y licencia
--------------
Este repositorio contiene software destinado a uso privado y corporativo. Contiene código con patente y/o restricciones de distribución: no reproduzca ni distribuya sin la debida autorización del propietario. Consulte los archivos `LICENSE` y `NOTICE` incluidos para más detalles legales.

Compilación / Empaquetado (Windows)
----------------------------------
Para crear una versión compilada en Windows (empaquetado con PyInstaller u otro script incluido), use el `build.bat` incluido en la raíz del proyecto:

1. Abra PowerShell en la carpeta del proyecto.
2. Ejecute:

```powershell
.\\build.bat
```

Contacto
-------
Para consultas sobre licencia o despliegue contacte al propietario del repositorio.
