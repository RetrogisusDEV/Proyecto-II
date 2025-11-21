// Manejo de reportes
console.debug('reports.js loaded');
class ReportsManager {
    static generateReportsHTML(appState) {
        return `
            <div class="p-4">
                <div class="mb-4">
                    <button id="generateReportBtn" class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition">
                        Generar Nuevo Reporte
                    </button>
                </div>
                <div class="border-t border-gray-200 pt-4">
                    <h3 class="text-md font-medium text-gray-900 mb-3">Reportes Recientes</h3>
                    ${appState.reports.length === 0 ? 
                        '<p class="text-gray-500 text-center py-4">No hay reportes generados.</p>' : 
                        appState.reports.map(report => `
                            <div class="border border-gray-200 rounded-lg p-3 mb-3 hover:bg-gray-50 cursor-pointer" onclick="ReportsManager.viewReport('${report.id}')">
                                <div class="flex justify-between items-start mb-2">
                                    <h4 class="font-medium text-gray-900">${report.title}</h4>
                                    <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium ${this.getStatusColor(report.status)}">
                                        ${report.status}
                                    </span>
                                </div>
                                <p class="text-sm text-gray-600 mb-1">${(report.description || '').substring(0, 100)}${(report.description || '').length > 100 ? '...' : ''}</p>
                                <div class="flex justify-between text-xs text-gray-500">
                                    <span>${report.nodeName}</span>
                                    <span>${report.date ? new Date(report.date).toLocaleDateString() : ''}</span>
                                </div>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }

