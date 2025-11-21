// Sincronización entre Firebase y localStorage
console.debug('sync.js loaded');
(function(global){
    const SyncManager = {
        intervalId: null,
        initialized: false,

        async initialize(options = {}){
            if (this.initialized) return true;
            this.options = Object.assign({ intervalMs: (typeof CONFIG !== 'undefined' && CONFIG.SYNC && CONFIG.SYNC.INTERVAL_MS) ? CONFIG.SYNC.INTERVAL_MS : 60000 }, options);

            // Ensure firebase initialized
            if (typeof FirebaseManager === 'undefined' || !FirebaseManager.ensureInitialized()) {
                console.warn('SyncManager: Firebase no disponible, intentando inicializar');
                try { FirebaseManager.initialize(); } catch (e) { console.warn('SyncManager: init failed', e); }
            }

            // Normalize any existing local data first
            try { if (StorageManager && typeof StorageManager.normalizeAllData === 'function') StorageManager.normalizeAllData(); } catch (e) { console.warn('SyncManager: normalization failed', e); }

            // One-time initial pull (merge/overwrite from remote)
            await this.pullFromFirebase();

            // Start periodic sync
            this.intervalId = setInterval(() => this.syncCycle(), this.options.intervalMs);
            this.initialized = true;
            console.log('SyncManager: inicializado. Intervalo:', this.options.intervalMs, 'ms');
            return true;
        },

        async syncCycle(){
            try {
                // First pull any remote changes
                await this.pullFromFirebase();

                // Then push pending local changes
                await this.pushPendingToFirebase();

                StorageManager.saveLastSync(Date.now());
            } catch (err) {
                console.error('SyncManager: error en ciclo de sincronización', err);
            }
        },

        async pullFromFirebase(){
            if (!FirebaseManager.ensureInitialized()) return false;

            try {
                // Pull nodes
                const snapNodes = await FirebaseManager.database.ref('central/fiberService/cabinets').once('value');
                const dataNodes = snapNodes.val();
                if (dataNodes) {
                    let nodesArray = [];
                    if (Array.isArray(dataNodes)) {
                        nodesArray = dataNodes.filter(Boolean);
                    } else if (typeof dataNodes === 'object') {
                        nodesArray = Object.keys(dataNodes).map(k => dataNodes[k]);
                    }

                    const mapped = nodesArray.map(n => (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(n) : n);
                    StorageManager.saveNodes(mapped);
                    console.log(`SyncManager: nodos sincronizados desde Firebase. Total: ${mapped.length}`);
                    // If AppManager exists, update it
                    if (global.AppManager && AppManager.appState) {
                        AppManager.appState.nodes = mapped;
                        AppManager.updateUI();
                    }
                }

                // Pull users
                const snapUsers = await FirebaseManager.database.ref('UserLogin').once('value');
                const dataUsers = snapUsers.val();
                if (dataUsers) {
                    let usersArr = [];
                    if (Array.isArray(dataUsers)) usersArr = dataUsers.filter(Boolean);
                    else if (typeof dataUsers === 'object') usersArr = Object.keys(dataUsers).map(k => dataUsers[k]);

                    const mappedUsers = usersArr.map(u => ({
                        name: u.name || u.username || '',
                        firstName: u.firstName || u.firstname || '',
                        lastName: u.lastName || u.lastName || '',
                        employeeId: u.employeeId || u.employee || '',
                        password: u.password || u.passwordHash || '',
                        registrationDate: u.registrationDate || u.lastLogin || new Date().toISOString()
                    }));

                    // Merge with existing local users, prefer remote
                    const local = StorageManager.getUsers() || [];
                    const merged = [];
                    const byKey = {};
                    local.forEach(l => { const k = (l.employeeId || l.name || '').toString(); if (k) byKey[k] = l; });
                    mappedUsers.forEach(r => { const k = (r.employeeId || r.name || '').toString(); if (k) byKey[k] = r; });
                    Object.keys(byKey).forEach(k => merged.push(byKey[k]));

                    StorageManager.saveUsers(merged);
                    console.log(`SyncManager: usuarios sincronizados desde Firebase. Total: ${merged.length}`);
                }

                return true;
            } catch (err) {
                console.error('SyncManager: error al tirar datos desde Firebase', err);
                return false;
            }
        },

        async pushPendingToFirebase(){
            if (!FirebaseManager.ensureInitialized()) return false;
            try {
                // Push pending users
                const pendingUsers = StorageManager.getPendingUsers() || [];
                if (pendingUsers.length > 0) {
                    const remainingUsers = [];
                    for (const u of pendingUsers) {
                        try {
                            const ok = FirebaseManager.uploadUserData(u);
                            if (!ok) remainingUsers.push(u);
                        } catch (e) {
                            remainingUsers.push(u);
                        }
                    }
                    StorageManager.savePendingUsers(remainingUsers);
                    console.log(`SyncManager: intentadas subir usuarios pendientes. Restantes: ${remainingUsers.length}`);
                }

                // Push pending reports
                const pendingReports = StorageManager.getPendingReports() || [];
                if (pendingReports.length > 0) {
                    const remainingReports = [];
                    for (const r of pendingReports) {
                        try {
                            const ok = FirebaseManager.uploadReport(r);
                            if (!ok) remainingReports.push(r);
                        } catch (e) {
                            remainingReports.push(r);
                        }
                    }
                    StorageManager.savePendingReports(remainingReports);
                    console.log(`SyncManager: intentadas subir reportes pendientes. Restantes: ${remainingReports.length}`);
                }

                return true;
            } catch (err) {
                console.error('SyncManager: error subiendo pendientes a Firebase', err);
                return false;
            }
        }
    };

    global.SyncManager = SyncManager;
})(typeof window !== 'undefined' ? window : this);
