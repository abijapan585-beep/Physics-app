const auth = firebase.auth();
const db = firebase.firestore();

const screens = {
  loading: document.getElementById('loading-screen'),
  login: document.getElementById('login-screen'),
  list: document.getElementById('list-screen'),
  player: document.getElementById('player-screen'),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
}

function studentIdToEmail(id) {
  return id.trim().toLowerCase() + '@physicsapp.local';
}

auth.onAuthStateChanged((user) => {
  if (user) {
    showScreen('list');
    loadVideos();
  } else {
    showScreen('login');
  }
});

document.getElementById('login-btn').addEventListener('click', async () => {
  const studentId = document.getElementById('student-id').value;
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  errorEl.textContent = '';

  if (!studentId.trim() || !password) {
    errorEl.textContent = 'Student ID and password both podunga.';
    return;
  }

  const btn = document.getElementById('login-btn');
  btn.textContent = 'Logging in...';
  btn.disabled = true;

  try {
    await auth.signInWithEmailAndPassword(studentIdToEmail(studentId), password);
  } catch (err) {
    errorEl.textContent = 'Student ID or password wrong. Sir kitta contact pannunga.';
  } finally {
    btn.textContent = 'Login';
    btn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut();
});

async function loadVideos() {
  const listEl = document.getElementById('video-list');
  listEl.innerHTML = '<div class="empty-state">Loading...</div>';

  try {
    const snapshot = await db.collection('videos').orderBy('order', 'asc').get();

    if (snapshot.empty) {
      listEl.innerHTML = '<div class="empty-state">Innum videos add pannala. Sir soon poduvaanga.</div>';
      return;
    }

    listEl.innerHTML = '';
    snapshot.forEach((doc) => {
      const data = doc.data();
      const thumbnail = data.thumbnail || `https://img.youtube.com/vi/${data.youtubeId}/hqdefault.jpg`;

      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <img src="${thumbnail}" alt="${escapeHtml(data.title)}" loading="lazy" />
        <div class="card-title">${escapeHtml(data.title)}</div>
      `;
      card.addEventListener('click', () => openPlayer(data.youtubeId, data.title));
      listEl.appendChild(card);
    });
  } catch (err) {
    listEl.innerHTML = '<div class="empty-state">Videos load aagala. Internet check pannunga.</div>';
    console.error(err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openPlayer(youtubeId, title) {
  document.getElementById('player-title').textContent = title;
  document.getElementById('video-wrap').innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1&playsinline=1"
      allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen>
    </iframe>
  `;
  showScreen('player');
}

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('video-wrap').innerHTML = '';
  showScreen('list');
});
