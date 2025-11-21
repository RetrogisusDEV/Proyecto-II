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
        DEFAULT_CENTER: [-66.2442, 9.8606], // Altagracia de Orituco
        DEFAULT_ZOOM: 14,
        MARKER_ICON: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNC40MTQgNy41ODYgMTggMTIgMThDMTYuNDE0IDE4IDIwIDE0LjQxNCAyMCAxMEMyMCA1LjU4NiAxNi40MTQgMiAxMiAyWk0xMiAxMkMxMC44OTcgMTIgMTAgMTEuMTAzIDEwIDEwQzEwIDguODk3IDEwLjg5NyA4IDEyIDhDMTMuMTAzIDggMTQgOC44OTcgMTQgMTBDMTQgMTEuMTAzIDEzLjEwMyAxMiAxMiAxMloiIGZpbGw9IiNmZjAwMDAiLz4KPC9zdmc+',
        SELECTED_MARKER_ICON: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNmZjAwMDAiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iOCIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iNCIgZmlsbD0iI2ZmMDAwMCIvPgo8L3N2Zz4K'
    }
};

// Clase para manejar el almacenamiento local
class StorageManager {
    static getItem(key) {
        try {
            const item = localStorage.getItem(key);
            if (item) return JSON.parse(item);

            // fallback to sessionStorage if localStorage is empty/unavailable
            try {
                const sess = sessionStorage.getItem(key + '_fallback');
                if (sess) {
                    console.debug(`StorageManager: getItem fallback from sessionStorage for ${key}`);
                    return JSON.parse(sess);
                }
            } catch (se) {
                // ignore sessionStorage errors
            }

            return null;
        } catch (e) {
            console.error(`Error leyendo ${key} de localStorage:`, e);
            return null;
        }
    }

    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            // keep a sessionStorage fallback copy in case localStorage is not persisted across contexts
            try {
                sessionStorage.setItem(key + '_fallback', JSON.stringify(value));
            } catch (se) {
                // ignore sessionStorage write errors
            }
            return true;
        } catch (e) {
            console.error(`Error guardando ${key} en localStorage:`, e);
            // try to store in sessionStorage as last resort
            try {
                sessionStorage.setItem(key + '_fallback', JSON.stringify(value));
                console.debug(`StorageManager: stored ${key} in sessionStorage fallback`);
                return true;
            } catch (se) {
                console.error(`StorageManager: failed to store ${key} in sessionStorage fallback:`, se);
                return false;
            }
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

    static getLoginAttempts() {
        return this.getItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS) || { count: 0, lockUntil: null, blocked: false };
    }

    static saveLoginAttempts(attempts) {
        return this.setItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS, attempts);
    }

    static clearLoginAttempts() {
        return this.setItem(CONFIG.STORAGE_KEYS.LOGIN_ATTEMPTS, { count: 0, lockUntil: null, blocked: false });
    }
}