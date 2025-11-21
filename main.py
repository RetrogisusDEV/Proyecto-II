import webview
import os
import sys

def start_app():
    # Obtener el directorio base de manera segura para Android y PC
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Ruta al archivo HTML local
    # Nota: En Android, buildozer empaquetará 'src' si se configura correctamente
    html_path = os.path.join(base_dir, "src", "index.html")

    if not os.path.exists(html_path):
        # Crear un html de fallback por si falla la carga de archivos
        html_path = "<h1>Error: index.html no encontrado</h1><p>Verifica la estructura de carpetas.</p>"

    # Configuración de la ventana
    window = webview.create_window(
        title="App Nodos",
        url=html_path,
        width=1024,
        height=700,
        min_size=(450, 450),
        resizable=True,
        # text_select=False # Opcional: desactiva selección de texto en móvil
    )

    # Iniciar el loop de la aplicación
    # 'gui=None' permite que pywebview detecte automáticamente el entorno (Win/Android)
    webview.start(debug=True)

if __name__ == "__main__":
    start_app()