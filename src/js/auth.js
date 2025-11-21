// Sistema de autenticación
console.debug('auth.js loaded');
class AuthSystem {
    static initialize() {
        console.debug('AuthSystem: initialize called');
        this.setupEventListeners();
        this.toggleForms(true);
        this.updateLockState();
        
        // Iniciar poller para actualizar estado de bloqueo
        setInterval(() => this.updateLockState(), 1000);
    }

    static setupEventListeners() {
        // Manejadores de formularios
        document.getElementById('register-form').addEventListener('submit', (e) => this.registerUser(e));
        document.getElementById('login-form').addEventListener('submit', (e) => this.loginUser(e));

        // Manejadores de enlaces de toggle
        document.getElementById('show-register-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForms(false);
        });
        
        document.getElementById('show-login-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForms(true);
        });
    }

    static toggleForms(showLogin) {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        loginForm.classList.toggle('hidden', !showLogin);
        registerForm.classList.toggle('hidden', showLogin);

        this.clearMessage();
        loginForm.reset();
        registerForm.reset();
    }

    static showMessage(text, type = 'info') {
        const el = document.getElementById('message');
        el.textContent = text;
        el.className = 'rounded-lg p-4 mb-6 text-center';
        
        if (type === 'error') {
            el.classList.add('bg-red-100', 'text-red-700', 'border', 'border-red-200');
        } else if (type === 'success') {
            el.classList.add('bg-green-100', 'text-green-700', 'border', 'border-green-200');
        } else {
            el.classList.add('bg-blue-100', 'text-blue-700', 'border', 'border-blue-200');
        }
        
        el.classList.remove('hidden');
    }

    static clearMessage() {
        const el = document.getElementById('message');
        el.textContent = '';
        el.className = 'hidden';
    }

    static disableAuthControls(disabled) {
        const controls = document.querySelectorAll('#login-form input, #login-form button, #register-form input, #register-form button');
        controls.forEach(el => {
            el.disabled = disabled;
            if (disabled) {
                el.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                el.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    static updateLockState() {
        let attempts = StorageManager.getLoginAttempts();
        const now = Date.now();

        if (attempts.blocked) {
            this.disableAuthControls(true);
            this.showMessage('Acceso bloqueado permanentemente. Contacta al administrador.', 'error');
            return true;
        }
        
        if (attempts.lockUntil && now < attempts.lockUntil) {
            const secs = Math.ceil((attempts.lockUntil - now) / 1000);
            this.disableAuthControls(true);
            this.showMessage(`Demasiados intentos fallidos. Intenta de nuevo en ${secs} s.`, 'error');
            return true;
        }
        
        // Si el bloqueo temporal ha expirado
        if (attempts.lockUntil && now >= attempts.lockUntil) {
            attempts.lockUntil = null;
            attempts.count = 0;
            StorageManager.saveLoginAttempts(attempts);
            this.clearMessage();
        }

        this.disableAuthControls(false);
        return false;
    }

    static registerUser(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value.trim();
        const firstName = document.getElementById('reg-firstname').value.trim();
        const lastName = document.getElementById('reg-lastname').value.trim();
        const employeeId = document.getElementById('reg-employee-id').value.trim();
        const password = document.getElementById('reg-password').value;
        const confirm = document.getElementById('reg-password-confirm').value;

        if (!name || !firstName || !lastName || !employeeId || !password || !confirm) {
            this.showMessage('Rellena todos los campos.', 'error');
            return;
        }
        
        if (password.length < 8) {
            this.showMessage('La contraseña debe tener al menos 8 caracteres.', 'error');
            return;
        }
        
        if (password !== confirm) {
            this.showMessage('Las contraseñas no coinciden.', 'error');
            return;
        }

        const users = StorageManager.getUsers();
        const exists = users.find(u => u.name.toLowerCase() === name.toLowerCase());
        
        if (exists) {
            this.showMessage('Ya existe una cuenta con ese usuario.', 'error');
            return;
        }

        // Crear objeto de usuario
        const userData = { 
            name, 
            firstName, 
            lastName, 
            employeeId, 
            password,
            registrationDate: new Date().toISOString()
        };
        
        // Guardar usuario
        users.push(userData);
        StorageManager.saveUsers(users);

        // Guardar en lista de pendientes para Firebase
        const pendingUsers = StorageManager.getPendingUsers();
        pendingUsers.push(userData);
        StorageManager.savePendingUsers(pendingUsers);

        // Intentar subir a Firebase (si está disponible)
        try {
            const ok = FirebaseManager.uploadUserData(userData);
            if (!ok) console.warn('AuthSystem: Firebase upload returned false, user left in pending list');
        } catch (err) {
            console.error('AuthSystem: error uploading to Firebase', err);
        }

        this.showMessage('Registro correcto. Ya puedes iniciar sesión.', 'success');
        document.getElementById('register-form').reset();
        
        setTimeout(() => {
            this.toggleForms(true);
        }, 2000);
    }

    static async loginUser(e) {
        e.preventDefault();
        if (this.updateLockState()) return;

        const name = document.getElementById('login-name').value.trim();
        const password = document.getElementById('login-password').value;

        if (!name || !password) {
            this.showMessage('Rellena usuario y contraseña.', 'error');
            return;
        }

        let users = StorageManager.getUsers();
        let user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === password);

        // If not found locally, try Firebase
        if (!user) {
            try {
                const remote = await FirebaseManager.getUserByNameOrEmployeeId(name);
                if (remote && remote.password === password) {
                    user = remote;
                    // Save locally for offline
                    users.push(user);
                    StorageManager.saveUsers(users);
                }
            } catch (err) {
                console.error('AuthSystem: Firebase lookup failed', err);
            }
        }

        if (!user) {
            let attempts = StorageManager.getLoginAttempts();
            attempts.count = (attempts.count || 0) + 1;

            if (attempts.count >= CONFIG.AUTH.MAX_ATTEMPTS_BLOCK) {
                attempts.blocked = true;
                this.showMessage('Cuenta bloqueada tras demasiados intentos fallidos.', 'error');
            } else if (attempts.count >= CONFIG.AUTH.MAX_ATTEMPTS_LOCK) {
                attempts.lockUntil = Date.now() + CONFIG.AUTH.LOCK_DURATION_MS;
                this.showMessage(`Límite de intentos alcanzado. Campos deshabilitados por ${CONFIG.AUTH.LOCK_DURATION_MS / 1000} s.`, 'error');
            } else if (attempts.count === CONFIG.AUTH.MAX_ATTEMPTS_LOCK - 2) {
                this.showMessage(`Advertencia: quedan ${CONFIG.AUTH.MAX_ATTEMPTS_LOCK - attempts.count} intentos antes de una restricción temporal.`, 'error');
            } else {
                this.showMessage('Credenciales incorrectas.', 'error');
            }

            StorageManager.saveLoginAttempts(attempts);
            this.updateLockState();
            return;
        }

        // Login exitoso
        try {
            console.debug('AuthSystem: setting current user', user.name);
            StorageManager.setCurrentUser({
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                employeeId: user.employeeId
            });
            // Read back to verify persistence
            console.debug('AuthSystem: stored user now ->', StorageManager.getCurrentUser());
        } catch (err) {
            console.error('AuthSystem: error saving current user', err);
            this.showMessage('Error interno al iniciar sesión. Revisa la consola.', 'error');
            return;
        }

        StorageManager.clearLoginAttempts();
        this.showMessage('Inicio de sesión correcto. Redireccionando...', 'success');

        // Usar ruta relativa explícita y log para depuración
        setTimeout(() => {
            try {
                const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
                const target = basePath + 'gestion.html';
                console.debug('AuthSystem: redirecting to', target);
                console.debug('AuthSystem: window.location before redirect', window.location.href, window.location.origin, window.location.protocol);
                // Verify the user was persisted; if not use sessionStorage fallback then redirect
                const persisted = StorageManager.getCurrentUser();
                if (!persisted) {
                    console.warn('AuthSystem: user not persisted to localStorage; applying sessionStorage fallback');
                    try {
                        const fallbackUser = { name: user.name, firstName: user.firstName, lastName: user.lastName, employeeId: user.employeeId };
                        sessionStorage.setItem('app_current_user_fallback', JSON.stringify(fallbackUser));
                        sessionStorage.setItem('app_current_user_fallback_time', Date.now().toString());
                    } catch (se) {
                        console.error('AuthSystem: sessionStorage fallback failed', se);
                        this.showMessage('No se puede almacenar la sesión. Habilita almacenamiento local o usa otro navegador.', 'error');
                        return;
                    }
                }

                // Do a robust redirect (assign ensures navigation and sets referrer)
                window.location.assign(target);
            } catch (err) {
                console.error('AuthSystem: redirect failed', err);
                this.showMessage('No se pudo redireccionar automáticamente. Por favor visita gestion.html manualmente.', 'error');
            }
        }, 700);
    }

    static uploadToFirebase(userData) {
        try {
            if (typeof FirebaseManager !== 'undefined') {
                return FirebaseManager.uploadUserData(userData);
            } else {
                console.warn('AuthSystem: FirebaseManager no disponible');
                return false;
            }
        } catch (err) {
            console.error('AuthSystem: uploadToFirebase error', err);
            return false;
        }
    }

    static checkAuth() {
        return StorageManager.getCurrentUser();
    }

    static logout() {
        StorageManager.clearCurrentUser();
        window.location.href = 'login.html';
    }
}