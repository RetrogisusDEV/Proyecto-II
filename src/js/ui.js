// Manejo de la interfaz de usuario
console.debug('ui.js loaded');
class UIManager {
    static setupEventListeners(appState) {
        // Botones de navegación
        const btnReportes = document.getElementById('btnReportes');
        const btnNodos = document.getElementById('btnNodos');

        if (btnReportes) {
            btnReportes.addEventListener('click', () => {
                AppManager.setActiveSection('Reportes');
                btnReportes.classList.remove('text-gray-700', 'hover:bg-gray-100');
                btnReportes.classList.add('bg-red-600', 'text-white');
                if (btnNodos) {
                    btnNodos.classList.remove('bg-red-600', 'text-white');
                    btnNodos.classList.add('text-gray-700', 'hover:bg-gray-100');
                }
                // En móvil: si el panel derecho ya está abierto y la sección activa es la misma,
                // cerrar el panel; en caso contrario, abrirlo. Esto evita duplicar su apertura
                try {
                    if (window.innerWidth <= 768) {
                        const sidebarNodes = document.getElementById('sidebar-nodes');
                        const overlay = document.getElementById('overlay');
                        if (sidebarNodes && sidebarNodes.classList.contains('open') && appState && appState.activeSection === 'Reportes') {
                            sidebarNodes.classList.remove('open');
                            if (overlay) overlay.classList.remove('active');
                            return;
                        }
                        if (sidebarNodes) sidebarNodes.classList.add('open');
                        if (overlay) overlay.classList.add('active');
                    }
                } catch (e) {
                    console.debug('UIManager: no mobile sidebar to toggle', e);
                }
            });
        } else {
            console.warn('UIManager: #btnReportes no encontrado al adjuntar listeners');
        }

        if (btnNodos) {
            btnNodos.addEventListener('click', () => {
                AppManager.setActiveSection('Nodos');
                btnNodos.classList.remove('text-gray-700', 'hover:bg-gray-100');
                btnNodos.classList.add('bg-red-600', 'text-white');
                if (btnReportes) {
                    btnReportes.classList.remove('bg-red-600', 'text-white');
                    btnReportes.classList.add('text-gray-700', 'hover:bg-gray-100');
                }
                // En móvil: si el panel derecho ya está abierto y la sección activa es la misma,
                // cerrar el panel; en caso contrario, abrirlo.
                try {
                    if (window.innerWidth <= 768) {
                        const sidebarNodes = document.getElementById('sidebar-nodes');
                        const overlay = document.getElementById('overlay');
                        if (sidebarNodes && sidebarNodes.classList.contains('open') && appState && appState.activeSection === 'Nodos') {
                            sidebarNodes.classList.remove('open');
                            if (overlay) overlay.classList.remove('active');
                            return;
                        }
                        if (sidebarNodes) sidebarNodes.classList.add('open');
                        if (overlay) overlay.classList.add('active');
                    }
                } catch (e) {
                    console.debug('UIManager: no mobile sidebar to toggle', e);
                }
            });
        } else {
            console.warn('UIManager: #btnNodos no encontrado al adjuntar listeners');
        }

        // Control de menús móviles
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const mobileInfoToggle = document.getElementById('mobile-info-toggle');
        const overlay = document.getElementById('overlay');
        const sidebarInfo = document.getElementById('sidebar-info');
        const sidebarNodes = document.getElementById('sidebar-nodes');

        if (mobileMenuToggle && overlay && sidebarInfo) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebarInfo.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        } else {
            if (!mobileMenuToggle) console.warn('UIManager: #mobile-menu-toggle not found');
            if (!overlay) console.warn('UIManager: #overlay not found');
            if (!sidebarInfo) console.warn('UIManager: #sidebar-info not found');
        }

        if (mobileInfoToggle && overlay && sidebarNodes) {
            mobileInfoToggle.addEventListener('click', () => {
                sidebarNodes.classList.toggle('open');
                overlay.classList.toggle('active');
            });
        } else {
            if (!mobileInfoToggle) console.warn('UIManager: #mobile-info-toggle not found');
            if (!sidebarNodes) console.warn('UIManager: #sidebar-nodes not found');
        }

