// Aplicación principal
class AppManager {
    static appState = null;

    static async initApplication() {
        try {
            console.debug('AppManager: initApplication start');
            // Verificar autenticación
            let currentUser = StorageManager.getCurrentUser();
            console.debug('AppManager: initApplication currentUser ->', currentUser);
            // Depend only on persistent localStorage (StorageManager). No sessionStorage fallback.
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

        // Si no hay nodos en caché, intentar cargar `db.json` local como fuente de datos
        if (this.appState.nodes.length === 0) {
            try {
                const resp = await fetch('db.json');
                if (resp && resp.ok) {
                    const db = await resp.json();
                    // Cargar nodos desde db.json -> central.fiberService.cabinets
                    if (db && db.central && db.central.fiberService && Array.isArray(db.central.fiberService.cabinets)) {
                        const cabinets = db.central.fiberService.cabinets;
                        const mapped = cabinets.map(c => (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(c) : c);
                        this.appState.nodes = mapped;
                        StorageManager.saveNodes(mapped);
                        this.updateUI();
                        console.log(`📄 Cargados ${mapped.length} nodos desde db.json`);
                    }

                    // Cargar usuarios desde db.json si no hay usuarios locales
                    const localUsers = StorageManager.getUsers();
                    if ((!localUsers || localUsers.length === 0) && Array.isArray(db.userlogin)) {
                        const users = db.userlogin.map(u => ({
                            name: u.username || u.name || '',
                            firstName: u.firstname || u.firstName || '',
                            lastName: u.lastName || u.lastName || '',
                            employeeId: u.employeeId || u.employee || '',
                            // No podemos invertir un hash; almacenar passwordHash en el campo password para permitir login comparaciones si el sistema espera hashes
                            password: u.password || u.passwordHash || '' ,
                            registrationDate: u.lastLogin || new Date().toISOString()
                        }));
                        StorageManager.saveUsers(users);
                        console.log(`📄 Cargados ${users.length} usuarios desde db.json`);
                    }
                }
            } catch (err) {
                console.warn('AppManager: no se pudo cargar db.json localmente', err);
            }
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
        const raw = this.appState.nodes.find(n => {
            const id = (typeof NodeUtils !== 'undefined') ? NodeUtils.getId(n) : (n && n.id);
            return id === nodeId;
        });
        if (raw) {
            const node = (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(raw) : raw;
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