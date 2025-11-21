// Manejo de Firebase
console.debug('firebase.js loaded');
class FirebaseManager {
    static app = null;
    static database = null;
    static listenerAttached = false;

    static ensureInitialized() {
        if (this.database) return true;
        try {
            this.app = firebase.initializeApp(CONFIG.FIREBASE);
            this.database = firebase.database();
            console.debug('FirebaseManager: initialized inside ensureInitialized');
            return true;
        } catch (err) {
            console.error('FirebaseManager: could not initialize Firebase', err);
            return false;
        }
    }

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
        // Ensure DB initialized
        if (!this.ensureInitialized()) {
            console.warn('Firebase no disponible para subir datos de usuario');
            return false;
        }

        try {
            // Use employeeId as primary key when available, else use name_timestamp
            const key = (userData.employeeId && userData.employeeId.toString().trim()) ? userData.employeeId.toString().trim() : `${userData.name}_${Date.now()}`;
            const ref = this.database.ref(`UserLogin/${key}`);
            // Don't store password in plaintext in production; storing here per request
            ref.set(userData);
            console.log('FirebaseManager: uploaded user data to UserLogin/', key);
            return true;
        } catch (err) {
            console.error('FirebaseManager: error uploading user data', err);
            return false;
        }
    }

    static async getUserByNameOrEmployeeId(identifier) {
        if (!this.ensureInitialized()) {
            console.warn('Firebase not initialized; cannot fetch user');
            return null;
        }

        try {
            const snapshot = await this.database.ref('UserLogin').once('value');
            const data = snapshot.val();
            if (!data) return null;

            // If identifier matches a key exactly (employeeId), return that (normalized)
            const normalize = (u) => {
                if (!u) return null;
                return {
                    name: u.name || u.username || '',
                    firstName: u.firstName || u.firstname || u.givenName || '',
                    lastName: u.lastName || u.lastname || u.last || u.surname || '',
                    employeeId: u.employeeId || u.employee || u.empId || null,
                    // accept password or passwordHash fields
                    password: u.password || u.passwordHash || '',
                    original: u
                };
            };

            if (data[identifier]) {
                return normalize(data[identifier]);
            }

            // Otherwise search by name case-insensitive across known fields
            const idLower = identifier.toLowerCase();
            for (const k of Object.keys(data)) {
                const u = data[k];
                if (!u) continue;
                const candidateName = (u.name || u.username || '').toLowerCase();
                const candidateEmp = (u.employeeId || u.employee || '').toString();
                if (candidateName === idLower || candidateEmp === identifier) {
                    return normalize(u);
                }
            }

            return null;
        } catch (err) {
            console.error('FirebaseManager: error fetching user by identifier', err);
            return null;
        }
    }

    static uploadReport(reportData) {
        if (!this.ensureInitialized()) {
            console.warn('Firebase no disponible para subir reporte');
            return false;
        }

        try {
            const id = reportData.id || Date.now().toString();
            const ref = this.database.ref(`Reports/${id}`);
            ref.set(reportData);
            console.log('FirebaseManager: uploaded report to Reports/', id);
            return true;
        } catch (err) {
            console.error('FirebaseManager: error uploading report', err);
            return false;
        }
    }

    static disconnect() {
        if (this.app) {
            // Desconectar listeners si es necesario
            this.listenerAttached = false;
        }
    }
}