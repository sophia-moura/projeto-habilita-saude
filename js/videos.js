window.HSVideo = (function () {
  const abrir = () => new Promise((ok, erro) => {
    const r = indexedDB.open("habilita-midias", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("arquivos");
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
  const op = (modo, fn) => abrir().then((db) => new Promise((ok, erro) => {
    const t = db.transaction("arquivos", modo), req = fn(t.objectStore("arquivos"));
    t.oncomplete = () => ok(req.result);
    t.onerror = () => erro(t.error);
  }));
  return {
    salvar: (arquivo) => { const id = "m" + Date.now() + Math.floor(Math.random() * 999); return op("readwrite", (s) => s.put(arquivo, id)).then(() => id); },
    obter: (id) => op("readonly", (s) => s.get(id)),
    remover: (id) => op("readwrite", (s) => s.delete(id)),
  };
})();
