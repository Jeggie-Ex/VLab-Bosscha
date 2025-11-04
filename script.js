const firebaseConfig = {
  apiKey: "AIzaSyB0ae3Oc3YAFiCxW5Fkgj30aG63lcTPz3g", 
  authDomain: "vlab-bosscha.firebaseapp.com", 
  projectId: "vlab-bosscha", 
  storageBucket: "vlab-bosscha.firebasestorage.app", 
  messagingSenderId: "850017371811", 
  appId: "1:850017371811:web:d7a6a524f9d6fb6bd9a116"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

if (localStorage.getItem('theme') === 'dark' || 
   (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// --- LOGIKA NAVIGASI TAB ---
let navLinks;
let pageSections;
let isTimelineInitialized = false;
let isInstrumentsInitialized = false; 

function switchPage(targetId) {
    // Sembunyikan semua halaman
    pageSections.forEach(section => {
        section.classList.add('hidden');
    });

    // Hapus 'active' dari semua link navigasi
    navLinks.forEach(link => {
        // Hapus style aktif (teks biru, bold)
        link.classList.remove('text-blue-600', 'dark:text-blue-400', 'font-bold');
        // Tambahkan style non-aktif (teks abu-abu, hover biru)
        link.classList.add('text-gray-700', 'dark:text-gray-300', 'hover:text-blue-500', 'dark:hover:text-blue-400');
    });

    // Panggil initTimeline jika pindah ke #hero dan belum diinisialisasi
    if (targetId === '#hero' && !isTimelineInitialized) {
        initTimeline();
    }

    // Panggil loadInstrumentsData jika pindah ke #instruments dan belum diinisialisasi
    if (targetId === '#instruments' && !isInstrumentsInitialized) {
        loadInstrumentsData();
        isInstrumentsInitialized = true; // Set penanda agar tidak di-load lagi
    }

    // Tampilkan halaman target
    const targetSection = document.querySelector(targetId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Tambahkan 'active' ke link yang diklik
    const activeLink = document.querySelector(`nav div.items-center a.nav-link[href="${targetId}"]`);
    if (activeLink) {
        // Tambahkan style aktif (teks biru, bold)
        activeLink.classList.add('text-blue-600', 'dark:text-blue-400', 'font-bold');
        // Hapus style non-aktif (teks abu-abu, hover biru)
        activeLink.classList.remove('text-gray-700', 'dark:text-gray-300', 'hover:text-blue-500', 'dark:hover:text-blue-400');
    }
}

function initPageSwitching() {
    navLinks = document.querySelectorAll('nav div.items-center a.nav-link');
    pageSections = document.querySelectorAll('.page-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            switchPage(targetId);
        });
    });

    // Tampilkan halaman default (#hero) saat memuat
    // dan inisialisasi timelinenya
    switchPage('#hero');
}

// --- LOGIKA TIMELINE ---

let planetsData = [];
let currentPlanetIndex = 0;
let timelineYear, timelineDesc, solarSystemRotator, prevButton, nextButton;

// Mengambil data dari Firestore
async function loadTimelineData() {
    try {
        // 1. Ambil data dari koleksi 'timelineEvents'
        const querySnapshot = await db.collection("timelineEvents").get();

        // 2. Masukkan data ke array 'planetsData'
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // JANGAN ambil angle dari database lagi
            // HAPUS: data.angle = parseFloat(data.angle); 
            planetsData.push(data);
        });

        // 3. Urutkan berdasarkan TAHUN (string -> number)
        planetsData.sort((a, b) => parseFloat(a.year) - parseFloat(b.year));

        planetsData.forEach((planet, i) => {
            planet.angle = i * 45; // 0, 45, 90, 135, dst.
        });

        // Atur Posisi Awal setiap planet container
        const allPlanetContainers = document.querySelectorAll('.planet-container');
        allPlanetContainers.forEach((container, i) => {
            // Pastikan ada data untuk planet ini
            if (planetsData[i] && planetsData[i].angle !== undefined) {
                const angle = planetsData[i].angle; // Ini sekarang dari JS
                // Terapkan rotasi INDIVIDUAL ke setiap planet container
                container.style.transform = `rotate(${angle}deg)`;
            }
        });

        // 4. Setelah data siap, tampilkan data pertama
        updateTimeline(0);

        // 5. Aktifkan tombol (sebelumnya nonaktif)
        prevButton.disabled = true; // Awalnya nonaktif
        nextButton.disabled = false;
        console.log("Data linimasa berhasil dimuat dari Firestore.");

    } catch (error) {
        console.error("Gagal memuat data linimasa: ", error);
        timelineDesc.textContent = "Gagal memuat data linimasa. Periksa koneksi internet dan konfigurasi Firebase.";
    }
}

