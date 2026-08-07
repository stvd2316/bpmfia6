<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import LocalImagePreview from '$lib/components/LocalImagePreview.svelte';
	import ImageSwiper from '$lib/components/ImageSwiper.svelte';
	import TextWithLinks from '$lib/components/TextWithLinks.svelte';
	import MovingBorder from '$lib/components/MovingBorder.svelte';

	// ================= STATE (port 1:1 dari useState page.tsx) =================

	// Navigasi
	let menuOpen = $state(false);
	let scrolled = $state(false);
	let showAllPeraturan = $state(false);
	let selectedPeraturan = $state<any>(null);
	let showAllBerita = $state(false);
	let selectedBerita = $state<any>(null);
	let showAboutUs = $state(false);
	let showStatusIkm = $state(false);
	let searchIkm = $state('');

	// IKM
	let ikmData = $state<any[]>([]);
	let loadingIkm = $state(false);
	let errorIkm = $state<string | null>(null);
	let editingIkmId = $state<any>(null);
	let editingNilai = $state('');
	let updatingIkm = $state(false);

	// Admin
	let isAdmin = $state(false);
	let showLogin = $state(false);
	let username = $state('');
	let password = $state('');
	let loginError = $state('');

	// Form Peraturan
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let formData = $state({
		judul: '',
		jenisDokumen: '',
		tahun: '',
		tglPenetapan: '',
		tempatPenetapan: 'Depok',
		tglBerlaku: '',
		status: 'Berlaku',
		perubahan: { tipe: '', teks: '' }
	});
	let pdfFile = $state<File | null>(null);
	let existingPdfUrl = $state<string | null>(null);
	let isDragging = $state(false);
	let uploadingPdf = $state(false);
	let formError = $state('');

	// Filter
	let searchJudul = $state('');
	let filterJenis = $state('');
	let filterTahun = $state('');
	let filterStatus = $state('');

	const jenisDokumenList = [
		'KETETAPAN MUSMA',
		'KETETAPAN FORMA',
		'UNDANG-UNDANG',
		'KETETAPAN BPM',
		'PERATURAN BPM',
		'KEPUTUSAN BPM'
	];
	const statusList = ['Berlaku', 'Dicabut', 'Diubah'];
	const tahunList = Array.from({ length: 21 }, (_, i) => (2010 + i).toString());
	const hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
	const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

	// Calendar & Acara
	let currentDate = $state<Date | null>(null);
	let today = $state<Date | null>(null);
	let selectedCalendarDate = $state<Date | null>(null);
	let acaraData = $state<any[]>([]);
	let showAcaraForm = $state(false);
	let editingAcaraId = $state<string | null>(null);
	let acaraFormData = $state({
		date: '',
		acaraName: '',
		acaraNews: '',
		ltkPenyelenggara: '',
		tempat: '',
		waktuMulai: '',
		waktuSelesai: '',
		penanggungjawab: ''
	});
	let acaraFiles = $state<File[]>([]);
	let existingAcaraFiles = $state<string[]>([]);
	let uploadingAcara = $state(false);
	let acaraFormError = $state('');

	// Form Berita
	let showBeritaForm = $state(false);
	let editingBeritaId = $state<string | null>(null);
	let beritaFormData = $state({ judul: '', isi: '', tgl_terbit: '' });
	let beritaFiles = $state<File[]>([]);
	let existingBeritaFiles = $state<string[]>([]);
	let uploadingBerita = $state(false);
	let beritaFormError = $state('');

	// Data & Paginasi
	let homePeraturan = $state<any[]>([]);
	let homeBerita = $state<any[]>([]);
	let stats = $state({ total: 0, berlaku: 0, dicabut: 0 });
	let cachedPages = $state<Record<number, any[]>>({});
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalItems = $state(0);
	let loadingPeraturan = $state(false);
	const itemsPerPage = 20;
	let cachedBeritaPages = $state<Record<number, any[]>>({});
	let currentBeritaPage = $state(1);
	let totalBeritaPages = $state(1);
	let totalBeritaItems = $state(0);
	let loadingBerita = $state(false);
	let viewingPdfUrl = $state<string | null>(null);

	// ================= DERIVED =================

	let currentData = $derived(cachedPages[currentPage] ?? []);
	let currentBeritaData = $derived(cachedBeritaPages[currentBeritaPage] ?? []);
	let selectedDateAcara = $derived(
		selectedCalendarDate
			? acaraData.filter((ev) => ev.dateKey === formatDateKey(selectedCalendarDate!))
			: []
	);
	let mulaiH = $derived(acaraFormData.waktuMulai ? acaraFormData.waktuMulai.split(':')[0] : '');
	let mulaiM = $derived(acaraFormData.waktuMulai ? acaraFormData.waktuMulai.split(':')[1] : '');
	let isSelesaiChecked = $derived(acaraFormData.waktuSelesai === 'SELESAI');
	let selesaiH = $derived(
		!isSelesaiChecked && acaraFormData.waktuSelesai ? acaraFormData.waktuSelesai.split(':')[0] : ''
	);
	let selesaiM = $derived(
		!isSelesaiChecked && acaraFormData.waktuSelesai ? acaraFormData.waktuSelesai.split(':')[1] : ''
	);

	// ================= HELPERS EVENT (padanan React onChange/onClick) =================

	const val = (e: Event): string =>
		(e.currentTarget as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
	const checkedVal = (e: Event): boolean => (e.currentTarget as HTMLInputElement).checked;

	// ================= ON MOUNT =================

	onMount(() => {
		const now = new Date();
		currentDate = now;
		today = now;

		const handleScroll = () => {
			scrolled = window.scrollY > 50;
		};
		window.addEventListener('scroll', handleScroll, { passive: true });

		fetchHomeData();

		const fetchAcara = async () => {
			const { data } = await supabase.from('iss_events').select('*');
			if (data)
				acaraData = data.map((e: any) => ({
					id: e.id,
					dateKey: e.date_key,
					title: e.title,
					description: e.description,
					ltkPenyelenggara: e.ltk_penyelenggara || '-',
					tempat: e.tempat || '-',
					waktuMulai: e.waktu_mulai || '',
					waktuSelesai: e.waktu_selesai || '',
					penanggungjawab: e.penanggungjawab || '-',
					file_urls: e.file_urls || []
				}));
		};
		fetchAcara();

		const channel = supabase
			.channel('custom-all-channel')
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'status_ikm_fia_ui' },
				(payload) => {
					const u = payload.new as any;
					ikmData = ikmData.map((i) =>
						i.id === u.No ? { ...i, nilai: u.Nilai, status: u.Status } : i
					);
				}
			)
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'iss_events' },
				(payload) => {
					const n = payload.new as any;
					acaraData = acaraData.some((e) => e.id === n.id)
						? acaraData
						: [
								...acaraData,
								{
									id: n.id,
									dateKey: n.date_key,
									title: n.title,
									description: n.description,
									ltkPenyelenggara: n.ltk_penyelenggara || '-',
									tempat: n.tempat || '-',
									waktuMulai: n.waktu_mulai || '',
									waktuSelesai: n.waktu_selesai || '',
									penanggungjawab: n.penanggungjawab || '-',
									file_urls: n.file_urls || []
								}
							];
				}
			)
			.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'iss_events' }, (payload) => {
				acaraData = acaraData.filter((e) => e.id !== (payload.old as any).id);
			})
			.subscribe();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			supabase.removeChannel(channel);
		};
	});

	// ================= DATA FETCH =================

	const fetchHomeData = async () => {
		const { count: total } = await supabase.from('peraturan').select('*', { count: 'exact', head: true });
		const { count: berlaku } = await supabase
			.from('peraturan')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'Berlaku');
		const { count: dicabut } = await supabase
			.from('peraturan')
			.select('*', { count: 'exact', head: true })
			.eq('status', 'Dicabut');
		stats = { total: total || 0, berlaku: berlaku || 0, dicabut: dicabut || 0 };

		const { data: pData } = await supabase
			.from('peraturan')
			.select('*')
			.order('tgl_penetapan', { ascending: false })
			.limit(5);
		if (pData) homePeraturan = pData;

		const { data: bData } = await supabase
			.from('berita')
			.select('*')
			.order('tgl_terbit', { ascending: false })
			.limit(5);
		if (bData) homeBerita = bData;
	};

	const fetchPage = async (pageNum: number, forceFetch = false) => {
		if (!forceFetch && cachedPages[pageNum]) {
			currentPage = pageNum;
			return;
		}
		loadingPeraturan = true;
		let query: any = supabase
			.from('peraturan')
			.select('*', { count: 'exact' })
			.order('tgl_penetapan', { ascending: false });
		if (searchJudul) query = query.ilike('judul', `%${searchJudul}%`);
		if (filterJenis) query = query.eq('jenis_dokumen', filterJenis);
		if (filterTahun) query = query.eq('tahun', filterTahun);
		if (filterStatus) query = query.eq('status', filterStatus);
		const from = (pageNum - 1) * itemsPerPage;
		const to = from + itemsPerPage - 1;
		const { data, error, count } = await query.range(from, to);
		if (error) {
			console.error(error);
		} else if (data) {
			cachedPages = { ...cachedPages, [pageNum]: data };
			totalItems = count || 0;
			totalPages = Math.ceil((count || 0) / itemsPerPage);
			currentPage = pageNum;
		}
		loadingPeraturan = false;
	};

	// useEffect [showAllPeraturan] + [searchJudul, filterJenis, filterTahun, filterStatus]
	$effect(() => {
		if (showAllPeraturan) {
			cachedPages = {};
			fetchPage(1, true);
		}
	});

	const handlePageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalPages) {
			fetchPage(newPage);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	const fetchBeritaPage = async (pageNum: number, forceFetch = false) => {
		if (!forceFetch && cachedBeritaPages[pageNum]) {
			currentBeritaPage = pageNum;
			return;
		}
		loadingBerita = true;
		const from = (pageNum - 1) * itemsPerPage;
		const to = from + itemsPerPage - 1;
		const { data, error, count } = await supabase
			.from('berita')
			.select('*', { count: 'exact' })
			.order('tgl_terbit', { ascending: false })
			.range(from, to);
		if (error) {
			console.error(error);
		} else if (data) {
			cachedBeritaPages = { ...cachedBeritaPages, [pageNum]: data };
			totalBeritaItems = count || 0;
			totalBeritaPages = Math.ceil((count || 0) / itemsPerPage);
			currentBeritaPage = pageNum;
		}
		loadingBerita = false;
	};

	$effect(() => {
		if (showAllBerita) {
			cachedBeritaPages = {};
			fetchBeritaPage(1, true);
		}
	});

	const handleBeritaPageChange = (newPage: number) => {
		if (newPage >= 1 && newPage <= totalBeritaPages) {
			fetchBeritaPage(newPage);
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	};

	// Debounce pencarian IKM (useEffect [searchIkm])
	$effect(() => {
		const searchTerm = searchIkm.trim();
		if (searchTerm === '') {
			ikmData = [];
			loadingIkm = false;
			errorIkm = null;
			return;
		}
		loadingIkm = true;
		errorIkm = null;
		const delayDebounceFn = setTimeout(async () => {
			const { data, error } = await supabase
				.from('status_ikm_fia_ui')
				.select('*')
				.ilike('Nama Lengkap', `%${searchTerm}%`);
			if (error) {
				errorIkm = error.message;
				ikmData = [];
			} else if (data) {
				ikmData = data.map((item: any) => ({
					id: item.No || item.id,
					nama: item['Nama Lengkap'] || '-',
					jurusan: item.Jurusan || '-',
					nilai: item.Nilai || '0',
					status: item.Status || '-'
				}));
			}
			loadingIkm = false;
		}, 300);
		return () => clearTimeout(delayDebounceFn);
	});

	// ================= IKM =================

	const handleEditIkm = (item: any) => {
		editingIkmId = item.id;
		editingNilai = item.nilai.toString();
	};
	const handleCancelEditIkm = () => {
		editingIkmId = null;
		editingNilai = '';
	};
	const handleSaveIkm = async (item: any) => {
		const newNilai = parseFloat(editingNilai);
		if (isNaN(newNilai)) {
			alert('Nilai harus berupa angka!');
			return;
		}
		const newStatus = newNilai >= 85 ? 'AKTIF' : 'PASIF';
		updatingIkm = true;
		const { error } = await supabase
			.from('status_ikm_fia_ui')
			.update({ Nilai: newNilai, Status: newStatus })
			.eq('No', item.id);
		if (error) alert('Gagal: ' + error.message);
		else {
			ikmData = ikmData.map((d) => (d.id === item.id ? { ...d, nilai: newNilai, status: newStatus } : d));
			editingIkmId = null;
			editingNilai = '';
		}
		updatingIkm = false;
	};

	// ================= NAVIGASI =================

	const goToAllPeraturan = () => {
		showAllPeraturan = true;
		showAboutUs = false;
		showStatusIkm = false;
		selectedPeraturan = null;
		showAllBerita = false;
		selectedBerita = null;
		window.scrollTo(0, 0);
		window.history.pushState({ page: 'all_peraturan' }, '', '#peraturan');
	};
	const goToAllBerita = () => {
		showAllBerita = true;
		showAboutUs = false;
		showStatusIkm = false;
		selectedBerita = null;
		showAllPeraturan = false;
		selectedPeraturan = null;
		window.scrollTo(0, 0);
		window.history.pushState({ page: 'all_berita' }, '', '#berita-all');
	};
	const goToHome = () => {
		showAllPeraturan = false;
		showAboutUs = false;
		showStatusIkm = false;
		selectedPeraturan = null;
		viewingPdfUrl = null;
		showAllBerita = false;
		selectedBerita = null;
		window.scrollTo(0, 0);
		if (window.location.hash && window.location.hash !== '#home')
			window.history.pushState({ page: 'home' }, '', '#home');
	};
	const goToAboutUs = () => {
		const cs = window.scrollY;
		window.history.replaceState(
			{ page: showAllPeraturan ? 'all_peraturan' : 'home', scroll: cs },
			'',
			window.location.href
		);
		showAboutUs = true;
		showAllPeraturan = false;
		showStatusIkm = false;
		selectedPeraturan = null;
		showAllBerita = false;
		selectedBerita = null;
		window.scrollTo(0, 0);
		window.history.pushState({ page: 'about' }, '', '#about');
	};
	const goToStatusIkm = () => {
		const cs = window.scrollY;
		window.history.replaceState(
			{ page: showAllPeraturan ? 'all_peraturan' : 'home', scroll: cs },
			'',
			window.location.href
		);
		showStatusIkm = true;
		showAboutUs = false;
		showAllPeraturan = false;
		selectedPeraturan = null;
		showAllBerita = false;
		selectedBerita = null;
		window.scrollTo(0, 0);
		window.history.pushState({ page: 'status_ikm' }, '', '#status-ikm');
	};
	const goToBerita = () => {
		showAllPeraturan = false;
		showAboutUs = false;
		showStatusIkm = false;
		selectedPeraturan = null;
		showAllBerita = false;
		selectedBerita = null;
		menuOpen = false;
		setTimeout(() => {
			const s = document.getElementById('berita');
			if (s) s.scrollIntoView({ behavior: 'smooth' });
		}, 100);
	};
	const goToKontak = () => {
		showAllPeraturan = false;
		showAboutUs = false;
		showStatusIkm = false;
		selectedPeraturan = null;
		showAllBerita = false;
		selectedBerita = null;
		menuOpen = false;
		setTimeout(() => {
			const s = document.getElementById('kontak');
			if (s) s.scrollIntoView({ behavior: 'smooth' });
		}, 100);
	};
	const viewDetail = (item: any) => {
		const cs = window.scrollY;
		window.history.replaceState(
			{ page: selectedPeraturan ? 'detail' : showAllPeraturan ? 'all_peraturan' : 'home', scroll: cs },
			'',
			window.location.href
		);
		selectedPeraturan = item;
		viewingPdfUrl = null;
		window.scrollTo(0, 0);
		window.history.pushState({ page: 'detail', id: item.id }, '', `#peraturan/${item.id}`);
	};
	const viewBeritaDetail = (item: any) => {
		const cs = window.scrollY;
		window.history.replaceState(
			{ page: selectedBerita ? 'berita_detail' : showAllBerita ? 'all_berita' : 'home', scroll: cs },
			'',
			window.location.href
		);
		selectedBerita = item;
		window.scrollTo(0, 0);
		window.history.pushState({ page: 'berita_detail', id: item.id }, '', `#berita/${item.id}`);
	};
	const goBack = () => {
		window.history.back();
	};

	// useEffect [homeBerita, cachedBeritaPages] — handler popstate
	$effect(() => {
		const handlePopState = (e: PopStateEvent) => {
			const state = e.state;
			if (!state) return;
			if (state.page === 'all_peraturan') {
				selectedPeraturan = null;
				showAllPeraturan = true;
				showAboutUs = false;
				showStatusIkm = false;
				showAllBerita = false;
				selectedBerita = null;
			} else if (state.page === 'all_berita') {
				selectedBerita = null;
				showAllBerita = true;
				showAboutUs = false;
				showStatusIkm = false;
				showAllPeraturan = false;
				selectedPeraturan = null;
			} else if (state.page === 'berita_detail' && state.id) {
				const item = [...homeBerita, ...Object.values(cachedBeritaPages).flat()].find(
					(b) => b.id === state.id
				);
				if (item) {
					selectedBerita = item;
					showAllBerita = false;
					showAllPeraturan = false;
					showAboutUs = false;
					showStatusIkm = false;
					selectedPeraturan = null;
				}
			} else if (state.page === 'about') {
				showAboutUs = true;
				showAllPeraturan = false;
				showStatusIkm = false;
				selectedPeraturan = null;
				showAllBerita = false;
				selectedBerita = null;
			} else if (state.page === 'status_ikm') {
				showStatusIkm = true;
				showAboutUs = false;
				showAllPeraturan = false;
				selectedPeraturan = null;
				showAllBerita = false;
				selectedBerita = null;
			} else {
				showAllPeraturan = false;
				showAboutUs = false;
				showStatusIkm = false;
				selectedPeraturan = null;
				showAllBerita = false;
				selectedBerita = null;
			}
			if (state && typeof state.scroll === 'number')
				setTimeout(() => window.scrollTo(0, state.scroll), 10);
		};
		window.addEventListener('popstate', handlePopState);
		return () => window.removeEventListener('popstate', handlePopState);
	});

	// ================= UTIL =================

	const formatTanggal = (dateString: string) => {
		const months = [
			'JANUARI',
			'FEBRUARI',
			'MARET',
			'APRIL',
			'MEI',
			'JUNI',
			'JULI',
			'AGUSTUS',
			'SEPTEMBER',
			'OKTOBER',
			'NOVEMBER',
			'DESEMBER'
		];
		if (!dateString) return '-';
		const parts = dateString.split('-');
		let day, monthIndex, year;
		if (parts[0].length === 4) {
			year = parts[0];
			monthIndex = parseInt(parts[1], 10) - 1;
			day = parts[2];
		} else {
			day = parts[0];
			monthIndex = parseInt(parts[1], 10) - 1;
			year = parts[2];
		}
		return `${day} ${months[monthIndex]} ${year}`;
	};

	// ================= LOGIN =================

	const handleLogin = async (e: SubmitEvent) => {
		e.preventDefault();
		loginError = '';
		try {
			const res = await fetch('/api/admin-login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});
			const data = await res.json();
			if (data.success) {
				isAdmin = true;
				showLogin = false;
				username = '';
				password = '';
				loginError = '';
			} else {
				loginError = data.message || 'Username atau password salah!';
			}
		} catch (err) {
			loginError = 'Terjadi kesalahan jaringan saat login.';
		}
	};
	const handleLogout = () => {
		isAdmin = false;
		menuOpen = false;
	};

	// ================= FORM PERATURAN =================

	const openAddForm = () => {
		editingId = null;
		formData = {
			judul: '',
			jenisDokumen: '',
			tahun: '',
			tglPenetapan: '',
			tempatPenetapan: 'Depok',
			tglBerlaku: '',
			status: 'Berlaku',
			perubahan: { tipe: '', teks: '' }
		};
		pdfFile = null;
		existingPdfUrl = null;
		formError = '';
		showForm = true;
		menuOpen = false;
	};
	const openEditForm = (item: any) => {
		editingId = item.id;
		formData = {
			judul: item.judul,
			jenisDokumen: item.jenis_dokumen,
			tahun: item.tahun,
			tglPenetapan: item.tgl_penetapan,
			tempatPenetapan: item.tempat_penetapan,
			tglBerlaku: item.tgl_berlaku,
			status: item.status,
			perubahan: { tipe: item.perubahan_tipe || '', teks: item.perubahan_teks || '' }
		};
		pdfFile = null;
		existingPdfUrl = item.pdf_url || null;
		formError = '';
		showForm = true;
	};
	const handleDelete = async (id: string) => {
		if (window.confirm('Apakah Anda yakin ingin menghapus peraturan ini?')) {
			const { error } = await supabase.from('peraturan').delete().eq('id', id);
			if (error) alert('Gagal hapus: ' + error.message);
			else {
				fetchHomeData();
				if (showAllPeraturan) {
					cachedPages = {};
					fetchPage(1, true);
				}
				if (selectedPeraturan && selectedPeraturan.id === id) goBack();
			}
		}
	};
	const validateAndSetFile = (file: File) => {
		formError = '';
		if (file.type !== 'application/pdf') {
			formError = 'Format file harus PDF!';
			return;
		}
		if (file.size > 500000) {
			formError = 'Ukuran PDF maksimal 500KB!';
			return;
		}
		pdfFile = file;
	};
	const handleFileInput = (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		if (input.files && input.files[0]) validateAndSetFile(input.files[0]);
	};
	const handleDrop = (e: DragEvent) => {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0])
			validateAndSetFile(e.dataTransfer.files[0]);
	};
	const uploadToR2 = async (file: File) => {
		const formDataObj = new FormData();
		formDataObj.append('file', file);
		const res = await fetch('/api/upload-pdf', { method: 'POST', body: formDataObj });
		const data = await res.json();
		if (data.error) throw new Error('Gagal upload ke R2: ' + data.error);
		return data.url as string;
	};
	const handleSave = async (e: SubmitEvent) => {
		e.preventDefault();
		formError = '';
		uploadingPdf = true;
		let finalPdfUrl = existingPdfUrl;
		if (pdfFile) {
			try {
				finalPdfUrl = await uploadToR2(pdfFile);
			} catch (err: any) {
				uploadingPdf = false;
				formError = err.message;
				return;
			}
		}
		const payload = {
			judul: formData.judul,
			jenis_dokumen: formData.jenisDokumen,
			tahun: formData.tahun,
			tgl_penetapan: formData.tglPenetapan,
			tempat_penetapan: formData.tempatPenetapan,
			tgl_berlaku: formData.tglBerlaku,
			status: formData.status,
			perubahan_tipe: formData.perubahan.tipe,
			perubahan_teks: formData.perubahan.teks,
			pdf_url: finalPdfUrl
		};
		if (editingId) {
			const { error } = await supabase.from('peraturan').update(payload).eq('id', editingId);
			if (error) formError = 'Gagal update: ' + error.message;
			else {
				showForm = false;
				fetchHomeData();
				if (showAllPeraturan) {
					cachedPages = {};
					fetchPage(currentPage, true);
				}
			}
		} else {
			const { error } = await supabase.from('peraturan').insert([payload]);
			if (error) formError = 'Gagal tambah: ' + error.message;
			else {
				showForm = false;
				fetchHomeData();
				if (showAllPeraturan) {
					cachedPages = {};
					fetchPage(1, true);
				}
			}
		}
		uploadingPdf = false;
	};

	// ================= FORM ACARA =================

	const monthsID = [
		'Januari',
		'Februari',
		'Maret',
		'April',
		'Mei',
		'Juni',
		'Juli',
		'Agustus',
		'September',
		'Oktober',
		'November',
		'Desember'
	];
	const daysID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
	const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
	const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
	const handlePrevMonth = () => {
		if (currentDate) currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
	};
	const handleNextMonth = () => {
		if (currentDate) currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
	};
	const formatDateKey = (date: Date) => `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
	const handleDateClick = (date: Date) => {
		selectedCalendarDate = date;
	};
	const isSameDate = (d1: Date | null, d2: Date) => {
		if (!d1) return false;
		return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
	};
	const openAddAcaraForm = () => {
		const iD = selectedCalendarDate || today || new Date();
		editingAcaraId = null;
		acaraFormData = {
			date: `${iD.getFullYear()}-${String(iD.getMonth() + 1).padStart(2, '0')}-${String(
				iD.getDate()
			).padStart(2, '0')}`,
			acaraName: '',
			acaraNews: '',
			ltkPenyelenggara: '',
			tempat: '',
			waktuMulai: '',
			waktuSelesai: '',
			penanggungjawab: ''
		};
		acaraFiles = [];
		existingAcaraFiles = [];
		acaraFormError = '';
		showAcaraForm = true;
	};
	const openEditAcaraForm = (item: any) => {
		const dP = item.dateKey.split('-');
		const dateStr = `${dP[2]}-${dP[1].padStart(2, '0')}-${dP[0].padStart(2, '0')}`;
		editingAcaraId = item.id;
		acaraFormData = {
			date: dateStr,
			acaraName: item.title,
			acaraNews: item.description,
			ltkPenyelenggara: item.ltkPenyelenggara,
			tempat: item.tempat,
			waktuMulai: item.waktuMulai,
			waktuSelesai: item.waktuSelesai === 'SELESAI' ? '' : item.waktuSelesai,
			penanggungjawab: item.penanggungjawab
		};
		acaraFiles = [];
		existingAcaraFiles = item.file_urls || [];
		acaraFormError = '';
		showAcaraForm = true;
	};
	const handleAcaraFileInput = (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		if (input.files) {
			const newFiles = Array.from(input.files);
			const validFiles = newFiles.filter(
				(f) => (f.type === 'image/webp' || f.type === 'application/pdf') && f.size <= 2000000
			);
			if (validFiles.length !== newFiles.length)
				acaraFormError = 'Beberapa file ditolak. Pastikan format WebP/PDF dan maksimal 2MB.';
			else acaraFormError = '';
			acaraFiles = [...acaraFiles, ...validFiles].slice(0, 10);
		}
	};
	const handleRemoveAcaraFile = (idx: number) => {
		acaraFiles = acaraFiles.filter((_, i) => i !== idx);
	};
	const handleRemoveExistingAcaraFile = (idx: number) => {
		existingAcaraFiles = existingAcaraFiles.filter((_, i) => i !== idx);
	};
	const handleAcaraSave = async (e: SubmitEvent) => {
		e.preventDefault();
		acaraFormError = '';
		uploadingAcara = true;
		let finalUrls = [...existingAcaraFiles];
		if (acaraFiles.length > 0) {
			if (finalUrls.length + acaraFiles.length > 10) {
				acaraFormError = 'Total file melebihi batas maksimal 10.';
				uploadingAcara = false;
				return;
			}
			const fd = new FormData();
			acaraFiles.forEach((f) => fd.append('files', f));
			const res = await fetch('/api/upload-files', { method: 'POST', body: fd });
			const data = await res.json();
			if (data.error) {
				acaraFormError = data.error;
				uploadingAcara = false;
				return;
			}
			finalUrls = [...finalUrls, ...data.urls];
		}
		const dP = acaraFormData.date.split('-');
		const fK = `${parseInt(dP[2])}-${parseInt(dP[1])}-${dP[0]}`;
		const payload = {
			date_key: fK,
			title: acaraFormData.acaraName,
			description: acaraFormData.acaraNews,
			ltk_penyelenggara: acaraFormData.ltkPenyelenggara,
			tempat: acaraFormData.tempat,
			waktu_mulai: acaraFormData.waktuMulai,
			waktu_selesai: acaraFormData.waktuSelesai,
			penanggungjawab: acaraFormData.penanggungjawab,
			file_urls: finalUrls
		};
		if (editingAcaraId) {
			const { data, error } = await supabase
				.from('iss_events')
				.update(payload)
				.eq('id', editingAcaraId)
				.select();
			if (error) alert('Gagal: ' + error.message);
			else if (data) {
				const n = data[0] as any;
				acaraData = acaraData.map((ev) =>
					ev.id === n.id
						? {
								...ev,
								dateKey: n.date_key,
								title: n.title,
								description: n.description,
								ltkPenyelenggara: n.ltk_penyelenggara || '-',
								tempat: n.tempat || '-',
								waktuMulai: n.waktu_mulai || '',
								waktuSelesai: n.waktu_selesai || '',
								penanggungjawab: n.penanggungjawab || '-',
								file_urls: n.file_urls || []
							}
						: ev
				);
				showAcaraForm = false;
			}
		} else {
			const { data, error } = await supabase.from('iss_events').insert([payload]).select();
			if (error) alert('Gagal: ' + error.message);
			else if (data) {
				const n = data[0] as any;
				acaraData = acaraData.some((e) => e.id === n.id)
					? acaraData
					: [
							...acaraData,
							{
								id: n.id,
								dateKey: n.date_key,
								title: n.title,
								description: n.description,
								ltkPenyelenggara: n.ltk_penyelenggara || '-',
								tempat: n.tempat || '-',
								waktuMulai: n.waktu_mulai || '',
								waktuSelesai: n.waktu_selesai || '',
								penanggungjawab: n.penanggungjawab || '-',
								file_urls: n.file_urls || []
							}
						];
				showAcaraForm = false;
				selectedCalendarDate = new Date(parseInt(dP[0]), parseInt(dP[1]) - 1, parseInt(dP[2]));
			}
		}
		uploadingAcara = false;
	};
	const handleDeleteAcara = async (id: string) => {
		if (window.confirm('Hapus acara?')) {
			const { error } = await supabase.from('iss_events').delete().eq('id', id);
			if (error) alert('Gagal: ' + error.message);
			else acaraData = acaraData.filter((ev) => ev.id !== id);
		}
	};

	// ================= FORM BERITA =================

	const openAddBeritaForm = () => {
		editingBeritaId = null;
		beritaFormData = { judul: '', isi: '', tgl_terbit: '' };
		beritaFiles = [];
		existingBeritaFiles = [];
		beritaFormError = '';
		showBeritaForm = true;
		menuOpen = false;
	};
	const openEditBeritaForm = (item: any) => {
		editingBeritaId = item.id;
		beritaFormData = { judul: item.judul, isi: item.isi, tgl_terbit: item.tgl_terbit };
		beritaFiles = [];
		existingBeritaFiles = item.file_urls || [];
		beritaFormError = '';
		showBeritaForm = true;
	};
	const handleBeritaFileInput = (e: Event) => {
		const input = e.currentTarget as HTMLInputElement;
		if (input.files) {
			const newFiles = Array.from(input.files);
			const validFiles = newFiles.filter(
				(f) => (f.type === 'image/webp' || f.type === 'application/pdf') && f.size <= 2000000
			);
			if (validFiles.length !== newFiles.length)
				beritaFormError = 'Beberapa file ditolak. Pastikan format WebP/PDF dan maksimal 2MB.';
			else beritaFormError = '';
			beritaFiles = [...beritaFiles, ...validFiles].slice(0, 10);
		}
	};
	const handleRemoveBeritaFile = (idx: number) => {
		beritaFiles = beritaFiles.filter((_, i) => i !== idx);
	};
	const handleRemoveExistingBeritaFile = (idx: number) => {
		existingBeritaFiles = existingBeritaFiles.filter((_, i) => i !== idx);
	};
	const handleBeritaSave = async (e: SubmitEvent) => {
		e.preventDefault();
		beritaFormError = '';
		uploadingBerita = true;
		let finalUrls = [...existingBeritaFiles];
		if (beritaFiles.length > 0) {
			if (finalUrls.length + beritaFiles.length > 10) {
				beritaFormError = 'Total file melebihi batas maksimal 10.';
				uploadingBerita = false;
				return;
			}
			const fd = new FormData();
			beritaFiles.forEach((f) => fd.append('files', f));
			const res = await fetch('/api/upload-files', { method: 'POST', body: fd });
			const data = await res.json();
			if (data.error) {
				beritaFormError = data.error;
				uploadingBerita = false;
				return;
			}
			finalUrls = [...finalUrls, ...data.urls];
		}
		const payload = {
			judul: beritaFormData.judul,
			isi: beritaFormData.isi,
			tgl_terbit: beritaFormData.tgl_terbit,
			file_urls: finalUrls
		};
		if (editingBeritaId) {
			const { error } = await supabase.from('berita').update(payload).eq('id', editingBeritaId);
			if (error) beritaFormError = 'Gagal update: ' + error.message;
			else {
				showBeritaForm = false;
				fetchHomeData();
				if (showAllBerita) {
					cachedBeritaPages = {};
					fetchBeritaPage(currentBeritaPage, true);
				}
			}
		} else {
			const { error } = await supabase.from('berita').insert([payload]);
			if (error) beritaFormError = 'Gagal tambah: ' + error.message;
			else {
				showBeritaForm = false;
				fetchHomeData();
				if (showAllBerita) {
					cachedBeritaPages = {};
					fetchBeritaPage(1, true);
				}
			}
		}
		uploadingBerita = false;
	};
	const handleDeleteBerita = async (id: string) => {
		if (window.confirm('Apakah Anda yakin ingin menghapus berita ini?')) {
			const { error } = await supabase.from('berita').delete().eq('id', id);
			if (error) alert('Gagal hapus: ' + error.message);
			else {
				fetchHomeData();
				if (showAllBerita) {
					cachedBeritaPages = {};
					fetchBeritaPage(currentBeritaPage, true);
				}
				if (selectedBerita && selectedBerita.id === id) goBack();
			}
		}
	};

	// ================= DOWNLOAD & PROXY =================

	const handleDownload = (url: string, filename: string) => {
		const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(
			filename
		)}`;
		const link = document.createElement('a');
		link.href = downloadUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const proxyUrl = (url: string) => `/api/image?url=${encodeURIComponent(url)}`;

	// iOS Safari tidak merender PDF di dalam iframe (layar hitam) —
	// buka viewer PDF native Safari di tab baru. Android/desktop tetap pakai overlay.
	const isIOSDevice = () =>
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

	const openPdf = (url: string) => {
		if (isIOSDevice()) {
			window.open(proxyUrl(url), '_blank', 'noopener');
		} else {
			viewingPdfUrl = url;
		}
	};
</script>

<!-- ============ MODAL LOGIN ============ -->
{#if showLogin}
	<div class="modal-overlay" onclick={() => (showLogin = false)}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">Login Admin</h2>
			<form onsubmit={handleLogin}>
				<div class="form-group"><label class="form-label">Username</label><input type="text" class="form-input" value={username} oninput={(e) => (username = val(e))} /></div>
				<div class="form-group"><label class="form-label">Password</label><input type="password" class="form-input" value={password} oninput={(e) => (password = val(e))} /></div>
				{#if loginError}<p class="error-text">{loginError}</p>{/if}
				<div class="form-actions"><button type="submit" class="btn-primary" style="flex: 1">Login</button><button type="button" class="action-btn outline" style="flex: 1; justify-content: center; background: transparent; color: var(--ink); border: 1px solid var(--hairline-strong)" onclick={() => (showLogin = false)}>Batal</button></div>
			</form>
		</div>
	</div>
{/if}

<!-- ============ MODAL FORM PERATURAN ============ -->
{#if showForm}
	<div class="modal-overlay" onclick={() => (showForm = false)}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">{editingId ? 'Edit Peraturan' : 'Tambah Peraturan Baru'}</h2>
			<form onsubmit={handleSave}>
				<div class="form-group"><label class="form-label">Judul</label><input type="text" class="form-input" required value={formData.judul} oninput={(e) => (formData = { ...formData, judul: val(e) })} placeholder="Masukkan judul peraturan" /></div>
				<div class="form-group"><label class="form-label">Jenis Dokumen</label><select class="form-select" required value={formData.jenisDokumen} onchange={(e) => (formData = { ...formData, jenisDokumen: val(e) })}><option value="" disabled>Pilih Jenis Dokumen</option>{#each jenisDokumenList as j (j)}<option value={j}>{j}</option>{/each}</select></div>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
					<div class="form-group"><label class="form-label">Tahun</label><select class="form-select" required value={formData.tahun} onchange={(e) => (formData = { ...formData, tahun: val(e) })}><option value="" disabled>Pilih Tahun</option>{#each tahunList as t (t)}<option value={t}>{t}</option>{/each}</select></div>
					<div class="form-group"><label class="form-label">Status</label><select class="form-select" required value={formData.status} onchange={(e) => (formData = { ...formData, status: val(e) })}>{#each statusList as s (s)}<option value={s}>{s}</option>{/each}</select></div>
				</div>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
					<div class="form-group"><label class="form-label">Tgl Penetapan</label><input type="date" class="form-input" required value={formData.tglPenetapan} oninput={(e) => (formData = { ...formData, tglPenetapan: val(e) })} /></div>
					<div class="form-group"><label class="form-label">Tgl Berlaku</label><input type="date" class="form-input" required value={formData.tglBerlaku} oninput={(e) => (formData = { ...formData, tglBerlaku: val(e) })} /></div>
				</div>
				<div class="form-group"><label class="form-label">Tempat Penetapan</label><input type="text" class="form-input" required value={formData.tempatPenetapan} oninput={(e) => (formData = { ...formData, tempatPenetapan: val(e) })} /></div>
				<div class="form-group">
					<label class="form-label">Dokumen PDF (Maks 500KB)</label>
					{#if !pdfFile && !existingPdfUrl}
						<div class="dropzone {isDragging ? 'active' : ''}" onclick={() => document.getElementById('pdf-upload-input')?.click()} ondragover={(e) => { e.preventDefault(); isDragging = true; }} ondragleave={() => (isDragging = false)} ondrop={handleDrop}>
							<input id="pdf-upload-input" type="file" accept="application/pdf" style="display: none" onchange={handleFileInput} />
							<p style="font-family: var(--font-body); font-size: 14px; color: var(--mute)">Drag & drop PDF di sini, atau klik untuk memilih file</p>
						</div>
					{:else}
						<div class="pdf-file-info">
							<span>{pdfFile ? pdfFile.name : existingPdfUrl ? 'PDF Lama (Klik remove untuk ganti)' : ''}</span>
							<button type="button" class="btn-remove-pdf" onclick={() => { pdfFile = null; existingPdfUrl = null; }}>✕</button>
						</div>
					{/if}
					{#if formError}<p class="error-text">{formError}</p>{/if}
				</div>
				<div class="form-group" style="margin-top: 24px; padding-top: 16px; border-top: 1px dashed var(--hairline-strong)">
					<label class="form-label">Perubahan Peraturan (Opsional)</label>
					<div style="display: grid; grid-template-columns: 200px 1fr; gap: 16px; align-items: flex-start">
						<select class="form-select" value={formData.perubahan.tipe} onchange={(e) => (formData = { ...formData, perubahan: { ...formData.perubahan, tipe: val(e) } })}><option value="">Tidak Ada</option><option value="MENCABUT">MENCABUT</option><option value="MERUBAH">MERUBAH</option></select>
						<input type="text" class="form-input" placeholder="Keterangan perubahan (opsional)" value={formData.perubahan.teks} oninput={(e) => (formData = { ...formData, perubahan: { ...formData.perubahan, teks: val(e) } })} />
					</div>
				</div>
				<div class="form-actions">
					<button type="submit" class="btn-primary" style="flex: 1" disabled={uploadingPdf}>{uploadingPdf ? 'Menyimpan...' : 'Simpan'}</button>
					<button type="button" class="action-btn outline" style="flex: 1; justify-content: center; background: transparent; color: var(--ink); border: 1px solid var(--hairline-strong)" onclick={() => (showForm = false)}>Batal</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============ MODAL FORM BERITA ============ -->
{#if showBeritaForm}
	<div class="modal-overlay" onclick={() => (showBeritaForm = false)}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">{editingBeritaId ? 'Edit Berita' : 'Tambah Berita Baru'}</h2>
			<form onsubmit={handleBeritaSave}>
				<div class="form-group"><label class="form-label">Tanggal Penerbitan</label><input type="date" class="form-input" required value={beritaFormData.tgl_terbit} oninput={(e) => (beritaFormData = { ...beritaFormData, tgl_terbit: val(e) })} /></div>
				<div class="form-group"><label class="form-label">Judul Berita</label><input type="text" class="form-input" required placeholder="Masukkan judul berita" value={beritaFormData.judul} oninput={(e) => (beritaFormData = { ...beritaFormData, judul: val(e) })} /></div>
				<div class="form-group"><label class="form-label">Isi Berita</label><textarea class="form-input" required rows={6} placeholder="Tulis isi berita di sini..." style="resize: vertical; font-family: var(--font-body)" value={beritaFormData.isi} oninput={(e) => (beritaFormData = { ...beritaFormData, isi: val(e) })}></textarea></div>
				<div class="form-group">
					<label class="form-label">Lampiran Gambar/PDF (Maks 10 file, 2MB/file)</label>
					<div class="dropzone" onclick={() => document.getElementById('berita-files-input')?.click()}>
						<input id="berita-files-input" type="file" multiple accept="image/webp,application/pdf" style="display: none" onchange={handleBeritaFileInput} />
						<p style="font-family: var(--font-body); font-size: 14px; color: var(--mute)">Klik untuk memilih file (WebP/PDF)</p>
					</div>
					<p class="file-instruction">Sebelum upload gambar, ubah dulu ke format WebP lewat <a href="https://cloudconvert.com/webp-converter" target="_blank" rel="noopener noreferrer">cloudconvert.com/webp-converter</a></p>
					{#if beritaFiles.length > 0 || existingBeritaFiles.length > 0}
						<div class="file-preview-grid">
							{#each existingBeritaFiles as url, idx (idx)}
								<div class="file-preview-item">
									{#if url.endsWith('.pdf')}<div class="pdf-icon">PDF</div>{:else}<img src={proxyUrl(url)} alt="File {idx + 1}" />{/if}
									<button type="button" class="btn-remove-file" onclick={() => handleRemoveExistingBeritaFile(idx)}>✕</button>
								</div>
							{/each}
							{#each beritaFiles as file, idx (idx)}
								<div class="file-preview-item">
									<LocalImagePreview {file} />
									<button type="button" class="btn-remove-file" onclick={() => handleRemoveBeritaFile(idx)}>✕</button>
								</div>
							{/each}
						</div>
					{/if}
					{#if beritaFormError}<p class="error-text">{beritaFormError}</p>{/if}
				</div>
				<div class="form-actions">
					<button type="submit" class="btn-primary" style="flex: 1" disabled={uploadingBerita}>{uploadingBerita ? 'Menyimpan...' : 'Simpan'}</button>
					<button type="button" class="action-btn outline" style="flex: 1; justify-content: center; background: transparent; color: var(--ink); border: 1px solid var(--hairline-strong)" onclick={() => (showBeritaForm = false)}>Batal</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============ MODAL FORM ACARA ============ -->
{#if showAcaraForm}
	<div class="modal-overlay" onclick={() => (showAcaraForm = false)}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h2 class="modal-title">{editingAcaraId ? 'Edit Acara' : 'Tambah Acara Baru'}</h2>
			<form onsubmit={handleAcaraSave}>
				<div class="form-group"><label class="form-label">Tanggal Acara</label><input type="date" class="form-input" required value={acaraFormData.date} oninput={(e) => (acaraFormData = { ...acaraFormData, date: val(e) })} /></div>
				<div class="form-group"><label class="form-label">Nama Acara</label><input type="text" class="form-input" required placeholder="Masukkan nama acara" value={acaraFormData.acaraName} oninput={(e) => (acaraFormData = { ...acaraFormData, acaraName: val(e) })} /></div>
				<div class="form-group"><label class="form-label">Berita Acara (Bisa isi link apapun)</label><textarea class="form-input" required rows={3} placeholder="Deskripsi singkat / berita acara" style="resize: vertical; font-family: var(--font-body)" value={acaraFormData.acaraNews} oninput={(e) => (acaraFormData = { ...acaraFormData, acaraNews: val(e) })}></textarea></div>
				<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
					<div class="form-group"><label class="form-label">LTK Penyelenggara</label><input type="text" class="form-input" required placeholder="Misal: BPM FIA UI" value={acaraFormData.ltkPenyelenggara} oninput={(e) => (acaraFormData = { ...acaraFormData, ltkPenyelenggara: val(e) })} /></div>
					<div class="form-group"><label class="form-label">Tempat</label><input type="text" class="form-input" required placeholder="Misal: Gedung M FIA UI" value={acaraFormData.tempat} oninput={(e) => (acaraFormData = { ...acaraFormData, tempat: val(e) })} /></div>
				</div>
				<div class="form-group">
					<label class="form-label">Waktu Mulai (24 Jam)</label>
					<div class="time-picker-group">
						<select class="form-select" required value={mulaiH} onchange={(e) => (acaraFormData = { ...acaraFormData, waktuMulai: `${val(e)}:${mulaiM || '00'}` })}><option value="" disabled>Jam</option>{#each hoursList as h (h)}<option value={h}>{h}</option>{/each}</select>
						<span class="time-separator">:</span>
						<select class="form-select" required value={mulaiM} onchange={(e) => (acaraFormData = { ...acaraFormData, waktuMulai: `${mulaiH || '00'}:${val(e)}` })}><option value="" disabled>Min</option>{#each minutesList as m (m)}<option value={m}>{m}</option>{/each}</select>
					</div>
				</div>
				<div class="form-group">
					<label class="form-label">Waktu Selesai (24 Jam)</label>
					<div class="time-picker-group">
						<select class="form-select" required={!isSelesaiChecked} disabled={isSelesaiChecked} value={selesaiH} onchange={(e) => (acaraFormData = { ...acaraFormData, waktuSelesai: `${val(e)}:${selesaiM || '00'}` })}><option value="" disabled>Jam</option>{#each hoursList as h (h)}<option value={h}>{h}</option>{/each}</select>
						<span class="time-separator">:</span>
						<select class="form-select" required={!isSelesaiChecked} disabled={isSelesaiChecked} value={selesaiM} onchange={(e) => (acaraFormData = { ...acaraFormData, waktuSelesai: `${selesaiH || '00'}:${val(e)}` })}><option value="" disabled>Min</option>{#each minutesList as m (m)}<option value={m}>{m}</option>{/each}</select>
						<input type="checkbox" checked={isSelesaiChecked} onchange={(e) => (acaraFormData = { ...acaraFormData, waktuSelesai: checkedVal(e) ? 'SELESAI' : '' })} />
						<label style="font-size: 14px; font-family: var(--font-body)">Selesai</label>
					</div>
				</div>
				<div class="form-group"><label class="form-label">Penanggungjawab</label><input type="text" class="form-input" required placeholder="Nama penanggungjawab acara" value={acaraFormData.penanggungjawab} oninput={(e) => (acaraFormData = { ...acaraFormData, penanggungjawab: val(e) })} /></div>
				<div class="form-group">
					<label class="form-label">Lampiran Gambar/PDF (Maks 10 file, 2MB/file)</label>
					<div class="dropzone" onclick={() => document.getElementById('acara-files-input')?.click()}>
						<input id="acara-files-input" type="file" multiple accept="image/webp,application/pdf" style="display: none" onchange={handleAcaraFileInput} />
						<p style="font-family: var(--font-body); font-size: 14px; color: var(--mute)">Klik untuk memilih file (WebP/PDF)</p>
					</div>
					<p class="file-instruction">Jika ingin mengupload gambar, ubah dulu formatnya ke WebP di website <a href="https://cloudconvert.com/webp-converter" target="_blank" rel="noopener noreferrer">cloudconvert.com/webp-converter</a></p>
					{#if acaraFiles.length > 0 || existingAcaraFiles.length > 0}
						<div class="file-preview-grid">
							{#each existingAcaraFiles as url, idx (idx)}
								<div class="file-preview-item">
									{#if url.endsWith('.pdf')}<div class="pdf-icon">PDF</div>{:else}<img src={proxyUrl(url)} alt="File {idx + 1}" />{/if}
									<button type="button" class="btn-remove-file" onclick={() => handleRemoveExistingAcaraFile(idx)}>✕</button>
								</div>
							{/each}
							{#each acaraFiles as file, idx (idx)}
								<div class="file-preview-item">
									<LocalImagePreview {file} />
									<button type="button" class="btn-remove-file" onclick={() => handleRemoveAcaraFile(idx)}>✕</button>
								</div>
							{/each}
						</div>
					{/if}
					{#if acaraFormError}<p class="error-text">{acaraFormError}</p>{/if}
				</div>
				<div class="form-actions">
					<button type="submit" class="btn-primary" style="flex: 1" disabled={uploadingAcara}>{uploadingAcara ? 'Menyimpan...' : 'Simpan'}</button>
					<button type="button" class="action-btn outline" style="flex: 1; justify-content: center; background: transparent; color: var(--ink); border: 1px solid var(--hairline-strong)" onclick={() => (showAcaraForm = false)}>Batal</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ============ PDF VIEWER ============ -->
{#if viewingPdfUrl}
	<div class="pdf-viewer-overlay">
		<div class="pdf-viewer-header">
			<span class="pdf-viewer-title">{selectedPeraturan ? selectedPeraturan.judul : 'Document'}</span>
			<button type="button" class="pdf-viewer-close" onclick={() => (viewingPdfUrl = null)}>Tutup (X)</button>
		</div>
		<div class="pdf-container"><iframe src={proxyUrl(viewingPdfUrl)} title="PDF Viewer" style="width: 100%; height: 100%; border: none"></iframe></div>
	</div>
{/if}

<!-- ============ NAVBAR ============ -->
<nav
	class="navbar {scrolled || showAllPeraturan || selectedPeraturan || showAboutUs || showStatusIkm || showAllBerita || selectedBerita ? 'scrolled' : ''} {(showAllPeraturan || selectedPeraturan || showAboutUs || showStatusIkm || showAllBerita || selectedBerita) ? 'page-peraturan' : ''}"
>
	<div class="nav-logo" onclick={goToHome}>
		<img src="/assets/logobpm.webp" alt="Logo FIA UI" />
		<div class="nav-logo-text"><span>JDIH</span><span>BPM FIA UI</span></div>
	</div>
	<ul class="nav-links {menuOpen ? 'active' : ''}">
		<li><a href="#" onclick={(e) => { e.preventDefault(); goToHome(); menuOpen = false; }}>Beranda</a></li>
		<li><a href="#" onclick={(e) => { e.preventDefault(); goToAllPeraturan(); menuOpen = false; }}>Peraturan</a></li>
		<li><a href="#" onclick={(e) => { e.preventDefault(); goToAllBerita(); menuOpen = false; }}>Berita</a></li>
		<li><a href="#" onclick={(e) => { e.preventDefault(); goToAboutUs(); menuOpen = false; }}>About Us</a></li>
		<li><a href="#" onclick={(e) => { e.preventDefault(); goToStatusIkm(); menuOpen = false; }}>Cek Status IKM</a></li>
		<li><a href="#" onclick={(e) => { e.preventDefault(); goToKontak(); menuOpen = false; }}>Kontak</a></li>
		{#if !isAdmin}<li><a href="#" class="mobile-admin-link" onclick={(e) => { e.preventDefault(); showLogin = true; menuOpen = false; }}>Admin Login</a></li>{/if}
	</ul>
	<div class="admin-controls">
		{#if isAdmin}<button type="button" class="btn-logout" onclick={handleLogout}>Logout</button>{/if}
		<button type="button" class="menu-toggle" onclick={() => (menuOpen = !menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12L20 12" class="line1" /><path d="M4 12H20" class="line2" /><path d="M4 12H20" class="line3" /></svg></button>
	</div>
</nav>

<!-- ============ HALAMAN UTAMA ============ -->
{#if !showAllPeraturan && !selectedPeraturan && !showAboutUs && !showStatusIkm && !showAllBerita && !selectedBerita}
	<section class="hero" id="beranda" style="background-image: url('/assets/gedungfia.webp'); background-color: var(--surface-dark)">
		<div class="hero-content">
			<div class="hero-badge">SELAMAT DATANG</div>
			<h1>Badan Perwakilan Mahasiswa FIA UI</h1>
			<p>Mewakili suara mahasiswa, menjunjung tinggi demokrasi, dan berkomitmen untuk menciptakan lingkungan kampus yang lebih baik.</p>
			<button type="button" onclick={goToAllPeraturan} class="btn-primary">Jelajahi Peraturan</button>
		</div>
	</section>
	<MovingBorder borderRadius="24px" rx="24" ry="24" duration="3s" class="stats-mb">
	<div class="stats-section">
		<div class="stat-item"><div class="stat-number">{stats.total}</div><div class="stat-label">Dokumen</div></div>
		<div class="stat-item"><div class="stat-number">{stats.berlaku}</div><div class="stat-label">Berlaku</div></div>
		<div class="stat-item"><div class="stat-number">{stats.dicabut}</div><div class="stat-label">Dicabut</div></div>
	</div>
	</MovingBorder>
	<section class="section" id="peraturan">
		<div class="section-header" style="display: flex; justify-content: space-between; align-items: center">
			<div style="text-align: left"><h2>Peraturan Terbaru</h2><span class="hdr-line"></span><p>Daftar peraturan yang dikeluarkan oleh BPM FIA UI</p></div>
			{#if isAdmin}<button type="button" class="btn-admin-action" onclick={openAddForm} title="Tambah Peraturan">+</button>{/if}
		</div>
		<div class="cards-grid">
			{#each homePeraturan as item (item.id)}
				<div class="card">
					<div class="card-header"><span>{item.jenis_dokumen}</span><span class="card-date">{formatTanggal(item.tgl_penetapan)}</span></div>
					<div class="card-body">
						<h3 class="card-title">{item.judul}</h3>
						<button type="button" class="btn-outline" onclick={() => viewDetail(item)}>View</button>
						{#if isAdmin}<div class="card-actions"><button type="button" class="btn-edit" onclick={() => openEditForm(item)}>Edit</button><button type="button" class="btn-delete" onclick={() => handleDelete(item.id)}>Hapus</button></div>{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="btn-more-container"><button type="button" onclick={goToAllPeraturan} class="btn-primary">More</button></div>
	</section>

	<section class="section" id="berita" style="background-color: var(--surface-soft)">
		<div class="section-header" style="display: flex; justify-content: space-between; align-items: center">
			<div style="text-align: left"><h2>Berita Terbaru</h2><span class="hdr-line"></span><p>Informasi dan kabar terkini</p></div>
			{#if isAdmin}<button type="button" class="btn-admin-action" onclick={openAddBeritaForm} title="Tambah Berita">+</button>{/if}
		</div>
		<div class="cards-grid">
			{#each homeBerita as item (item.id)}
				<div class="card">
					<div class="card-header"><span>Berita</span><span class="card-date">{formatTanggal(item.tgl_terbit)}</span></div>
					<div class="card-body">
						<h3 class="card-title">{item.judul}</h3>
						<button type="button" class="btn-outline" onclick={() => viewBeritaDetail(item)}>Baca Selengkapnya</button>
						{#if isAdmin}<div class="card-actions"><button type="button" class="btn-edit" onclick={() => openEditBeritaForm(item)}>Edit</button><button type="button" class="btn-delete" onclick={() => handleDeleteBerita(item.id)}>Hapus</button></div>{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="btn-more-container"><button type="button" onclick={goToAllBerita} class="btn-primary">More</button></div>
	</section>

	<section class="section" id="iss">
		<div class="section-header"><h2>ISS (Integrated Scheduling System)</h2><span class="hdr-line"></span><p>Jadwal kegiatan dan acara yang akan dilaksanakan oleh BPM FIA UI</p></div>
		<MovingBorder borderRadius="24px" rx="24" ry="24" duration="3s" class="iss-mb">
		<div class="iss-container">
			<div class="calendar-header"><div class="calendar-title">{currentDate ? `${monthsID[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 'Memuat Kalender...'}</div><div class="calendar-nav"><button type="button" class="cal-nav-btn" onclick={handlePrevMonth}>&lt;</button><button type="button" class="cal-nav-btn" onclick={handleNextMonth}>&gt;</button></div></div>
			<div class="calendar-grid">
				{#each daysID as day, idx (idx)}<div class="cal-weekday {idx === 0 || idx === 6 ? 'weekend' : ''}">{day}</div>{/each}
				{#if currentDate}
					{@const y = currentDate.getFullYear()}
					{@const m = currentDate.getMonth()}
					{@const dIM = getDaysInMonth(y, m)}
					{@const fD = getFirstDayOfMonth(y, m)}
					{#each Array.from({ length: fD }) as _, i (i)}
						<div class="cal-day empty"></div>
					{/each}
					{#each Array.from({ length: dIM }) as _, i (i)}
						{@const dO = new Date(y, m, i + 1)}
						{@const dK = formatDateKey(dO)}
						{@const hA = acaraData.some((ev) => ev.dateKey === dK)}
						{@const iT = today ? isSameDate(today, dO) : false}
						{@const iS = isSameDate(selectedCalendarDate, dO)}
						{@const dOW = dO.getDay()}
						{@const iW = dOW === 0 || dOW === 6}
						<div class="cal-day {iT ? 'today' : ''} {iS ? 'selected' : ''} {iW ? 'weekend' : ''} {hA ? 'has-event' : ''}" onclick={() => handleDateClick(dO)} role="button">{i + 1}</div>
					{/each}
				{/if}
			</div>
			<div class="calendar-events">
				{#if selectedCalendarDate}
					<h3 style="font-family: var(--font-heading); margin-bottom: 16px; text-transform: uppercase; font-size: 16px">Acara pada {selectedCalendarDate.getDate()} {monthsID[selectedCalendarDate.getMonth()]} {selectedCalendarDate.getFullYear()}</h3>
					{#if selectedDateAcara.length > 0}
						{#each selectedDateAcara as ev (ev.id)}
							<div class="event-item">
								<h4>{ev.title}</h4>
								<p><TextWithLinks text={ev.description} /></p>
								<div class="event-meta">
									<div><strong>LTK Penyelenggara:</strong> {ev.ltkPenyelenggara}</div>
									<div><strong>Tempat:</strong> {ev.tempat}</div>
									<div><strong>Waktu:</strong> {ev.waktuMulai} - {ev.waktuSelesai === '' ? '-' : ev.waktuSelesai}</div>
									<div><strong>Penanggungjawab:</strong> {ev.penanggungjawab}</div>
								</div>
								{#if ev.file_urls && ev.file_urls.length > 0}
									<div class="event-files-grid">
										{#each ev.file_urls as url, idx (idx)}
											<a href={proxyUrl(url)} target="_blank" rel="noopener noreferrer" class="event-file-link">
												{#if url.endsWith('.pdf')}<div class="pdf-icon">PDF</div>{:else}<img src={proxyUrl(url)} alt="File {idx + 1}" />{/if}
											</a>
										{/each}
									</div>
								{/if}
								{#if isAdmin}
									<div style="margin-top: 12px; display: flex; gap: 8px">
										<button type="button" class="btn-edit" onclick={() => openEditAcaraForm(ev)}>Edit Acara</button>
										<button type="button" class="btn-delete" onclick={() => handleDeleteAcara(ev.id)}>Hapus Acara</button>
									</div>
								{/if}
							</div>
						{/each}
					{:else}
						<p class="no-events">Tidak ada acara pada tanggal ini.</p>
					{/if}
					{#if isAdmin}<button type="button" class="btn-primary add-event-btn" onclick={openAddAcaraForm}>+ Tambah Acara Baru</button>{/if}
				{:else}
					<p class="no-events">Klik pada salah satu tanggal untuk melihat detail acara.</p>
					{#if isAdmin}<button type="button" class="btn-primary add-event-btn" onclick={openAddAcaraForm}>+ Tambah Acara Baru</button>{/if}
				{/if}
			</div>
		</div>
		</MovingBorder>
	</section>
{:else if showAllBerita}
	<div class="page-peraturan-container"><section class="section">
		<button type="button" class="btn-back" onclick={goBack}>← Kembali ke Beranda</button>
		<div class="section-header" style="display: flex; justify-content: space-between; align-items: center">
			<div style="text-align: left"><h2>Semua Berita</h2><span class="hdr-line"></span><p>Daftar lengkap kabar terkini</p></div>
			{#if isAdmin}<button type="button" class="btn-admin-action" onclick={openAddBeritaForm} title="Tambah Berita">+</button>{/if}
		</div>
		{#if loadingBerita}
			<p style="text-align: center; margin-top: 32px; color: var(--mute)">Memuat data...</p>
		{:else if currentBeritaData.length > 0}
			<div class="cards-grid">
				{#each currentBeritaData as item (item.id)}
					<div class="card">
						<div class="card-header"><span>Berita</span><span class="card-date">{formatTanggal(item.tgl_terbit)}</span></div>
						<div class="card-body">
							<h3 class="card-title">{item.judul}</h3>
							<button type="button" class="btn-outline" onclick={() => viewBeritaDetail(item)}>Baca Selengkapnya</button>
							{#if isAdmin}<div class="card-actions"><button type="button" class="btn-edit" onclick={() => openEditBeritaForm(item)}>Edit</button><button type="button" class="btn-delete" onclick={() => handleDeleteBerita(item.id)}>Hapus</button></div>{/if}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<p style="text-align: center; margin-top: 32px; color: var(--mute)">Belum ada berita yang dipublikasikan.</p>
		{/if}
		{#if totalBeritaPages > 1}
			<div class="pagination-container">
				<button type="button" onclick={() => handleBeritaPageChange(currentBeritaPage - 1)} disabled={currentBeritaPage === 1} class="pagination-btn">Sebelumnya</button>
				{#if totalBeritaPages > 1}{#each Array.from({ length: totalBeritaPages }) as _, i (i)}<button type="button" onclick={() => handleBeritaPageChange(i + 1)} class="pagination-btn {currentBeritaPage === i + 1 ? 'active' : ''}">{i + 1}</button>{/each}{/if}
				<button type="button" onclick={() => handleBeritaPageChange(currentBeritaPage + 1)} disabled={currentBeritaPage === totalBeritaPages} class="pagination-btn">Berikutnya</button>
			</div>
		{/if}
		{#if totalBeritaItems > 0}
			<p class="pagination-info">Menampilkan {((currentBeritaPage - 1) * itemsPerPage) + 1} - {Math.min(currentBeritaPage * itemsPerPage, totalBeritaItems)} dari {totalBeritaItems} berita</p>
		{/if}
	</section></div>
{:else if selectedBerita}
	<div class="page-peraturan-container"><section class="section">
		<button type="button" class="btn-back" onclick={goBack}>← Kembali ke Daftar Berita</button>
		<div class="berita-detail-container">
			<h1 class="berita-detail-title">{selectedBerita.judul}</h1>
			<div class="berita-detail-date">{formatTanggal(selectedBerita.tgl_terbit)}</div>
			<div class="berita-detail-content"><TextWithLinks text={selectedBerita.isi} /></div>
			{#if selectedBerita.file_urls && selectedBerita.file_urls.length > 0}
				<div class="berita-images-grid">
					{#each selectedBerita.file_urls as url, idx (idx)}
						{#if url.endsWith('.pdf')}
							<a href={proxyUrl(url)} target="_blank" rel="noopener noreferrer" class="action-btn outline" style="align-self: flex-start">Lihat Dokumen PDF {idx + 1}</a>
						{:else}
							<div class="berita-image-item"><img src={proxyUrl(url)} alt="Gambar Berita {idx + 1}" /></div>
						{/if}
					{/each}
				</div>
			{/if}
			{#if isAdmin}
				<div style="margin-top: 32px; display: flex; gap: 8px">
					<button type="button" class="btn-edit" onclick={() => openEditBeritaForm(selectedBerita)}>Edit Berita</button>
					<button type="button" class="btn-delete" onclick={() => handleDeleteBerita(selectedBerita.id)}>Hapus Berita</button>
				</div>
			{/if}
		</div>
	</section></div>
{:else if showStatusIkm}
	<div class="page-peraturan-container"><section class="section">
		<button type="button" class="btn-back" onclick={goBack}>← Kembali ke Beranda</button>
		<div class="section-header"><h2>Cek Status IKM</h2><span class="hdr-line"></span><p>Masukkan nama mahasiswa untuk mengecek status IKM.</p></div>
		<div style="max-width: 800px; margin: 0 auto; text-align: center"><input type="text" class="search-input" placeholder="Cari nama mahasiswa..." value={searchIkm} oninput={(e) => (searchIkm = val(e))} /></div>
		<div class="status-table-container"><table class="status-table"><thead><tr><th>Nama</th><th>Jurusan</th><th>Nilai</th><th>Status</th>{#if isAdmin}<th>Aksi</th>{/if}</tr></thead><tbody>
			{#if searchIkm.trim() === ''}
				<tr><td colspan={isAdmin ? 5 : 4} style="text-align: center; padding: 24px; color: var(--mute)">Masukkan nama mahasiswa untuk mencari data.</td></tr>
			{:else if loadingIkm}
				<tr><td colspan={isAdmin ? 5 : 4} style="text-align: center; padding: 24px; color: var(--mute)">Mencari data...</td></tr>
			{:else if errorIkm}
				<tr><td colspan={isAdmin ? 5 : 4} style="text-align: center; padding: 24px; color: var(--status-error); font-weight: 700">Gagal memuat data: {errorIkm}</td></tr>
			{:else if ikmData.length > 0}
				{#each ikmData as item, index (index)}
					<tr>
						<td>{item.nama}</td><td>{item.jurusan}</td>
						<td>{#if isAdmin && editingIkmId === item.id}<input type="number" step="0.01" class="nilai-input" value={editingNilai} oninput={(e) => (editingNilai = val(e))} />{:else}{item.nilai}{/if}</td>
						<td>{#if item.status === 'AKTIF'}<span class="status-highlight-aktif">AKTIF</span>{:else}<span class="status-highlight-pasif">PASIF</span>{/if}</td>
						{#if isAdmin}<td><div class="action-cell">{#if editingIkmId === item.id}<button type="button" class="btn-edit" onclick={() => handleSaveIkm(item)} disabled={updatingIkm}>{updatingIkm ? 'Menyimpan...' : 'Simpan'}</button><button type="button" class="btn-delete" onclick={handleCancelEditIkm} disabled={updatingIkm}>Batal</button>{:else}<button type="button" class="btn-edit" onclick={() => handleEditIkm(item)}>Edit Nilai</button>{/if}</div></td>{/if}
					</tr>
				{/each}
			{:else}
				<tr><td colspan={isAdmin ? 5 : 4} style="text-align: center; padding: 24px; color: var(--mute)">Data tidak ditemukan.</td></tr>
			{/if}
		</tbody></table></div>
	</section></div>
{:else if showAboutUs}
	<div class="page-peraturan-container"><section class="section">
		<button type="button" class="btn-back" onclick={goBack}>← Kembali ke Beranda</button>
		<div class="section-header"><h2>About Us</h2><span class="hdr-line"></span><p>Kepengurusan Badan Perwakilan Mahasiswa FIA UI</p></div>
		<div style="display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 700px; padding: 40px 0">
			<p style="font-style: italic; margin-bottom: 32px; color: var(--mute); font-family: var(--font-body); font-size: 16px; text-align: center">Swipe ke kanan atau kiri untuk melihat foto setiap divisi/komisi</p>
			<ImageSwiper images={['/assets/pi.webp', '/assets/kominfo.webp', '/assets/kokum.webp']} />
		</div>
	</section></div>
{:else if selectedPeraturan}
	<div class="page-peraturan-container"><section class="section">
		<button type="button" class="btn-back" onclick={goBack}>← Kembali ke Daftar Peraturan</button>
		<div class="detail-layout">
			<h1 class="detail-title">{selectedPeraturan.judul}</h1>
			<div class="info-box">
				<div class="info-row"><div class="info-label">Judul</div><div class="info-value">{selectedPeraturan.judul}</div></div>
				<div class="info-row"><div class="info-label">Jenis Dokumen</div><div class="info-value">{selectedPeraturan.jenis_dokumen}</div></div>
				<div class="info-row"><div class="info-label">Tahun</div><div class="info-value">{selectedPeraturan.tahun}</div></div>
				<div class="info-row"><div class="info-label">Tanggal Penetapan</div><div class="info-value">{formatTanggal(selectedPeraturan.tgl_penetapan)}</div></div>
				<div class="info-row"><div class="info-label">Tempat Penetapan</div><div class="info-value">{selectedPeraturan.tempat_penetapan}</div></div>
				<div class="info-row"><div class="info-label">Tanggal Berlaku</div><div class="info-value">{formatTanggal(selectedPeraturan.tgl_berlaku)}</div></div>
				<div class="info-row"><div class="info-label">Status</div><div class="info-value"><span class="status-badge {selectedPeraturan.status === 'Berlaku' ? 'status-berlaku' : selectedPeraturan.status === 'Dicabut' ? 'status-dicabut' : 'status-diubah'}">{selectedPeraturan.status}</span></div></div>
			</div>
			<div class="action-buttons">
				<button type="button" class="action-btn primary" disabled={!selectedPeraturan.pdf_url} onclick={() => openPdf(selectedPeraturan.pdf_url)}>View Document</button>
				<button type="button" class="action-btn primary" disabled={!selectedPeraturan.pdf_url} onclick={() => handleDownload(selectedPeraturan.pdf_url, selectedPeraturan.judul + '.pdf')}>Download</button>
			</div>
			<h2 class="sub-heading">PERUBAHAN PERATURAN TERBARU</h2>
			{#if selectedPeraturan.perubahan_tipe}<p class="amendment-text"><strong>{selectedPeraturan.perubahan_tipe}:</strong> {selectedPeraturan.perubahan_teks || '-'}</p>{:else}<p class="amendment-text" style="color: var(--mute)">Belum ada perubahan untuk dokumen ini.</p>{/if}
		</div>
	</section></div>
{:else}
	<div class="page-peraturan-container"><section class="section">
		<button type="button" class="btn-back" onclick={goToHome}>← Kembali ke Beranda</button>
		<div class="section-header" style="display: flex; justify-content: space-between; align-items: center">
			<div style="text-align: left"><h2>Semua Peraturan</h2><span class="hdr-line"></span><p>Daftar lengkap peraturan yang dikeluarkan oleh BPM FIA UI</p></div>
			{#if isAdmin}<button type="button" class="btn-admin-action" onclick={openAddForm} title="Tambah Peraturan">+</button>{/if}
		</div>
		<div class="filter-grid">
			<input type="text" class="filter-item" placeholder="Cari berdasarkan Judul..." value={searchJudul} oninput={(e) => (searchJudul = val(e))} />
			<select class="filter-item" value={filterJenis} onchange={(e) => (filterJenis = val(e))}><option value="">Semua Jenis</option>{#each jenisDokumenList as j (j)}<option value={j}>{j}</option>{/each}</select>
			<select class="filter-item" value={filterTahun} onchange={(e) => (filterTahun = val(e))}><option value="">Semua Tahun</option>{#each tahunList as t (t)}<option value={t}>{t}</option>{/each}</select>
			<select class="filter-item" value={filterStatus} onchange={(e) => (filterStatus = val(e))}><option value="">Semua Status</option>{#each statusList as s (s)}<option value={s}>{s}</option>{/each}</select>
		</div>
		{#if loadingPeraturan}
			<p style="text-align: center; margin-top: 32px; color: var(--mute)">Memuat data...</p>
		{:else if currentData.length > 0}
			<div class="cards-grid">
				{#each currentData as item (item.id)}
					<div class="card">
						<div class="card-header"><span>{item.jenis_dokumen}</span><span class="card-date">{formatTanggal(item.tgl_penetapan)}</span></div>
						<div class="card-body"><h3 class="card-title">{item.judul}</h3><button type="button" class="btn-outline" onclick={() => viewDetail(item)}>View</button>{#if isAdmin}<div class="card-actions"><button type="button" class="btn-edit" onclick={() => openEditForm(item)}>Edit</button><button type="button" class="btn-delete" onclick={() => handleDelete(item.id)}>Hapus</button></div>{/if}</div>
					</div>
				{/each}
			</div>
		{:else}
			<p style="text-align: center; margin-top: 32px; color: var(--mute)">Tidak ada peraturan yang sesuai dengan pencarian.</p>
		{/if}
		{#if totalPages > 1}
			<div class="pagination-container">
				<button type="button" onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} class="pagination-btn">Sebelumnya</button>
				{#each Array.from({ length: totalPages }) as _, i (i)}<button type="button" onclick={() => handlePageChange(i + 1)} class="pagination-btn {currentPage === i + 1 ? 'active' : ''}">{i + 1}</button>{/each}
				<button type="button" onclick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} class="pagination-btn">Berikutnya</button>
			</div>
		{/if}
		{#if totalItems > 0}
			<p class="pagination-info">Menampilkan {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} peraturan</p>
		{/if}
	</section></div>
{/if}

<!-- ============ FOOTER ============ -->
<footer class="footer" id="kontak">
	<div class="footer-grid">
		<div class="footer-about"><h3>BPM FIA UI</h3><p>Badan Perwakilan Mahasiswa Fakultas Ilmu Administrasi Universitas Indonesia merupakan lembaga perwakilan mahasiswa yang berfungsi sebagai legislator, aspirator, dan kontrol terhadap lembaga eksekutif mahasiswa.</p>
			<div class="social-links">
				<a href="https://www.instagram.com/bpmfiaui?igsh=ZHlraXVuMjR6eHE0" target="_blank" rel="noopener noreferrer" title="Instagram"><svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></a>
				<a href="https://x.com/BPMFIAUI" target="_blank" rel="noopener noreferrer" title="X / Twitter"><svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
				<a href="https://lin.ee/pteZwX4" target="_blank" rel="noopener noreferrer" title="Line"><img src="/assets/line.png" alt="Line" width="20" height="20" style="filter: brightness(0) invert(1)" /></a>
			</div>
		</div>
		<div class="footer-links"><h4>Navigasi</h4><ul><li><a href="#" onclick={(e) => { e.preventDefault(); goToHome(); }}>Beranda</a></li><li><a href="#" onclick={(e) => { e.preventDefault(); goToAllPeraturan(); }}>Peraturan</a></li><li><a href="#" onclick={(e) => { e.preventDefault(); goToBerita(); }}>Berita</a></li><li><a href="#" onclick={(e) => { e.preventDefault(); goToAboutUs(); }}>About Us</a></li><li><a href="#" onclick={(e) => { e.preventDefault(); goToStatusIkm(); }}>Cek Status IKM</a></li><li><a href="#" onclick={(e) => { e.preventDefault(); goToKontak(); }}>Kontak</a></li></ul></div>
		<div class="footer-links"><h4>Kontak</h4><ul><li><a href="https://maps.app.goo.gl/EXW9DaKNgcBmMQ9p9" target="_blank" rel="noopener noreferrer">Gedung M FIA UI, Depok</a></li><li><a href="https://maps.app.goo.gl/J6nVMzbrYQbwysQCA" target="_blank" rel="noopener noreferrer">Gedung Baru FIA UI</a></li><li><a href="mailto:reformasibpmfiaui@gmail.com">reformasibpmfiaui@gmail.com</a></li></ul></div>
	</div>
	<div class="footer-bottom">BPM FIA UI</div>
</footer>

