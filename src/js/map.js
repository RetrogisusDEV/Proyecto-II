// Manejo del mapa OpenLayers
console.debug('map.js loaded');
class MapManager {
    static map = null;
    static vectorSource = null;
    static popup = null;

    static initialize(appState) {
        return new Promise((resolve) => {
            try {
                if (typeof ol === 'undefined') {
                    console.error('MapManager: OpenLayers (ol) no está disponible. El mapa no se inicializará.');
                    resolve();
                    return;
                }
            } catch (err) {
                console.error('MapManager: error comprobando OpenLayers', err);
                resolve();
                return;
            }

            this.vectorSource = new ol.source.Vector();
            const vectorLayer = new ol.layer.Vector({
                source: this.vectorSource,
            });

            this.map = new ol.Map({
                target: "map",
                layers: [
                    new ol.layer.Tile({ 
                        source: new ol.source.OSM() 
                    }),
                    vectorLayer
                ],
                view: new ol.View({
                    center: ol.proj.fromLonLat(CONFIG.MAP.DEFAULT_CENTER),
                    zoom: CONFIG.MAP.DEFAULT_ZOOM,
                }),
            });

            // Configurar eventos del mapa (si existe)
            try {
                this.setupMapEvents(appState);
            } catch (err) {
                console.error('MapManager: error al configurar eventos del mapa', err);
            }

            // Quitar estado de carga
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.classList.add('map-loaded');
            }

            resolve();
        });
    }

    static setupMapEvents(appState) {
        // Evento de clic en el mapa para mostrar popup
        this.map.on('click', (evt) => {
            const feature = this.map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
            if (feature) {
                const nodeData = feature.get('nodeData');
                if (nodeData) {
                    this.showMapPopup(nodeData, evt.coordinate, appState);
                } else {
                    this.closePopup(appState);
                }
            } else {
                this.closePopup(appState);
            }
        });

        // Evento para cambiar cursor al pasar sobre marcadores
        this.map.on('pointermove', (evt) => {
            const pixel = this.map.getEventPixel(evt.originalEvent);
            const hit = this.map.hasFeatureAtPixel(pixel);
            this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
        });
    }

    static drawMarkers(appState) {
        if (!this.map || !this.vectorSource) {
            console.error('❌ Mapa o fuente de vector no inicializados');
            return;
        }

        this.vectorSource.clear();
        
        if (appState.nodes.length === 0) {
            console.log('ℹ️ No hay nodos para dibujar en el mapa.');
            return;
        }

        const normalMarkerStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: CONFIG.MAP.MARKER_ICON,
                scale: 1.2,
            }),
        });

        const selectedMarkerStyle = new ol.style.Style({
            image: new ol.style.Icon({
                anchor: [0.5, 1],
                src: CONFIG.MAP.SELECTED_MARKER_ICON,
                scale: 1.5,
            }),
        });

        const features = appState.nodes.map(origNode => {
            const node = (typeof NodeUtils !== 'undefined') ? NodeUtils.toAppNode(origNode) : origNode;
            if (typeof node.lat !== 'number' || typeof node.lon !== 'number') {
                console.warn('⚠️ Nodo inválido (lat/lon faltante):', origNode);
                return null;
            }

            const point = new ol.geom.Point(ol.proj.fromLonLat([node.lon, node.lat]));

            const feature = new ol.Feature({
                geometry: point,
                nodeData: node 
            });

            feature.setId(node.id);

            // Aplicar estilo según selección
            if (node.id === appState.selectedNodeId) {
                feature.setStyle(selectedMarkerStyle);
            } else {
                feature.setStyle(normalMarkerStyle);
            }

            return feature;
        }).filter(f => f !== null);

        this.vectorSource.addFeatures(features);
        console.log(`🗺️ Dibujados ${features.length} marcadores en el mapa.`);
    }

    static showMapPopup(nodeData, coordinate, appState) {
        // Eliminar popup existente
        if (this.popup) {
            this.map.removeOverlay(this.popup);
        }
        
        // Crear elemento popup
        const popupElement = document.createElement('div');
        popupElement.className = 'ol-popup';
        // Preferir originalData si existe para mostrar campos rico
        const raw = nodeData.originalData || nodeData;
        const location = raw.location || raw.locationName || raw.name || '';
        const capacity = raw.capacity || raw.portCapacity || '';
        const boxCount = raw.boxCount || (raw.boxes ? raw.boxes.length : '');
        const installDate = raw.installDate || raw.installationDate || '';

        // Build boxes / cables summary HTML
        let boxesHtml = '';
        if (Array.isArray(raw.boxes) && raw.boxes.length > 0) {
            boxesHtml = '<div class="popup-boxes"><strong>Cajas:</strong><ul>' + raw.boxes.map(b => {
                const cables = Array.isArray(b.cables) ? b.cables.map(c => `${c.cableId || ''} (${c.operationalStatus || ''})`).join(', ') : '';
                return `<li><strong>${b.boxId || b.box || ''}</strong> - ${b.type || ''} - ${b.portCapacity || b.cableCapacity || ''} puertos ${b.status ? '- ' + b.status : ''}<div class="text-xs text-gray-600">Cables: ${cables}</div></li>`;
            }).join('') + '</ul></div>';
        }

        popupElement.innerHTML = `
            <div class="popup-header">
                <h3 class="font-semibold">${nodeData.name || location || 'Nodo Desconocido'}</h3>
            </div>
            <div class="popup-content">
                <p><strong>ID:</strong> ${nodeData.id}</p>
                <p><strong>Ubicación:</strong> ${location}</p>
                <p><strong>Estado:</strong> ${nodeData.status || raw.status || 'OK'}</p>
                <p><strong>Capacidad:</strong> ${capacity}</p>
                <p><strong>Cajas:</strong> ${boxCount}</p>
                <p><strong>Instalación:</strong> ${installDate}</p>
                ${boxesHtml}
                <div class="popup-actions">
                    <button class="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" onclick="AppManager.viewNodeOnMap('${nodeData.id}', true)">Ver Detalles</button>
                    <button class="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded" onclick="MapManager.closePopup()">Cerrar</button>
                </div>
            </div>
        `;
        
        // Crear overlay para el popup
        this.popup = new ol.Overlay({
            element: popupElement,
            positioning: 'bottom-center',
            stopEvent: false,
            offset: [0, -40]
        });
        
        this.map.addOverlay(this.popup);
        this.popup.setPosition(coordinate);
        
        // Actualizar nodo seleccionado
        appState.selectedNodeId = nodeData.id;
        AppManager.updateUI();
    }

    static closePopup(appState) {
        if (this.popup) {
            this.map.removeOverlay(this.popup);
            this.popup = null;
            if (appState) {
                appState.selectedNodeId = null;
                AppManager.updateUI();
            }
        }
    }

    static viewNodeOnMap(nodeId, appState, showPopup = false) {
        if (!this.map || !this.vectorSource) return;

        const feature = this.vectorSource.getFeatureById(nodeId);
        if (feature) {
            const geometry = feature.getGeometry();
            const coordinates = geometry.getCoordinates();
            const nodeData = feature.get('nodeData');
            
            this.map.getView().animate({
                center: coordinates,
                zoom: 16,
                duration: 1000
            });
            
            // Mostrar información en el panel lateral
            UIManager.displayNodeInfo(nodeData, appState);
            
            // Actualizar nodo seleccionado
            appState.selectedNodeId = nodeId;
            AppManager.updateUI();
            
            // Mostrar popup si se solicita
            if (showPopup) {
                this.showMapPopup(nodeData, coordinates, appState);
            }
            
            // Calcular y mostrar distancia si tenemos ubicación actual
            if (appState.currentLocation) {
                this.updateDistanceToNode(nodeData, appState);
            }
        }
    }

    static updateDistanceToNode(nodeData, appState) {
        const distance = this.calculateDistance(
            appState.currentLocation[1], 
            appState.currentLocation[0],
            nodeData.lat,
            nodeData.lon
        );
        
        const distanceIndicator = document.getElementById('distanceIndicator');
        const distanceValue = document.getElementById('distanceValue');
        
        if (distanceIndicator && distanceValue) {
            distanceValue.textContent = distance.toFixed(1);
            distanceIndicator.classList.remove('hidden');
        }
    }

    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    static centerToCurrentLocation(appState) {
        if (!navigator.geolocation) {
            console.error('La geolocalización no está soportada por este navegador');
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coordinates = ol.proj.fromLonLat([
                    position.coords.longitude,
                    position.coords.latitude
                ]);
                
                appState.currentLocation = [position.coords.longitude, position.coords.latitude];
                
                this.map.getView().animate({
                    center: coordinates,
                    zoom: 15,
                    duration: 1000
                });
                
                // Si hay un nodo seleccionado, actualizar distancia
                if (appState.selectedNodeId) {
                    const node = appState.nodes.find(n => n.id === appState.selectedNodeId);
                    if (node) {
                        this.updateDistanceToNode(node, appState);
                    }
                }
            },
            (error) => {
                console.error('Error obteniendo la ubicación:', error);
                alert('No se pudo obtener tu ubicación. Asegúrate de que la geolocalización esté activada.');
            }
        );
    }

    static showDirections(nodeId, appState) {
        const node = appState.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${node.lat},${node.lon}`;
        const wazeUrl = `https://waze.com/ul?ll=${node.lat},${node.lon}&navigate=yes`;
        
        const useWaze = confirm(
            `¿Cómo quieres obtener direcciones a ${node.name}?\n\n` +
            `Click en "Aceptar" para Waze o "Cancelar" para Google Maps`
        );
        
        if (useWaze) {
            window.open(wazeUrl, '_blank');
        } else {
            window.open(googleMapsUrl, '_blank');
        }
    }
}