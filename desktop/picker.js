document.querySelector('#cancel').onclick = () => window.capture.cancel();
window.capture.list().then(sources => {
  document.querySelector('#status').textContent = sources.length ? 'Clique na imagem para iniciar o compartilhamento.' : 'Nenhuma tela disponível.';
  for (const source of sources) {
    const button = document.createElement('button');
    const image = document.createElement('img'); image.src = source.thumbnail; image.alt = '';
    const name = document.createElement('span'); name.className = 'name'; name.textContent = source.name;
    button.append(image, name);
    button.onclick = () => window.capture.choose({ id: source.id, audio: document.querySelector('#audio').checked });
    document.querySelector('#sources').append(button);
  }
}).catch(() => { document.querySelector('#status').textContent = 'Não foi possível listar as telas. Cancele e tente novamente.'; });
