import mapboxgl from "mapbox-gl";

function wrapElmApplication(elmApp) {
  window.customElements.define(
    "elm-mapbox-map",
    class MapboxMap extends window.HTMLElement {
      constructor() {
        super();
        this._refreshExpiredTiles = true;
        this._renderWorldCopies = true;
        this.interactive = true;
        this._eventRegistrationQueue = {};
        this._eventListenerMap = new Map();
      }

      get mapboxStyle() {
        return this._style;
      }
      set mapboxStyle(value) {
        if (this._map) this._map.setStyle(value);
        this._style = value;
      }

      get minZoom() {
        return this._minZoom;
      }
      set minZoom(value) {
        if (this._map) this._map.setMinZoom(value);
        this._minZoom = value;
      }

      get maxZoom() {
        return this._maxZoom;
      }
      set maxZoom(value) {
        if (this._map) this._map.setMaxZoom(value);
        this._maxZoom = value;
      }

      get map() {
        return this._map;
      }

      get maxBounds() {
        return this._maxBounds;
      }
      set maxBounds(value) {
        if (this._map) this._map.setBounds(value);
        this._maxBounds = value;
      }

      get renderWorldCopies() {
        return this._renderWorldCopies;
      }
      set renderWorldCopies(value) {
        if (this._map) this._map.setRenderWorldCopies(value);
        this._renderWorldCopies = value;
      }

      get center() {
        return this._center;
      }
      set center(value) {
        if (this._map) this._map.setCenter(value);
        this._center = value;
      }

      get zoom() {
        return this._zoom;
      }
      set zoom(value) {
        if (this._map) this._map.setZoom(value);
        this._zoom = value;
      }

      get bearing() {
        return this._bearing;
      }
      set bearing(value) {
        if (this._map) this._map.setBearing(value);
        this._bearing = value;
      }

      get pitch() {
        return this._pitch;
      }
      set pitch(value) {
        if (this._map) this._map.setPitch(value);
        this._pitch = value;
      }

      addEventListener(type, fn, ...args) {
        if (this._map) {
          var wrapped;
          if (
            [
              "mousedown",
              "mouseup",
              "mouseover",
              "mousemove",
              "click",
              "dblclick",
              "mouseout",
              "contextmenu",
              "zoom",
              "zoomstart",
              "zoomend",
              "rotate",
              "rotatestart",
              "rotateend"
            ].includes(type)
          ) {
            wrapped = e => {
              e.features = this._map.queryRenderedFeatures(
                [e.lngLat.lng, e.lngLat.lat],
                {
                  layers: this.eventFeaturesLayers,
                  filter: this.eventFeaturesFilter
                }
              );
              return fn(e);
            };
          } else if (["touchend", "touchmove", "touchcancel"].includes(type)) {
            wrapped = e => {
              e.features = this._map.queryRenderedFeatures(
                [e.lngLat.lng, e.lngLat.lat],
                {
                  layers: this.eventFeaturesLayers,
                  filter: this.eventFeaturesFilter
                }
              );
              e.perPointFeatures = e.lngLats.map(({ lng, lat }) =>
                this._map.queryRenderedFeatures([lng, lat], {
                  layers: this.eventFeaturesLayers,
                  filter: this.eventFeaturesFilter
                })
              );
              return fn(e);
            };
          } else {
            wrapped = fn;
          }
          this._eventListenerMap.set(fn, wrapped);
          return this._map.on(type, wrapped);
        } else {
          this._eventRegistrationQueue[type] =
            this._eventRegistrationQueue[type] || [];
          return this._eventRegistrationQueue[type].push(fn);
        }
      }

      removeEventListener(type, fn, ...args) {
        if (this._map) {
          const wrapped = this._eventListenerMap.get(fn);
          this._eventListenerMap.delete(fn);
          return this._map.off(type, wrapped);
        } else {
          const queue = this._eventRegistrationQueue[type] || [];
          const index = queue.findIndex(fn);
          if (index >= 0) {
            queue.splice(index, 1);
          }
          return;
        }
      }

      _createMapInstance() {
        let options = {
          container: this,
          style: this._style,
          minZoom: this._minZoom || 0,
          maxZoom: this._maxZoom || 22,
          interactive: this.interactive,
          attributionControl: false,
          logoPosition: this.logoPosition || "bottom-left",
          refreshExpiredTiles: this._refreshExpiredTiles,
          maxBounds: this._maxBounds,
          renderWorldCopies: this._renderWorldCopies
        };
        if (this._center) {
          options.center = this._center;
        }
        if (this._zoom) {
          options.zoom = this._zoom;
        }
        if (this._bearing) {
          options.bearing = this._bearing;
        }
        if (this._pitch) {
          options.pitch = this._pitch;
        }
        this._map = new mapboxgl.Map(options);

        Object.entries(this._eventRegistrationQueue).forEach(
          ([type, listeners]) => {
            listeners.forEach(listener => {
              this.addEventListener(type, listener);
            });
          }
        );
        this._eventRegistrationQueue = {};
        return this._map;
      }

      connectedCallback() {
        mapboxgl.accessToken = this.token;
        this.style.display = "block";
        this.style.width = "100%";
        this.style.height = "100%";
        this._map = this._createMapInstance();
      }

      disconnectedCallback() {
        this._map.remove();
        delete this._map;
      }
    }
  );
  return elmApp;
}

export default wrapElmApplication;