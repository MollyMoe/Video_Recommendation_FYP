const Store = require('electron-store');
const store = new Store();
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronStore', {
  get: (key) => store.get(key),
  set: (key, value) => store.set(key, value),
  delete: (key) => store.delete(key),
});
