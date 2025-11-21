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
                                <p class="text-sm text-gray-600 mb-1">${report.description.substring(0, 100)}${report.description.length > 100 ? '...' : ''}</p>
                                <div class="flex justify-between text-xs text-gray-500">
                                    <span>${report.nodeName}</span>
                                    <span>${new Date(report.date).toLocaleDateString()}</span>
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
        
        reportNodeSelect.innerHTML = '<option value="">Seleccionar nodo</option>';
        appState.nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = node.name;
            reportNodeSelect.appendChild(option);
        });
        
        modal.classList.remove('hidden');
        
        const cancelBtn = document.getElementById('cancelReport');
        const reportForm = document.getElementById('reportForm');
        
        cancelBtn.onclick = () => modal.classList.add('hidden');
        reportForm.onsubmit = (e) => {
            e.preventDefault();
            this.generateReport(appState);
        };
    }

    static generateReport(appState) {
        const reportType = document.getElementById('reportType').value;
        const reportNode = document.getElementById('reportNode').value;
        const reportDescription = document.getElementById('reportDescription').value;
        
        if (!reportNode || !reportDescription) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }
        
        const node = appState.nodes.find(n => n.id === reportNode);
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
            user: {
                name: `${appState.currentUser.firstName} ${appState.currentUser.lastName}`,
                employeeId: appState.currentUser.employeeId
            }
        };
        
        appState.reports.unshift(newReport);
        StorageManager.saveReports(appState.reports);
        
        document.getElementById('reportModal').classList.add('hidden');
        document.getElementById('reportForm').reset();
        AppManager.updateUI();
        
        alert('Reporte generado exitosamente.');
    }

    static viewReport(reportId) {
        const appState = window.AppManager.appState;
        const report = appState.reports.find(r => r.id === reportId);
        if (!report) return;
        
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