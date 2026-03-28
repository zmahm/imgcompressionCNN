import '@testing-library/jest-dom';

// Mock canvas API (jsdom doesn't implement it)
HTMLCanvasElement.prototype.getContext = () => ({
  createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
  putImageData: () => {},
  drawImage: () => {},
  fillRect: () => {},
  clearRect: () => {},
});

// Mock URL.createObjectURL
global.URL.createObjectURL = (blob) => `blob:mock-url-${Math.random()}`;
global.URL.revokeObjectURL = () => {};

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.({ target: this });
    }, 0);
  }
  send() {}
  close() { this.readyState = 3; this.onclose?.({ target: this }); }
}
global.WebSocket = MockWebSocket;

// Mock FileReader
global.FileReader = class {
  readAsArrayBuffer(blob) {
    setTimeout(() => {
      this.onload?.({ target: { result: new ArrayBuffer(0) } });
    }, 0);
  }
};
