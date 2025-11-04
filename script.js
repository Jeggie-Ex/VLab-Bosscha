    // --- Fitur Dark Mode (Otomatis) ---
    // Kita tidak perlu DOMContentLoaded karena 'defer' di tag <script> sudah menanganinya
    if (localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }

    // --- Variabel Global untuk Navigasi & Scroll ---
    const bodyEl = document.body;
    const navLinks = document.querySelectorAll('nav a.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    let activePageId = '#hero'; // Halaman default

    // --- Fitur Navigasi Tab (Show/Hide) ---

    // Fungsi untuk mengganti halaman
    function switchPage(targetId) {
        // Sembunyikan semua halaman
        pageSections.forEach(section => {
            section.classList.add('hidden');
        });

        // Tampilkan halaman yang ditarget
        const targetPage = document.querySelector(targetId);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            activePageId = targetId; // Update halaman aktif
        }

        // Update highlight link navigasi
        navLinks.forEach(link => {
            const linkTargetId = link.getAttribute('data-target-id');
            if (linkTargetId === targetId.substring(1)) { // Hapus # dari targetId
                link.classList.add('text-blue-500', 'dark:text-blue-400', 'font-bold');
                link.classList.remove('text-gray-700', 'dark:text-gray-300');
            } else {
                link.classList.remove('text-blue-500', 'dark:text-blue-400', 'font-bold');
                link.classList.add('text-gray-700', 'dark:text-gray-300');
            }
        });
        
        // Kode 'noscroll' sudah dihapus karena tidak relevan lagi
    }

    // Tambahkan event listener ke setiap link navigasi
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault(); // Mencegah perpindahan hash # standar
            const targetId = this.getAttribute('href');
            switchPage(targetId);
            
            // Jika targetnya #hero, scroll ke atas (penting untuk mobile)
            if (targetId === '#hero') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });


    // --- Fitur Linimasa Tata Surya (Tombol Klik) ---

    // Hapus semua variabel yang berhubungan dengan scroll
    const solarSystemRotator = document.querySelector('#solar-system-rotator'); 
    const timelineDisplayYear = document.getElementById('timeline-display-year');
    const timelineDisplayDesc = document.getElementById('timeline-display-desc');
    
    // Variabel Tombol BARU
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Ambil semua planet container, ubah NodeList jadi Array agar mudah dipakai
    const planets = Array.from(document.querySelectorAll('.planet-container'));

    let currentPlanetIndex = 0;
    // Hapus isThrottled dan throttleDuration

    // Fungsi untuk meng-update tampilan berdasarkan planet yang aktif
    function updateTimeline(index) {
        // Pastikan index berada dalam rentang yang valid
        if (index < 0) index = 0;
        if (index >= planets.length) index = planets.length - 1;
        
        currentPlanetIndex = index;
        
        const activePlanetContainer = planets[currentPlanetIndex];
        if (!activePlanetContainer) return; // Penjagaan jika planet tidak ditemukan

        const year = activePlanetContainer.dataset.year;
        const desc = activePlanetContainer.dataset.desc;
        // Sudut planet ini (yang akan kita putar ke 0 derajat)
        const angle = parseFloat(activePlanetContainer.dataset.angle || 0);

        // 1. Update panel info di kanan
        if(timelineDisplayYear) timelineDisplayYear.textContent = year;
        if(timelineDisplayDesc) timelineDisplayDesc.textContent = desc;

        // 2. Update highlight planet
        planets.forEach((pc, i) => {
            const planetEl = pc.querySelector('.planet');
            if (planetEl) { // Penjagaan
                if (i === currentPlanetIndex) {
                    planetEl.classList.add('active');
                } else {
                    planetEl.classList.remove('active');
                }
            }
        });

        // 3. Putar seluruh tata surya
        if(solarSystemRotator) {
            solarSystemRotator.style.transform = `rotate(${-angle}deg)`;
        }

        // 4. Update status tombol (BARU)
        if(prevBtn) prevBtn.disabled = (currentPlanetIndex === 0);
        if(nextBtn) nextBtn.disabled = (currentPlanetIndex === planets.length - 1);
    }

    // Posisikan planet-planet di orbitnya saat halaman dimuat
    function initializePlanets() {
        planets.forEach(pc => {
            const angle = parseFloat(pc.dataset.angle || 0);
            // Atur rotasi di parent-nya (orbit)
            if (pc.parentElement) { // Penjagaan
                pc.parentElement.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
            }
        });
    }

    // Hapus SEMUA event listener 'wheel', 'mouseenter', 'mouseleave'

    // --- Event Listener untuk Tombol Navigasi Timeline (BARU) ---
    if(prevBtn) {
        prevBtn.addEventListener('click', () => {
            updateTimeline(currentPlanetIndex - 1);
        });
    }

    if(nextBtn) {
        nextBtn.addEventListener('click', () => {
            updateTimeline(currentPlanetIndex + 1);
        });
    }


    // --- Inisialisasi Halaman ---
    // Kode ini sekarang berjalan setelah DOM siap (karena 'defer')

    // 1. Tampilkan tab default
    switchPage(activePageId);

    // 2. Atur posisi awal planet-planet
    initializePlanets();

    // 3. Tampilkan info pertama (1923) dan atur status tombol
    updateTimeline(0);

