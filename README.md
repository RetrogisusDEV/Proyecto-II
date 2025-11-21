# StarNet — Sistema de Gestión (Proyecto-II)

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

El script generará artefactos en la carpeta `build/` (detalle según configuración de `build.bat` y `windowsbuild.py`). Revise la salida en la terminal para ver rutas y archivos generados.

Notas importantes
---------------
- Para pruebas locales, sirva los archivos estáticos (`src/`) desde un servidor HTTP (por ejemplo `python -m http.server`) para evitar limitaciones de `localStorage` y CORS al usar SDKs externos.
- Las contraseñas se almacenan en el repositorio como texto plano actualmente para pruebas; no es seguro. Para producción, migre a Firebase Authentication o implemente hashing y verificación en servidor.

Contacto
-------
Para consultas sobre licencia o despliegue contacte al propietario del repositorio.

Generar/actualizar `NOTICE` y `THIRD_PARTY.md`
-------------------------------------------
Hay un script simple para detectar referencias a bibliotecas externas y actualizar
el archivo `NOTICE` y generar `THIRD_PARTY.md` con detalles:

```powershell
python .\scripts\generate_notice.py
```

El script busca URLs comunes en `src/` (`.html` y `.js`) y las dependencias listadas
en `requirements.txt`, luego sobrescribe `NOTICE` y crea/actualiza `THIRD_PARTY.md`.

