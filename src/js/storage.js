// Configuración de la aplicación
console.debug('storage.js loaded');
const CONFIG = {
    FIREBASE: {
        apiKey: "AIzaSyByBawppJfWRPzFVgOhuxK_KWPGbTCjxkE",
        authDomain: "starnet-report-program.firebaseapp.com",
        databaseURL: "https://starnet-report-program-default-rtdb.firebaseio.com",
        projectId: "starnet-report-program",
        storageBucket: "starnet-report-program.firebasestorage.app",
        messagingSenderId: "837993869502",
        appId: "1:837993869502:web:eb183b3041378ea40aeeef",
    },
    STORAGE_KEYS: {
        USERS: 'app_users',
        PENDING_USERS: 'app_pending_users',
        CURRENT_USER: 'app_current_user',
        NODES: 'starnetAppNodes',
        REPORTS: 'starnetAppReports',
        LAST_SYNC: 'starnetLastSync',
        LOGIN_ATTEMPTS: 'app_login_attempts'
    },
    AUTH: {
        MAX_ATTEMPTS_LOCK: 5,
        MAX_ATTEMPTS_BLOCK: 10,
        LOCK_DURATION_MS: 10 * 1000 // 10 segundos
    },
    MAP: {
        DEFAULT_CENTER: [-66.3832, 9.8581], // Altagracia de Orituco
        DEFAULT_ZOOM: 14,
        MARKER_ICON: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNC40MTQgNy41ODYgMTggMTIgMThDMTYuNDE0IDE4IDIwIDE0LjQxNCAyMCAxMEMyMCA1LjU4NiAxNi40MTQgMiAxMiAyWk0xMiAxMkMxMC44OTcgMTIgMTAgMTEuMTAzIDEwIDEwQzEwIDguODk3IDEwLjg5NyA4IDEyIDhDMTMuMTAzIDggMTQgOC44OTcgMTQgMTBDMTQgMTEuMTAzIDEzLjEwMyAxMiAxMiAxMloiIGZpbGw9IiNmZjAwMDAiLz4KPC9zdmc+',
        SELECTED_MARKER_ICON: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNmZjAwMDAiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iOCIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iNCIgZmlsbD0iI2ZmMDAwMCIvPgo8L3N2Zz4K'
    }
};

// Interval de sincronización por defecto (ms)
CONFIG.SYNC = {
    INTERVAL_MS: 60 * 1000 // 1 minuto
};

