/**
 * Custom Error types for Map Engine.
 */

export class MapEngineError extends Error {
  constructor(message: string, public readonly code: string = 'MAP_ENGINE_ERROR') {
    super(message);
    this.name = 'MapEngineError';
  }
}

export class StyleLoadError extends MapEngineError {
  constructor(message: string, public readonly styleUrlOrId: string) {
    super(message, 'STYLE_LOAD_ERROR');
    this.name = 'StyleLoadError';
  }
}

export class TileLoadError extends MapEngineError {
  constructor(message: string, public readonly tileUrl?: string) {
    super(message, 'TILE_LOAD_ERROR');
    this.name = 'TileLoadError';
  }
}

export class WebGLNotSupportedError extends MapEngineError {
  constructor(message: string = 'WebGL is not supported in this environment.') {
    super(message, 'WEBGL_NOT_SUPPORTED');
    this.name = 'WebGLNotSupportedError';
  }
}
