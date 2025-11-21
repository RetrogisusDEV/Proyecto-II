// Utilidades para normalizar la estructura de nodos entre diferentes fuentes
console.debug('nodeutils.js loaded');
(function(global){
    const NodeUtils = {
        getId(node) {
            return node.id || node.nodeId || node.node_id || (node.node && node.node.id) || null;
        },
        getLat(node) {
            // Manejar varias convenciones
            return (typeof node.lat === 'number') ? node.lat : (typeof node.latitude === 'number' ? node.latitude : (typeof node.Latitude === 'number' ? node.Latitude : null));
        },
        getLon(node) {
            return (typeof node.lon === 'number') ? node.lon : (typeof node.longitude === 'number' ? node.longitude : (typeof node.Longitude === 'number' ? node.Longitude : null));
        },
        getName(node) {
            return node.name || node.location || node.locationName || node.displayName || null;
        },
        getStatus(node) {
            return node.status || node.state || 'unknown';
        },
        // Convierte cualquier objeto de origen en el formato interno esperado
        toAppNode(node) {
            const lat = this.getLat(node);
            const lon = this.getLon(node);
            const id = this.getId(node) || (node.nodeId || node.id || (this.getName(node) ? this.getName(node).replace(/\s+/g,'_') : Date.now().toString()));
            return {
                id: id,
                lat: lat,
                lon: lon,
                name: this.getName(node) || `Nodo ${id}`,
                status: this.getStatus(node),
                originalData: node
            };
        }
    };

    global.NodeUtils = NodeUtils;
})(typeof window !== 'undefined' ? window : this);
