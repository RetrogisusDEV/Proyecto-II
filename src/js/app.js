// Aplicación principal
class AppManager {
    static appState = null;

    static async initApplication() {
        try {
            console.debug('AppManager: initApplication start');
            // Verificar autenticación
            let currentUser = StorageManager.getCurrentUser();
            console.debug('AppManager: initApplication currentUser ->', currentUser);
            // If no current user in localStorage, check a sessionStorage fallback set during login
            if (!currentUser && sessionStorage.getItem('app_current_user_fallback')) {
                try {
                    const fallback = JSON.parse(sessionStorage.getItem('app_current_user_fallback'));
                    console.debug('AppManager: restoring currentUser from sessionStorage fallback ->', fallback);
                    StorageManager.setCurrentUser(fallback);
                    // Remove fallback so we don't rely on it again
                    sessionStorage.removeItem('app_current_user_fallback');
                    sessionStorage.removeItem('app_current_user_fallback_time');
                    currentUser = StorageManager.getCurrentUser();
                } catch (err) {
                    console.error('AppManager: failed to restore fallback currentUser', err);
                }
            }
            console.debug('AppManager: initApplication currentUser ->', currentUser);
            if (!currentUser) {
                console.warn('AppManager: No currentUser found, redirecting to login');
                // window.location.href = 'login.html';
                return;
            }

            // Inicializar estado de la aplicación
            this.appState = new AppState();
            this.appState.currentUser = currentUser;
            this.appState.reports = StorageManager.getReports();

            // Cargar componente de la aplicación
            await this.loadAppComponent();
            console.debug('AppManager: app component loaded');

            // Inicializar Firebase
            if (!FirebaseManager.initialize()) {
                console.warn('Firebase no se pudo inicializar, usando modo offline');
            }

            // Inicializar mapa
            await MapManager.initialize(this.appState);
            console.debug('AppManager: MapManager.initialize finished');

            // Configurar UI
            UIManager.setupEventListeners(this.appState);
            UIManager.displayUserInfo(this.appState);
            UIManager.setupConnectivityMonitoring(this.appState);

            // Cargar datos iniciales
            await this.loadInitialData();

            console.log('✅ Aplicación inicializada correctamente');

        } catch (error) {
            console.error('❌ Error en inicialización:', error);
            throw error;
        }
    }

    static async loadAppComponent() {
        try {
            const response = await fetch('components/app.html');
            const html = await response.text();
            document.getElementById('app-container').innerHTML = html;
        } catch (error) {
            console.error('Error cargando componente de aplicación:', error);
            throw error;
        }
    }

    static async loadInitialData() {
        const localNodes = StorageManager.getNodes();
        if (localNodes.length > 0) {
            this.appState.nodes = localNodes;
            this.updateUI();
            console.log(`📁 Cargados ${localNodes.length} nodos desde caché local`);
        }

        if (this.appState.isOnline) {
            FirebaseManager.setupNodesListener(this.appState);
        } else {
            console.warn('⚠️ Sin conexión. Mostrando datos locales. Se sincronizará al reconectar.');
        }
        
        window.addEventListener('online', () => {
            if (!window.firebaseListenerAttached) {
                FirebaseManager.setupNodesListener(this.appState);
                window.firebaseListenerAttached = true;
            }
        });
    }

    static updateUI() {
        console.log('🎨 Actualizando interfaz de usuario...');
        MapManager.drawMarkers(this.appState);
        UIManager.updateNodeList(this.appState);
    }

    static setActiveSection(sectionName) {
        if (this.appState) {
            this.appState.activeSection = sectionName;
            UIManager.updateNodeList(this.appState);
        }
    }

    static displayNodeById(nodeId) {
        const node = this.appState.nodes.find(n => n.id === nodeId);
        if (node) {
            UIManager.displayNodeInfo(node, this.appState);
            MapManager.viewNodeOnMap(nodeId, this.appState, true);
        }
    }

    static viewNodeOnMap(nodeId, showPopup = false) {
        MapManager.viewNodeOnMap(nodeId, this.appState, showPopup);
    }

    static closePopup() {
        MapManager.closePopup(this.appState);
    }

    static showDirections(nodeId) {
        MapManager.showDirections(nodeId, this.appState);
    }

    static centerToCurrentLocation() {
        MapManager.centerToCurrentLocation(this.appState);
    }

    static viewReport(reportId) {
        ReportsManager.viewReport(reportId);
    }

    static showErrorToUser(message) {
        UIManager.showErrorToUser(message);
    }
}

// Estado global de la aplicación
class AppState {
    constructor() {
        this.nodes = [];
        this.reports = [];
        this.activeSection = 'Reportes';
        this.isOnline = navigator.onLine;
        this.selectedNodeId = null;
        this.currentLocation = null;
        this.currentUser = null;
    }
}

// Inicializar eventos globales
document.addEventListener('DOMContentLoaded', () => {
    // Configurar evento para el botón de generar reporte
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'generateReportBtn') {
            ReportsManager.showReportModal(AppManager.appState);
        }
    });
});