function initTimeline() {
    if (isTimelineInitialized) return; // Jangan inisialisasi dua kali

    // Seleksi elemen DOM
    timelineYear = document.getElementById('timeline-display-year');
    timelineDesc = document.getElementById('timeline-display-desc');
    solarSystemRotator = document.getElementById('solar-system-rotator');
    prevButton = document.getElementById('prev-btn');
    nextButton = document.getElementById('next-btn');

    // Cek apakah elemen ada
    if (!timelineYear || !prevButton) {
        console.log("Elemen timeline tidak ditemukan. Mungkin di tab lain.");
        return;
    }

    // Nonaktifkan tombol SEMENTARA data dimuat
    prevButton.disabled = true;
    nextButton.disabled = true;
    timelineDesc.textContent = "Memuat data linimasa dari database...";

    // Panggil fungsi baru kita untuk memuat data
    loadTimelineData();

    // Listener tombol (ini tetap sama)
    prevButton.addEventListener('click', () => {
        if (currentPlanetIndex > 0) {
            updateTimeline(currentPlanetIndex - 1);
        }
    });

    nextButton.addEventListener('click', () => {
        if (currentPlanetIndex < planetsData.length - 1) {
            updateTimeline(currentPlanetIndex + 1);
        }
    });

    isTimelineInitialized = true;
}

function updateTimeline(index) {
    // Pastikan data sudah dimuat dan elemen ada
    if (planetsData.length === 0 || !timelineYear) return; 

    currentPlanetIndex = index;

    // Ambil data dari array 'planetsData' (bukan dari 'data-' atribut HTML)
    const planet = planetsData[currentPlanetIndex];

    // Update tampilan
    timelineYear.textContent = planet.year;
    timelineDesc.textContent = planet.desc;
    // Rotasi seluruh tata surya
    solarSystemRotator.style.transform = `rotate(${-parseFloat(planet.angle)}deg)`;

    // Update status tombol (logika ini tetap sama)
    prevButton.disabled = (currentPlanetIndex === 0);
    nextButton.disabled = (currentPlanetIndex === planetsData.length - 1);

    // Update kelas 'active' pada planet
    const allPlanets = document.querySelectorAll('.planet');
    allPlanets.forEach((p, i) => {
        p.classList.toggle('active', i === currentPlanetIndex);
    });
}

// Mengambil Data dari Firebase
async function loadInstrumentsData() {
    const container = document.getElementById('instruments');
    if (!container) return; // Pengaman jika elemen tidak ditemukan

    try {
        // Tampilkan pesan loading
        container.innerHTML = `<p class="text-white text-center col-span-3">Memuat data instrumen dari database...</p>`;

        // 1. Ambil data dari koleksi 'instruments'
        const querySnapshot = await db.collection("instruments").get();

        let html = ""; // Variabel untuk membangun string HTML

        // 2. Looping setiap dokumen instrumen
        querySnapshot.forEach((doc) => {
            const data = doc.data(); // data = { name, description, image, specs }

            // 3. Buat HTML untuk daftar spesifikasi (specs)

            const specsHtml = (data.specs || []).map(spec => 
                `<li class="ml-4">${spec}</li>`
            ).join(''); // Gabungkan semua <li> jadi satu string
            
            // Baca 'objPosition' dari database. 
            // Jika tidak ada, gunakan 'center 30%' (default).
            const objectPosition = data.objPosition || "center 30%";

            // 4. Buat HTML untuk satu kartu (card)
            html += `
                <figure class="instrument-card bg-gray-800/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-blue-500/50 flex flex-col">
                    <img src="${data.image}" 
                         alt="${data.name}" 
                         class="w-full h-48 object-cover" 
                         style="object-position: ${objectPosition};"
                         onerror="this.src='https://placehold.co/600x400/111827/7f8c8d?text=Gambar+Error'; this.style='object-position: center center;'">
                    
                    <figcaption class="p-6 flex-grow flex flex-col">
                        <h3 class="text-xl font-bold text-white mb-2">${data.name}</h3>
                        <p class="text-sm text-gray-300 mb-4 flex-grow">${data.description}</p>
                        
                        <h4 class="text-md font-semibold text-white mb-2">Spesifikasi:</h4>
                        <ul class="list-disc text-sm text-gray-300 space-y-1">
                            ${specsHtml}
                        </ul>
                    </figcaption>
                </figure>
            `;
        });

        // 5. Masukkan semua HTML kartu ke dalam kontainer
        container.innerHTML = html;
        console.log("Data instrumen berhasil dimuat dari Firestore.");

    } catch (error) {
        console.error("Gagal memuat data instrumen: ", error);
        container.innerHTML = `<p class="text-red-500 text-center col-span-3">Gagal memuat data instrumen. Periksa koneksi internet dan konfigurasi Firebase.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPageSwitching();
});