    static showReportModal(appState) {
        const modal = document.getElementById('reportModal');
        const reportNodeSelect = document.getElementById('reportNode');
        if (!reportNodeSelect) {
            console.warn('ReportsManager: #reportNode select not found in DOM');
        } else {
            reportNodeSelect.innerHTML = '<option value="">Seleccionar nodo</option>';
            (appState.nodes || []).forEach(origNode => {
                const node = (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(origNode) : origNode;
                if (!node || !node.id) return;
                const option = document.createElement('option');
                option.value = node.id;
                option.textContent = node.name || node.id;
                reportNodeSelect.appendChild(option);
            });
        }
        
        modal.classList.remove('hidden');
        
        const cancelBtn = document.getElementById('cancelReport');
        const reportForm = document.getElementById('reportForm');
        
        if (cancelBtn) cancelBtn.onclick = () => modal.classList.add('hidden');
        if (reportForm) {
            reportForm.onsubmit = (e) => {
                e.preventDefault();
                this.generateReport(appState);
            };
        } else {
            console.warn('ReportsManager: #reportForm not found; cannot attach submit handler');
        }
    }

    static generateReport(appState) {
        const reportType = document.getElementById('reportType').value;
        const reportNode = document.getElementById('reportNode').value;
        const reportDescription = document.getElementById('reportDescription').value;
        
        if (!reportNode || !reportDescription) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }
        
        const node = (appState.nodes || []).map(n => (typeof NodeUtils !== 'undefined' ? NodeUtils.toAppNode(n) : n)).find(n => n && n.id === reportNode);
        if (!node) {
            alert('Nodo seleccionado no encontrado. Por favor selecciona un nodo válido.');
            return;
        }
        const reportTypes = {
            'mantenimiento': 'Mantenimiento',
            'falla': 'Falla Técnica',
            'instalacion': 'Instalación',
            'otro': 'Otro'
        };
        
        const newReport = {
            id: Date.now().toString(),
            title: `${reportTypes[reportType]} - ${node.name}`,
            type: reportType,
            nodeId: reportNode,
            nodeName: node.name,
            description: reportDescription,
            status: 'pendiente',
            date: new Date().toISOString(),
            user: (appState.currentUser ? {
                name: `${appState.currentUser.firstName || ''} ${appState.currentUser.lastName || ''}`.trim(),
                employeeId: appState.currentUser.employeeId || ''
            } : (function(){
                const cu = StorageManager.getCurrentUser() || {};
                return { name: `${cu.firstName || ''} ${cu.lastName || ''}`.trim(), employeeId: cu.employeeId || '' };
            })())
        };
        
        appState.reports.unshift(newReport);
        StorageManager.saveReports(appState.reports);
        // If report is a fault, update node status locally and persist
        try {
            if (reportType === 'falla') {
                const allNodes = appState.nodes || [];
                for (let i = 0; i < allNodes.length; i++) {
                    const raw = allNodes[i];
                    const n = (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(raw) : raw;
                    if (n && n.id === reportNode) {
                        // update original raw object if present
                        if (raw) {
                            if (raw.status !== undefined) raw.status = 'maintenance';
                            if (raw.latitude !== undefined && raw.longitude !== undefined) {
                                // keep coords
                            }
                        }
                        // replace stored node with normalized object that carries originalData
                        const updatedNode = Object.assign({}, n, { status: 'maintenance', originalData: raw || n.originalData || n });
                        // update in appState.nodes preserving original stored element
                        appState.nodes[i] = updatedNode;
                        break;
                    }
                }
                // persist nodes
                try { StorageManager.saveNodes(appState.nodes); } catch (e) { console.warn('ReportsManager: no se pudo guardar nodos tras marcar falla', e); }
                // refresh UI/map
                try { AppManager.updateUI(); } catch (e) { /* ignore */ }
            }
        } catch (e) {
            console.warn('ReportsManager: error actualizando estado de nodo tras reporte', e);
        }
        // Guardar reporte pendiente en cache local para subir a Firebase cuando haya sincronización
        try {
            const pending = StorageManager.getPendingReports();
            pending.push(newReport);
            StorageManager.savePendingReports(pending);
        } catch (e) {
            console.warn('ReportsManager: no se pudo guardar reporte pendiente', e);
        }
        
        document.getElementById('reportModal').classList.add('hidden');
        document.getElementById('reportForm').reset();
        AppManager.updateUI();
        
        alert('Reporte generado exitosamente.');
    }

    static viewReport(reportId) {
        const appState = window.AppManager.appState;
        const report = appState.reports.find(r => r.id === reportId);
        if (!report) return;
        // Find node original data for detailed info
        const node = (appState.nodes || []).map(n => (typeof NodeUtils !== 'undefined' ? NodeUtils.toAppNode(n) : n)).find(n => n && n.id === report.nodeId);
        const raw = node ? (node.originalData || node) : null;

        const reportWindow = window.open('', '_blank');
        reportWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte: ${report.title}</title>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        line-height: 1.6;
                        margin: 40px;
                        color: #333;
                    }
                    .header { 
                        border-bottom: 2px solid #e53e3e; 
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .section { 
                        margin-bottom: 20px; 
                    }
                    .label { 
                        font-weight: bold; 
                        color: #666;
                    }
                    pre {
                        background: #f5f5f5;
                        padding: 15px;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        font-family: Arial, sans-serif;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reporte Técnico - StarNet</h1>
                    <h2>${report.title}</h2>
                </div>
                
                <div class="section">
                    <div><span class="label">ID del Reporte:</span> ${report.id}</div>
                    <div><span class="label">Fecha:</span> ${new Date(report.date).toLocaleString()}</div>
                    <div><span class="label">Estado:</span> ${report.status}</div>
                </div>
                
                <div class="section">
                    <div><span class="label">Nodo:</span> ${report.nodeName} (ID: ${report.nodeId})</div>
                    <div><span class="label">Tipo:</span> ${report.type}</div>
                </div>

                ${raw ? `
                <div class="section">
                    <div class="label">Información del Nodo (desde DB)</div>
                    <pre>${JSON.stringify(raw, null, 2)}</pre>
                </div>
                ` : ''}
                
                <div class="section">
                    <div class="label">Descripción:</div>
                    <pre>${report.description}</pre>
                </div>
                
                <div class="section">
                    <div><span class="label">Generado por:</span> ${report.user.name}</div>
                    <div><span class="label">ID de Trabajador:</span> ${report.user.employeeId}</div>
                </div>
                
                <div class="section">
                    <div class="label">Notas:</div>
                    <pre>Este reporte fue generado automáticamente por el sistema StarNet.</pre>
                </div>
            </body>
            </html>
        `);
        reportWindow.document.close();
    }

    static getStatusColor(status) {
        switch(status) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'en_proceso': return 'bg-blue-100 text-blue-800';
            case 'completado': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
}