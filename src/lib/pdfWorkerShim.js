// Shim worker pdfjs — PENTING iOS:
// Polyfill di main thread TIDAK menjangkau worker (WorkerGlobalScope punya
// konteks global sendiri). pdfjs worker memakai Promise.withResolvers yang
// tidak ada di Safari/iOS 15.8 → worker gagal dengan 'Promise.withResolvers
// is not a function'. File ini di-bundle oleh Vite sebagai worker (?worker&url)
// bersama kode worker pdfjs — polyfill dieksekusi PERTAMA di konteks worker.
if (typeof Promise.withResolvers === 'undefined') {
	Promise.withResolvers = function () {
		/** @type {(value: unknown) => void} */
		let resolve = () => {};
		/** @type {(reason?: unknown) => void} */
		let reject = () => {};
		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	};
}

import 'pdfjs-dist/build/pdf.worker.min.mjs';