        if (overlay && sidebarInfo && sidebarNodes) {
            overlay.addEventListener('click', () => {
                sidebarInfo.classList.remove('open');
                sidebarNodes.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        // Botón de ubicación actual
        const currentLocationBtn = document.getElementById('currentLocationBtn');
        if (currentLocationBtn) {
            currentLocationBtn.addEventListener('click', () => {
            MapManager.centerToCurrentLocation(appState);
            });
        } else {
            console.warn('UIManager: #currentLocationBtn not found');
        }
    }

    static displayNodeInfo(nodeData, appState) {
        console.log('ℹ️ Mostrar información del nodo:', nodeData);
        
        const sidebarContent = document.getElementById('sidebarContent');
        const infoLoading = document.getElementById('infoLoading');
        
        if (sidebarContent) {
            if(infoLoading) infoLoading.style.display = 'none';

            const node = (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(nodeData) : nodeData;
            const raw = node.originalData || nodeData;

            // Build boxes HTML
            let boxesHtml = '';
            if (Array.isArray(raw.boxes) && raw.boxes.length > 0) {
                boxesHtml = '<div class="mt-4"><h4 class="text-sm font-medium mb-2">Cajas</h4>' + raw.boxes.map(b => {
                    const cables = Array.isArray(b.cables) ? b.cables.map(c => `\n• ${c.cableId || ''} — ${c.color || ''} — ${c.operationalStatus || ''} ${c.contractNumber ? ' ('+c.contractNumber+')' : ''}`).join('') : '';
                    return `<div class="mb-3 p-3 bg-gray-50 rounded"><div class="text-sm font-medium">${b.boxId || b.box || 'Caja'}</div><div class="text-xs text-gray-600">Tipo: ${b.type || ''} • Puertos: ${b.portCapacity || ''} • Capacidad de cable: ${b.cableCapacity || ''} • Estado: ${b.status || ''}</div><div class="text-xs text-gray-500 mt-2">Cables:${cables}</div></div>`;
                }).join('') + '</div>';
            }

            sidebarContent.innerHTML = `
                <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div class="bg-red-600 p-4 text-white">
                        <h3 class="text-lg font-semibold">${node.name || 'Nodo Desconocido'}</h3>
                    </div>
                    <div class="p-4">
                        <div class="mb-3">
                            <span class="text-sm text-gray-500 block">ID</span>
                            <span class="font-medium">${node.id}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-sm text-gray-500 block">Estado</span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${node.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${node.status || 'OK'}
                            </span>
                        </div>
                        <div class="mb-3">
                            <span class="text-sm text-gray-500 block">Ubicación</span>
                            <span class="font-medium">${raw.location || raw.locationName || ''}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-sm text-gray-500 block">Capacidad</span>
                            <span class="font-medium">${raw.capacity || ''}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-sm text-gray-500 block">Cajas</span>
                            <span class="font-medium">${raw.boxCount || (raw.boxes ? raw.boxes.length : '')}</span>
                        </div>
                        <div class="mb-3">
                            <span class="text-sm text-gray-500 block">Instalación</span>
                            <span class="font-medium">${raw.installDate || ''}</span>
                        </div>
                        <div class="mb-4">
                            <span class="text-sm text-gray-500 block">Coordenadas</span>
                            <span class="font-mono text-sm">${(node.lat || 0).toFixed(4)}, ${(node.lon || 0).toFixed(4)}</span>
                        </div>
                        ${boxesHtml}
                        <div class="flex space-x-2">
                            <button class="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition" onclick="MapManager.viewNodeOnMap('${node.id}', window.AppManager.appState)">
                                Ver en Mapa
                            </button>
                            <button class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition" onclick="MapManager.showDirections('${node.id}', window.AppManager.appState)">
                                Cómo Llegar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            // Mostrar panel en móvil
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar-info').classList.add('open');
                document.getElementById('overlay').classList.add('active');
            }
        }
    }

    static updateNodeList(appState) {
        const listElement = document.getElementById('nodeList');
        const listTitle = document.getElementById('sidebarTitle');
        const listLoading = document.getElementById('nodeListLoading');
        
        if (!listElement || !listTitle) return;

        listTitle.textContent = appState.activeSection;

        if (appState.activeSection === 'Reportes') {
            if (listLoading) listLoading.style.display = 'none';
            
            listElement.innerHTML = ReportsManager.generateReportsHTML(appState);
            
        } else if (appState.activeSection === 'Nodos') {
            if (appState.nodes.length === 0) {
                listElement.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <svg class="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        <p class="mt-2">No hay nodos para mostrar.</p>
                    </div>
                `;
                return;
            }

            if (listLoading) listLoading.style.display = 'none';

            listElement.innerHTML = appState.nodes.map(origNode => {
                const node = (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(origNode) : origNode;
                return `<div class="p-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition ${node.id === appState.selectedNodeId ? 'bg-red-50 border-red-200' : ''}" onclick="AppManager.displayNodeById('${node.id}')">
                    <div class="flex items-start">
                        <div class="flex-shrink-0 w-10 h-10 ${node.id === appState.selectedNodeId ? 'bg-red-600' : 'bg-red-100'} rounded-full flex items-center justify-center mr-3">
                            <svg class="w-5 h-5 ${node.id === appState.selectedNodeId ? 'text-white' : 'text-red-600'}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-gray-900 truncate">${node.name || 'Nodo'}</p>
                            <p class="text-sm text-gray-500">ID: ${node.id}</p>
                            <div class="mt-1">
                                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${node.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${node.status || 'OK'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    }

    static displayUserInfo(appState) {
        if (!appState.currentUser) return;
        
        const userInfoElement = document.getElementById('user-info');
        const userNameElement = document.getElementById('user-name');
        const employeeIdElement = document.getElementById('employee-id');
        const userInitialsElement = document.getElementById('user-initials');
        
        if (userInfoElement && userNameElement && employeeIdElement && userInitialsElement) {
            const firstName = appState.currentUser.firstName || '';
            const lastName = appState.currentUser.lastName || '';
            const employeeId = appState.currentUser.employeeId || '';
            
            userNameElement.textContent = `${firstName} ${lastName}`;
            employeeIdElement.textContent = `ID: ${employeeId}`;
            
            const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
            userInitialsElement.textContent = initials;
            
            userInfoElement.classList.remove('hidden');
        }
    }

    static setupConnectivityMonitoring(appState) {
        const updateOnlineStatus = () => {
            appState.isOnline = navigator.onLine;
            const statusElement = document.getElementById('connectivityStatus');
            
            if (statusElement) {
                statusElement.textContent = appState.isOnline ? '🟢 En línea' : '🔴 Sin conexión';
                statusElement.style.background = appState.isOnline ? '#10b981' : '#ef4444';
                statusElement.classList.remove('hidden');
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        updateOnlineStatus();
    }

    static showErrorToUser(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => errorDiv.remove(), 5000);
    }
}