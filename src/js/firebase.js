// Manejo de Firebase
console.debug('firebase.js loaded');
class FirebaseManager {
    static app = null;
    static database = null;
    static listenerAttached = false;

    static initialize() {
        try {
            this.app = firebase.initializeApp(CONFIG.FIREBASE);
            this.database = firebase.database();
            console.log('✅ Firebase inicializado correctamente');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando Firebase:', error);
            return false;
        }
    }

    static setupNodesListener(appState) {
        if (!this.database) {
            console.error('Firebase no está inicializado');
            return false;
        }

        const nodesRef = this.database.ref('central/fiberService/cabinets');
        
        nodesRef.on('value', (snapshot) => {
            console.log('🔄 Recibidos datos de Firebase...');
            const data = snapshot.val();
            let fetchedNodes = [];

            if (data) {
                if (Array.isArray(data)) {
                    fetchedNodes = data
                        .filter(cabinet => cabinet && typeof cabinet.latitude === 'number' && typeof cabinet.longitude === 'number')
                        .map(cabinet => ({
                            id: cabinet.nodeId,
                            lat: cabinet.latitude,
                            lon: cabinet.longitude,
                            name: cabinet.location || `Gabinete ${cabinet.nodeId}`,
                            status: cabinet.status,
                            originalData: cabinet
                        }));
                } else if (typeof data === 'object' && data !== null) {
                    fetchedNodes = Object.keys(data).map(key => {
                        const cabinet = data[key];
                        if (cabinet && typeof cabinet.latitude === 'number' && typeof cabinet.longitude === 'number') {
                            return {
                                id: cabinet.nodeId || key,
                                lat: cabinet.latitude,
                                lon: cabinet.longitude,
                                name: cabinet.location || `Gabinete ${cabinet.nodeId}`,
                                status: cabinet.status,
                                originalData: cabinet
                            };
                        }
                        return null;
                    }).filter(Boolean);
                }
            }

            if (fetchedNodes.length > 0) {
                appState.nodes = fetchedNodes;
                StorageManager.saveNodes(fetchedNodes);
                AppManager.updateUI();
                console.log(`✅ Sincronización exitosa. Total de nodos: ${fetchedNodes.length}`);
            } else {
                console.log('ℹ️ Sincronización completa, no se encontraron nodos en Firebase.');
                appState.nodes = [];
                StorageManager.saveNodes([]);
                AppManager.updateUI();
            }
        }, (error) => {
            console.error('❌ Error en el listener de Firebase:', error);
        });

        this.listenerAttached = true;
        return true;
    }

    static uploadUserData(userData) {
        if (!this.database) {
            console.warn('Firebase no disponible para subir datos de usuario');
            return false;
        }

        // Implementar subida de datos de usuario a Firebase
        // Por ahora solo es un placeholder
        console.log('Subiendo datos de usuario a Firebase:', userData);
        return true;
    }

    static uploadReport(reportData) {
        if (!this.database) {
            console.warn('Firebase no disponible para subir reporte');
            return false;
        }

        // Implementar subida de reportes a Firebase
        console.log('Subiendo reporte a Firebase:', reportData);
        return true;
    }

    static disconnect() {
        if (this.app) {
            // Desconectar listeners si es necesario
            this.listenerAttached = false;
        }
    }
}