// Clase para manejar el almacenamiento local
class StorageManager {
    static getItem(key) {
        try {
            const item = localStorage.getItem(key);
            if (item) return JSON.parse(item);
            return null;
        } catch (e) {
            console.error(`Error leyendo ${key} de localStorage:`, e);
            return null;
        }
    }

    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error guardando ${key} en localStorage:`, e);
            // No fallback storage available; return false to indicate persistence failed
            return false;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error removiendo ${key} de localStorage:`, e);
            return false;
        }
    }

    // Métodos específicos para la aplicación
    static getUsers() {
        return this.getItem(CONFIG.STORAGE_KEYS.USERS) || [];
    }

    static saveUsers(users) {
        return this.setItem(CONFIG.STORAGE_KEYS.USERS, users);
    }

    static getPendingUsers() {
        return this.getItem(CONFIG.STORAGE_KEYS.PENDING_USERS) || [];
    }

    static savePendingUsers(users) {
        return this.setItem(CONFIG.STORAGE_KEYS.PENDING_USERS, users);
    }

    static getCurrentUser() {
        const user = this.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
        console.debug('StorageManager: getCurrentUser ->', user);
        return user;
    }

    static setCurrentUser(user) {
        const result = this.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, user);
        console.debug('StorageManager: setCurrentUser ->', result, user);
        return result;
    }

    static clearCurrentUser() {
        return this.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    }

    static getNodes() {
        return this.getItem(CONFIG.STORAGE_KEYS.NODES) || [];
    }

    static saveNodes(nodes) {
        return this.setItem(CONFIG.STORAGE_KEYS.NODES, nodes);
    }

    static getReports() {
        return this.getItem(CONFIG.STORAGE_KEYS.REPORTS) || [];
    }

    static saveReports(reports) {
        return this.setItem(CONFIG.STORAGE_KEYS.REPORTS, reports);
    }

    static getPendingReports() {
        return this.getItem('app_pending_reports') || [];
    }

    static savePendingReports(reports) {
        return this.setItem('app_pending_reports', reports);
    }

    static clearPendingReports() {
        return this.setItem('app_pending_reports', []);
    }

    static getLoginAttempts() {
        return this.getItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS) || { count: 0, lockUntil: null, blocked: false };
    }

    static saveLoginAttempts(attempts) {
        return this.setItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);
    }

    static clearLoginAttempts() {
        return this.setItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS, { count: 0, lockUntil: null, blocked: false });
    }

    static getLastSync() {
        return this.getItem(CONFIG.STORAGE_KEYS.LAST_SYNC) || null;
    }

    static saveLastSync(ts) {
        return this.setItem(CONFIG.STORAGE_KEYS.LAST_SYNC, ts);
    }

    // Normalize stored data (nodes, users, reports, pending lists) to app internal schema
    static normalizeAllData() {
        try {
            // Normalize nodes
            let nodes = this.getNodes() || [];
            if (nodes && nodes.length > 0) {
                const normalized = nodes.map(n => {
                    if (typeof NodeUtils !== 'undefined') return NodeUtils.toAppNode(n);
                    // fallback mapping
                    const lat = (typeof n.lat === 'number') ? n.lat : (typeof n.latitude === 'number' ? n.latitude : null);
                    const lon = (typeof n.lon === 'number') ? n.lon : (typeof n.longitude === 'number' ? n.longitude : null);
                    const id = n.id || n.nodeId || (n.location ? n.location.replace(/\s+/g, '_') : Date.now().toString());
                    return { id, lat, lon, name: n.name || n.location || `Nodo ${id}`, status: n.status || 'unknown', originalData: n };
                }).filter(nn => nn && typeof nn.lat === 'number' && typeof nn.lon === 'number');
                this.saveNodes(normalized);
            }

            // Normalize users
            let users = this.getUsers() || [];
            if (users && users.length > 0) {
                const normalizedUsers = users.map(u => {
                    return {
                        name: u.name || u.username || '',
                        firstName: u.firstName || u.firstname || '',
                        lastName: u.lastName || u.lastName || '',
                        employeeId: u.employeeId || u.employee || u.empId || '',
                        // keep password or passwordHash as-is (we cannot reverse hashes)
                        password: u.password || u.passwordHash || u.pass || '',
                        registrationDate: u.registrationDate || u.lastLogin || new Date().toISOString()
                    };
                });
                this.saveUsers(normalizedUsers);
            }

            // Normalize pending users
            let pending = this.getPendingUsers() || [];
            if (pending && pending.length > 0) {
                const normalizedPending = pending.map(u => ({
                    name: u.name || u.username || '',
                    firstName: u.firstName || u.firstname || '',
                    lastName: u.lastName || u.lastName || '',
                    employeeId: u.employeeId || u.employee || '',
                    password: u.password || u.passwordHash || '',
                    registrationDate: u.registrationDate || new Date().toISOString()
                }));
                this.savePendingUsers(normalizedPending);
            }

            // Normalize pending reports
            let pReports = this.getPendingReports() || [];
            if (pReports && pReports.length > 0) {
                const normalizedPR = pReports.map(r => ({
                    id: r.id || Date.now().toString(),
                    title: r.title || r.type || 'Reporte',
                    type: r.type || 'otro',
                    nodeId: r.nodeId || (r.node && r.node.id) || '',
                    nodeName: r.nodeName || (r.node && r.node.name) || '',
                    description: r.description || '',
                    status: r.status || 'pendiente',
                    date: r.date || new Date().toISOString(),
                    user: r.user || { name: r.userName || '', employeeId: r.employeeId || '' }
                }));
                this.savePendingReports(normalizedPR);
            }

            // Normalize reports
            let reports = this.getReports() || [];
            if (reports && reports.length > 0) {
                const normalizedReports = reports.map(r => ({
                    id: r.id || Date.now().toString(),
                    title: r.title || r.type || 'Reporte',
                    type: r.type || 'otro',
                    nodeId: r.nodeId || (r.node && r.node.id) || '',
                    nodeName: r.nodeName || (r.node && r.node.name) || '',
                    description: r.description || '',
                    status: r.status || 'pendiente',
                    date: r.date || new Date().toISOString(),
                    user: r.user || { name: r.userName || '', employeeId: r.employeeId || '' }
                }));
                this.saveReports(normalizedReports);
            }

            console.log('StorageManager: normalization completed');
            return true;
        } catch (err) {
            console.error('StorageManager: normalization failed', err);
            return false;
        }
    }
}