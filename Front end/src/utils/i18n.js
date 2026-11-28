export const TRANSLATIONS = {
  id: {
    // Document & App Shell
    'app.pageTitle': 'Sabah Bogor - Arahin Kamu ke Wisata Kota Bogor',
    'app.srTitle': 'SIG Wisata Bogor',
    'app.adminRedirectTitle': 'Mengarahkan ke Panel Admin...',
    'app.adminRedirectDesc': 'Anda sedang dialihkan ke sistem manajemen destinasi backend di',
    'app.openAdminPanel': 'Buka Panel Admin',
    'app.backToMap': 'Kembali ke Peta',
    'app.serverDisconnected': 'Koneksi ke server terputus',
    'app.serverHintBefore': 'Jalankan server Laravel (',
    'app.serverHintAfter': ') untuk memuat destinasi.',
    'app.retryConnectAria': 'Coba hubungkan ulang ke backend',
    'app.loadingShort': 'Memuat...',
    'app.retry': 'Coba lagi',
    'app.closeBannerAria': 'Tutup peringatan backend',
    'app.errorBoundaryTitle': 'Terjadi Kendala Memuat Aplikasi',
    'app.errorBoundaryDesc': 'Silakan muat ulang halaman untuk melanjutkan.',
    'app.reloadPage': 'Muat Ulang Halaman',

    // Bottom Navigation
    'nav.mainAria': 'Navigasi utama',
    'nav.explore': 'Explore',
    'nav.forYou': 'Untuk Anda',
    'nav.navigation': 'Navigasi',
    'nav.saved': 'Tersimpan',
    'nav.activity': 'Aktivitas',

    // Common
    'common.cancel': 'Batal',
    'common.close': 'Tutup',
    'common.closeDialog': 'Tutup dialog',
    'common.save': 'Simpan',
    'common.saved': 'Tersimpan',
    'common.saveChanges': 'Simpan Perubahan',
    'common.saving': 'Menyimpan...',
    'common.back': 'Kembali',
    'common.retry': 'Coba lagi',
    'common.reload': 'Muat ulang',
    'common.reset': 'Reset',
    'common.resetFilter': 'Reset filter',
    'common.processing': 'Memproses...',
    'common.deleting': 'Menghapus...',
    'common.deleteConfirm': 'Ya, Hapus',
    'common.continue': 'Lanjutkan',
    'common.edit': 'Edit',
    'common.delete': 'Hapus',
    'common.share': 'Bagikan',
    'common.linkCopied': 'Tautan tersalin',
    'common.scrollToTop': 'Kembali ke atas',
    'common.bogorWestJava': 'Bogor, Jawa Barat',
    'common.bogorCityWestJava': 'Kota Bogor, Jawa Barat',
    'common.notAvailable': 'Belum tersedia',
    'common.checkOnSite': 'Cek di lokasi',
    'common.enableGps': 'Aktifkan GPS',
    'common.free': 'Gratis',
    'common.justNow': 'Baru saja',
    'common.defaultUser': 'Pengguna',
    'common.destinationFallback': 'Destinasi wisata',

    // Explore / Sidebar / Search / Filter
    'explore.sidebarLabel': 'Daftar tempat wisata',
    'explore.closeSidebarAria': 'Tutup panel daftar wisata',
    'explore.openSidebarAria': 'Buka panel daftar wisata',
    'explore.closeSidebarTitle': 'Tutup panel wisata',
    'explore.openSidebarTitle': 'Buka panel wisata',
    'explore.sheetCollapseAria': 'Geser ke bawah atau ketuk untuk menurunkan daftar wisata',
    'explore.sheetExpandAria': 'Geser ke atas atau ketuk untuk membuka daftar wisata',
    'explore.sheetCollapseTitle': 'Tarik ke bawah atau klik untuk melipat panel',
    'explore.sheetExpandTitle': 'Tarik ke atas atau klik untuk membuka penuh panel',
    'explore.desktopExpandAria': 'Buka penuh daftar wisata',
    'explore.desktopCollapseAria': 'Lipat panel sidebar ke bawah',
    'explore.desktopExpandTitle': 'Perluas panel wisata',
    'explore.desktopCollapseTitle': 'Lipat panel ke bawah',
    'explore.searchPlaceholder': 'Cari destinasi wisata di Bogor',
    'explore.clearSearchAria': 'Hapus pencarian',
    'explore.filterBtnAriaActive': 'Filter destinasi ({count} filter aktif)',
    'explore.filterBtnAria': 'Buka filter destinasi lanjutan',
    'explore.filterBtnTitle': 'Filter destinasi lanjutan',
    'explore.categoryTabsAria': 'Filter kategori',
    'explore.filterDialogTitle': 'Filter Destinasi',
    'explore.filterCloseAria': 'Tutup panel filter',
    'explore.filterCategory': 'Kategori',
    'explore.filterMinRating': 'Rating Minimum',
    'explore.filterRadius': 'Radius Terdekat',
    'explore.filterNeedsGps': 'Perlu GPS aktif',
    'explore.filterPreferences': 'Preferensi',
    'explore.filterOnlyPopular': 'Hanya Populer',
    'explore.filterMyFavorites': 'Favorit Saya',
    'explore.filterShowCount': 'Tampilkan ({count})',
    'explore.popularHeading': 'Populer dengan pengunjung',
    'explore.loadingDestinations': 'Memuat destinasi...',
    'explore.destinationsLabel': 'Tujuan wisata',
    'explore.sortAria': 'Urutan daftar: {sort}. Klik untuk mengubah',
    'explore.sortListAria': 'Pilihan pengurutan destinasi',
    'explore.sortRelevant': 'Paling relevan',
    'explore.sortHighestRated': 'Rating tertinggi',
    'explore.sortNearest': 'Jarak terdekat',
    'explore.sortPopular': 'Terpopuler',
    'explore.loadFailedTitle': 'Daftar destinasi gagal dimuat',
    'explore.loadFailedDesc': 'Pastikan server backend aktif lalu muat ulang data wisata.',
    'explore.connecting': 'Menghubungkan...',
    'explore.noMatch': 'Tidak ada tempat wisata yang cocok.',
    'explore.activeOnMap': 'Aktif di peta',
    'explore.shareText': 'Lihat destinasi {name} di Sabah Bogor',
    'explore.shareCopiedAria': 'Tautan {name} tersalin',
    'explore.sharePlaceAria': 'Bagikan {name}',
    'explore.removeFavAria': 'Hapus {name} dari favorit',
    'explore.addFavAria': 'Simpan {name} ke favorit',
    'explore.backToList': 'Kembali ke daftar',
    'explore.address': 'Alamat',
    'explore.aboutDestination': 'Tentang destinasi',
    'explore.placeNotFound': 'Tempat wisata tidak ditemukan.',

    // Map & Navigation
    'map.sectionAria': 'Peta wisata Bogor',
    'map.navGuideAria': 'Petunjuk navigasi',
    'map.navGuideText':
      'Pilih destinasi di menu Explore atau susun Rute Custom untuk mulai navigasi.',
    'map.endJourney': 'Akhiri perjalanan',
    'map.transitBadge': 'Lokasi transit',
    'map.viewDetailAria': 'Lihat detail {name}',
    'map.startBtn': 'Mulai',
    'map.startNavAria': 'Mulai perjalanan ke {name}',
    'map.openHudDetailAria': 'Lihat detail tujuan {name}',
    'map.routeBtn': 'Rute',
    'map.detailBtn': 'Detail',
    'map.distanceFromYou': '{distance} dari posisi Anda',
    'map.distanceWithEta': '{distance} dari posisi Anda · Estimasi {eta}',
    'map.gpsOffHint': 'Aktifkan izin lokasi GPS untuk melihat jarak dari posisi Anda',
    'map.gpsOff': 'GPS nonaktif',
    'map.gpsSearching': 'GPS...',
    'map.yourLocationAria': 'Posisi Kamu',
    'map.clusterTooltip': '{count} Objek Wisata: {names}',
    'map.clusterMore': ' +{count} lainnya',
    'map.locateShow': 'Tampilkan lokasi Anda',
    'map.locateDenied': 'Izin lokasi ditolak di browser',
    'map.locateCenter': 'Pusatkan ke lokasi Anda',
    'map.switch2DAria': 'Beralih ke tampilan datar 2D',
    'map.switch3DAria': 'Beralih ke tampilan miring 3D',
    'map.mode3DTitle': 'Mode 3D Aktif (Klik untuk 2D Datar)',
    'map.mode2DTitle': 'Mode 2D Aktif (Klik untuk 3D Miring)',
    'map.hideBoundaryAria': 'Sembunyikan Batas Wilayah Kota Bogor',
    'map.showBoundaryAria': 'Tampilkan Batas Wilayah Kota Bogor',
    'map.boundaryOnTitle': 'Batas Wilayah Kota Bogor: Aktif (Klik untuk nonaktifkan)',
    'map.boundaryOffTitle': 'Batas Wilayah Kota Bogor: Nonaktif (Klik untuk aktifkan)',
    'map.disableClusterAria': 'Nonaktifkan Pengelompokan Marker (Cluster)',
    'map.enableClusterAria': 'Aktifkan Pengelompokan Marker (Cluster)',
    'map.clusterOnTitle': 'Marker Clustering: Aktif (Klik untuk nonaktifkan)',
    'map.clusterOffTitle': 'Marker Clustering: Nonaktif (Klik untuk aktifkan)',
    'map.metricsAria': 'Panel perkiraan rute navigasi',
    'map.activeNavBadge': 'Navigasi aktif',
    'map.customRouteBadge': 'Rute custom',
    'map.customRouteFallback': 'Rute custom wisata',
    'map.routeJoinWord': ' ke ',
    'map.pointFallback': 'Titik',
    'map.calculating': 'Menghitung...',
    'map.totalEstimate': 'Estimasi total:',
    'map.estimate': 'Estimasi:',
    'map.totalDistance': 'Jarak total:',
    'map.distance': 'Jarak:',
    'map.gpsFallbackMulti': 'GPS nonaktif · estimasi dihitung antar titik rute',
    'map.gpsFallbackSingle': 'GPS nonaktif · estimasi dari Pusat Kota Bogor',
    'map.routeSelectorAria': 'Pilihan jalur rute',
    'map.routeOptionLabel': 'Rute {index}',
    'map.routeOptionAria': 'Pilih Rute {index}, estimasi {time}, jarak {distance}',
    'map.trafficAria': 'Kondisi lalu lintas Bogor: {status}',
    'map.trafficSmooth': 'Lalu lintas lancar',
    'map.trafficMorningRush': 'Potensi padat jam sibuk',
    'map.trafficEveningRush': 'Potensi padat jam sibuk',
    'map.trafficWeekend': 'Potensi padat akhir pekan',
    'map.trafficWeekendPeak': 'Padat akhir pekan',
    'map.trafficExtraMin': '+{min} mnt',
    'map.adminZoomIn': 'Perbesar peta',
    'map.adminZoomOut': 'Perkecil peta',
    'map.adminCenterBogor': 'Pusatkan ke Kota Bogor',
    'map.adminCenterPinAria': 'Pusatkan pin ke Kota Bogor',
    'map.adminMapHint': 'Klik peta atau geser pin untuk akurasi',

    // Tourist Detail Page
    'detail.notFoundTitle': 'Data tempat wisata tidak ditemukan.',
    'detail.notFoundDesc':
      'Pilih destinasi lain melalui halaman Explore untuk melihat informasi lengkapnya.',
    'detail.backToMap': 'Kembali ke peta',
    'detail.shareAria': 'Bagikan tempat ini',
    'detail.removeFavoriteAria': 'Hapus dari favorit',
    'detail.addFavoriteAria': 'Tambah ke favorit',
    'detail.shareText': '{name} - Rekomendasi wisata di Bogor',
    'detail.actionsAria': 'Aksi navigasi destinasi',
    'detail.startJourney': 'Mulai perjalanan',
    'detail.openGoogleMaps': 'Buka di Google Maps',
    'detail.quickInfoAria': 'Informasi singkat tempat wisata',
    'detail.openingHours': 'Jam buka',
    'detail.ticketPrice': 'Tiket masuk',
    'detail.eta': 'Estimasi tiba',
    'detail.addressAria': 'Alamat tempat wisata',
    'detail.aboutTitle': 'Tentang destinasi',
    'detail.photosTitle': 'Foto lokasi',
    'detail.photosSaved': '{count} tersimpan',
    'detail.photosBadge': '{count} Foto',
    'detail.photosTapHint': 'Ketuk foto untuk memperbesar di galeri penuh',
    'detail.openGalleryAria': 'Buka galeri foto {name}, {count} foto',
    'detail.galleryPreviewAria': 'Preview galeri {name}',
    'detail.zoomPhotoAria': 'Perbesar foto {index} dari {total}',
    'detail.lightboxAria': 'Galeri foto {name}',
    'detail.closeGalleryAria': 'Tutup galeri foto',
    'detail.prevPhotoAria': 'Foto sebelumnya',
    'detail.nextPhotoAria': 'Foto berikutnya',
    'detail.viewPhotoAria': 'Lihat foto {index}',
    'detail.selectPhotoAria': 'Pilih foto {index} dari {total}',
    'detail.photoAlt': '{name} - foto {index} dari {total}',
    'detail.similarHeading': 'Destinasi Serupa di Sekitar',
    'detail.nearest': 'Terdekat',
    'detail.autoDescNature':
      '{name} merupakan destinasi wisata alam populer di kawasan Bogor dengan suasana sejuk dan lanskap asri yang menarik untuk dikunjungi bersama keluarga maupun teman.',
    'detail.autoDescCulinary':
      '{name} adalah destinasi kuliner pilihan di kawasan Bogor yang menyajikan beragam hidangan menarik dengan suasana nyaman untuk bersantai bersama keluarga maupun teman.',
    'detail.autoDescEducation':
      '{name} merupakan wisata edukasi dan budaya unggulan di kawasan Bogor yang memadukan rekreasi serta wawasan menarik untuk dikunjungi bersama keluarga maupun teman.',
    'detail.autoDescGeneric':
      'Destinasi wisata dan pusat aktivitas populer di kawasan Bogor yang menarik untuk dikunjungi bersama keluarga maupun teman.',

    // For You Page
    'foryou.title': 'Untuk Anda',
    'foryou.subtitleLoggedIn': 'Dipersonalisasi untuk {name}',
    'foryou.subtitleDefaultName': 'perjalanan Anda',
    'foryou.subtitleGuest': 'Kurasi tempat wisata unggulan di sekitar Bogor',
    'foryou.openProfileAria': 'Buka profil pengguna',
    'foryou.signInAria': 'Masuk ke akun',
    'foryou.guestTitle': 'Simpan rute dan personalisasi rekomendasi Anda',
    'foryou.guestDesc':
      'Masuk ke akun Sabah Bogor untuk menyelaraskan tempat favorit, melanjutkan tempat terakhir dilihat, dan menyusun urutan rekomendasi sesuai minat Anda.',
    'foryou.guestCta': 'Masuk ke akun',
    'foryou.curatedHeading': 'Rekomendasi Pilihan di Bogor',
    'foryou.curatedDesc':
      'Destinasi terpopuler yang siap dikunjungi atau langsung diarahkan di peta',
    'foryou.loadErrorTitle': 'Daftar rekomendasi belum bisa dimuat',
    'foryou.loadErrorAuthTitle': 'Rekomendasi belum bisa dimuat',
    'foryou.loadErrorDesc': 'Periksa sambungan ke server backend lalu coba muat ulang.',
    'foryou.emptyAvailable': 'Belum ada destinasi yang tersedia untuk ditampilkan.',
    'foryou.continueHeading': 'Lanjutkan perjalanan',
    'foryou.continueDesc': 'Destinasi terakhir yang Anda buka',
    'foryou.lastViewed': 'Terakhir dilihat',
    'foryou.continueRoute': 'Lanjutkan rute',
    'foryou.personalizedHeading': 'Berdasarkan Minat & Riwayatmu',
    'foryou.personalizedFallbackDesc':
      'Menampilkan destinasi unggulan di Bogor selagi riwayat perjalanan Anda terkumpul',
    'foryou.personalizedDesc':
      'Disusun dari tempat favorit, aktivitas, dan riwayat penelusuran Anda',
    'foryou.emptyRecs': 'Belum ada rekomendasi tersedia saat ini.',
    'foryou.distanceFromYou': '{distance} dari Anda',
    'foryou.viewDetail': 'Lihat detail',
    'foryou.routeBtn': 'Rute',
    'foryou.quickRouteAria': 'Mulai rute cepat ke {name}',

    // Saved Activities Page
    'saved.title': 'Aktivitas Tersimpan',
    'saved.subtitle': 'Koleksi destinasi favorit, rute custom, dan catatan perjalanan Anda',
    'saved.addActivityTitle': 'Tambah Aktivitas Perjalanan Baru',
    'saved.addActivityAria': 'Tambah aktivitas',
    'saved.notifTitle': 'Notifikasi',
    'saved.notifAria': 'Lihat notifikasi',
    'saved.profileAria': 'Profil pengguna',
    'saved.guestTitle': 'Album & Koleksi Tersimpan',
    'saved.guestDesc':
      'Masuk untuk melihat dan menyimpan tempat wisata favorit, rute custom, serta catatan aktivitas perjalanan Anda.',
    'saved.guestCta': 'Masuk ke Akun',
    'saved.sortPrefix': 'Urutkan: {option}',
    'saved.sortLatest': 'Terbaru',
    'saved.sortOldest': 'Terlama',
    'saved.sortNameAZ': 'Nama A-Z',
    'saved.folderRecentTitle': 'Terakhir dilihat',
    'saved.folderRoutesTitle': 'Rute custom',
    'saved.folderFavoritesTitle': 'Favorit',
    'saved.collectionsHeading': 'Koleksi',
    'saved.spotsCountSingle': '{count} tempat',
    'saved.spotsCount': '{count} tempat',
    'saved.routesAvailable': '{count} Rute Tersedia',
    'saved.routesCountSingle': '{count} rute tersimpan',
    'saved.routesCount': '{count} rute tersimpan',
    'saved.backToFoldersAria': 'Kembali ke daftar folder tersimpan',
    'saved.recentHeader': 'Terakhir Dilihat',
    'saved.recentSubtitle': 'Daftar tempat wisata yang baru saja Anda buka',
    'saved.recentEmptyTitle': 'Belum Ada Riwayat Dilihat',
    'saved.recentEmptyDesc':
      'Jelajahi destinasi di peta Explore untuk menyimpan jejak tempat yang pernah Anda lihat.',
    'saved.favoritesHeader': 'Tempat Wisata Favorit',
    'saved.favoritesSubtitle': '{count} tempat wisata favorit tersimpan',
    'saved.favoritesEmptyTitle': 'Belum Ada Wisata Favorit',
    'saved.favoritesEmptyDesc':
      'Simpan tempat wisata favoritmu dengan menekan ikon hati pada menu Explore.',
    'saved.myActivitiesHeading': 'Aktivitas Perjalanan Saya',
    'saved.recordedCount': '{count} tercatat',
    'saved.deleteActivityAria': 'Hapus aktivitas {name}',
    'saved.deleteActivityTitle': 'Hapus aktivitas',
    'saved.myActivitiesEmpty':
      'Belum ada aktivitas perjalanan tersimpan. Klik tombol tambah (+) di atas untuk menambahkan.',
    'saved.modalCloseAria': 'Tutup modal tambah aktivitas',
    'saved.modalTitle': 'Tambah Aktivitas Perjalanan Baru',
    'saved.modalDesc': 'Catat dan simpan rencana aktivitas wisata Anda',
    'saved.activityNameLabel': 'Nama Aktivitas',
    'saved.activityNamePlaceholder': 'Contoh: Bersepeda di Kebun Raya',
    'saved.activityLocationLabel': 'Lokasi Wisata',
    'saved.activityLocationPlaceholder': 'Contoh: Kebun Raya Bogor',
    'saved.notifSavedTitle': 'Aktivitas berhasil disimpan',
    'saved.notifSavedDesc': '"{name}" di {location} berhasil ditambahkan ke Aktivitas Tersimpan.',

    // Custom Routes Page
    'routes.title': 'Rute Custom',
    'routes.subtitle': 'Rute perjalanan tersimpan akun Anda',
    'routes.backAria': 'Kembali ke aktivitas tersimpan',
    'routes.createBtn': 'Buat Rute',
    'routes.createShortBtn': 'Buat',
    'routes.connectedBadge': 'Terhubung',
    'routes.activeSavedCount': '{count} rute perjalanan aktif tersimpan',
    'routes.primaryBadge': 'Rute Utama',
    'routes.stopsBadgeSingle': '{count} Tujuan',
    'routes.stopsBadge': '{count} Tujuan',
    'routes.deleteRouteAria': 'Hapus rute {title}',
    'routes.deleteRouteTitle': 'Hapus rute',
    'routes.startJourney': 'Mulai Perjalanan',
    'routes.emptyTitle': 'Belum Ada Rute Custom',
    'routes.emptyDesc':
      'Anda belum memiliki rute custom. Klik tombol "Buat Rute" di atas untuk merangkai perjalanan dari tempat wisata tersimpan Anda.',
    'routes.createModalCloseAria': 'Tutup modal rancang rute custom',
    'routes.createModalTitle': 'Rancang Rute Custom Baru',
    'routes.createModalDesc': 'Pilih destinasi wisata untuk menyusun rute perjalanan Anda',
    'routes.routeNameLabel': 'Nama Rute',
    'routes.routeNamePlaceholder': 'Contoh: Tur Budaya & Kebun Raya',
    'routes.chooseStopsLabel': 'Pilih destinasi singgah:',
    'routes.savedSpotsCount': '{count} tempat tersimpan',
    'routes.saveRouteBtn': 'Simpan Rute',
    'routes.deleteModalCloseAria': 'Tutup konfirmasi hapus rute',
    'routes.deleteModalTitle': 'Hapus Rute Custom?',
    'routes.deleteModalDesc': 'Rute "{title}" akan dihapus permanen dari daftar rute Anda.',
    'routes.stopStart': 'Titik Awal',
    'routes.stopStartShort': 'Titik awal',
    'routes.stopEnd': 'Destinasi Akhir',
    'routes.stopTransit': 'Transit {index}',
    'routes.newlyCreatedDesc': 'Rute baru dibuat oleh Anda',
    'routes.notifCreatedTitle': 'Rute custom baru: {title}',
    'routes.notifCreatedDesc':
      '{count} destinasi wisata ({distance}) berhasil ditambahkan ke Rute Custom.',
    'routes.notifDeletedTitle': 'Rute custom berhasil dihapus',
    'routes.notifDeletedDesc': 'Rute "{title}" telah dihapus dari daftar rute tersimpan.',

    // Activities Page
    'activities.title': 'Aktivitas',
    'activities.subtitle': 'Bagikan momen perjalanan wisata dan jelajahi cerita komunitas Bogor',
    'activities.notifTitle': 'Lihat notifikasi',
    'activities.notifAria': 'Notifikasi aktivitas',
    'activities.filterAria': 'Filter aktivitas',
    'activities.tabYou': 'Kamu',
    'activities.tabCommunity': 'Komunitas',
    'activities.postBtn': 'Post',
    'activities.postBtnTitle': 'Posting foto aktivitas perjalanan',
    'activities.postBtnAria': 'Posting foto perjalanan',
    'activities.guestTitle': 'Aktivitas Perjalanan Anda',
    'activities.guestDesc':
      'Masuk untuk melihat dan membagikan dokumentasi perjalanan wisata pribadi Anda di Bogor.',
    'activities.loadErrorTitle': 'Aktivitas belum bisa dimuat',
    'activities.loadErrorDesc': 'Periksa sambungan ke server backend lalu coba muat ulang.',
    'activities.myCountSuffix': 'aktivitas Anda bulan ini',
    'activities.communityCountSuffix': 'cerita perjalanan komunitas',
    'activities.emptyYouTitle': 'Belum Ada Postingan Aktivitas',
    'activities.emptyCommunityTitle': 'Belum Ada Postingan Komunitas',
    'activities.emptyYouDesc':
      'Ketuk tombol + Post di atas untuk membagikan pengalaman wisata pertama Anda.',
    'activities.emptyCommunityDesc': 'Belum ada kiriman perjalanan dari komunitas saat ini.',
    'activities.shareFirstPhoto': 'Bagikan Foto Pertama',
    'activities.viewProfileTitle': 'Lihat profil {name}',
    'activities.viewProfileTag': '(Lihat profil)',
    'activities.deleteMyTitle': 'Hapus aktivitas saya',
    'activities.deleteMyAria': 'Hapus aktivitas ini',
    'activities.postModalCloseAria': 'Tutup modal posting',
    'activities.postModalTitle': 'Posting Foto Perjalanan',
    'activities.postModalDesc': 'Bagikan pengalaman wisatamu ke komunitas Sabah Bogor',
    'activities.photoLabel': 'Foto Aktivitas',
    'activities.photoPreviewAlt': 'Preview Foto',
    'activities.changePhoto': 'Ganti Foto',
    'activities.pickPhoto': 'Pilih foto dari galeri',
    'activities.pickPhotoHint': 'Ketuk untuk unggah gambar JPG/PNG',
    'activities.locationLabel': 'Lokasi Wisata',
    'activities.locationPlaceholder': 'Misal: Curug Cikuluwung',
    'activities.captionLabel': 'Cerita / Keterangan',
    'activities.captionPlaceholder': 'Tuliskan pengalaman seru di tempat ini...',
    'activities.uploading': 'Mengunggah & Mengompresi...',
    'activities.shareToCommunity': 'Bagikan ke Komunitas',
    'activities.deleteModalCloseAria': 'Tutup konfirmasi hapus aktivitas',
    'activities.deleteModalTitle': 'Hapus Aktivitas?',
    'activities.deleteModalDesc': 'Postingan aktivitas ini akan dihapus secara permanen.',
    'activities.notifDeletedTitle': 'Postingan berhasil dihapus',
    'activities.notifDeletedDesc': 'Cerita aktivitas Anda telah dihapus dari linimasa.',
    'activities.notifPostedTitle': 'Cerita dibagikan ke komunitas',
    'activities.notifPostedDesc':
      '"{title}" di {location} berhasil dipublikasikan di linimasa Aktivitas.',

    // Profile Header & Identity
    'profile.titleSelf': 'Profil Saya',
    'profile.titleOther': 'Profil Penjelajah',
    'profile.backAria': 'Kembali ke halaman sebelumnya',
    'profile.openSettingsAria': 'Buka pengaturan',
    'profile.defaultUser': 'Pengguna',
    'profile.changeAvatarAria': 'Ganti foto profil',
    'profile.statusActive': 'Penjelajah Aktif',
    'profile.statusExplorer': 'Petualang Alam Bogor',
    'profile.defaultBio': 'Penjelajah wisata alam dan kuliner Kota Bogor.',
    'profile.editProfile': 'Edit Profil',
    'profile.following': 'Mengikuti',
    'profile.followAction': 'Ikuti Perjalanan',
    'profile.statRoutes': 'Rute Custom',
    'profile.statFollowers': 'Pengikut',
    'profile.statFollowing': 'Mengikuti',
    'profile.myRoutesTitle': 'Rute Saya',
    'profile.myRoutesSubtitle': 'Koleksi rute siap navigasi dari akun Anda',
    'profile.savedRoutesCount': '{count} Rute',
    'profile.routeDefaultSummary': 'Rute kustom buatan Anda',
    'profile.stopsCount': '{count} destinasi wisata',
    'profile.startRoute': 'Mulai Navigasi Rute',
    'profile.emptyRoutesTitle': 'Belum Ada Rute Tersimpan',
    'profile.emptyRoutesDesc':
      'Anda belum memiliki rute kustom. Rancang rute perjalanan Anda di tab Tersimpan.',
    'profile.recentActivities': 'Aktivitas Terkini {name}',
    'profile.activitiesCount': '{count} Aktivitas',
    'profile.justNow': 'Baru saja',
    'profile.deleteActivityAria': 'Hapus aktivitas ini',
    'profile.emptyActivitiesTitle': 'Belum Ada Aktivitas Terkini',
    'profile.emptyActivitiesDesc': '{name} belum membagikan momen perjalanan terbarunya.',
    'profile.deleteModalTitle': 'Hapus Aktivitas?',
    'profile.deleteModalDesc': 'Postingan aktivitas ini akan dihapus secara permanen.',
    'profile.deleteConfirm': 'Ya, Hapus',
    'profile.deleting': 'Menghapus...',
    'profile.logoutModalTitle': 'Kamu yakin ingin keluar?',
    'profile.logoutModalDesc':
      'Rute tersimpan dan catatan perjalananmu akan tetap aman tersimpan di akun ini.',
    'profile.logoutConfirm': 'Ya, Keluar',
    'profile.followNotifTitle': 'Mulai mengikuti {name}',
    'profile.followNotifDesc':
      'Anda kini terhubung dengan {name} di komunitas penjelajah Bogor.',
    'profile.avatarNotifTitle': 'Foto profil berhasil diperbarui',
    'profile.avatarNotifDesc': 'Perubahan foto profil akun Anda telah tersimpan.',

    // Settings Sheet
    'settings.title': 'Pengaturan',
    'settings.closeAria': 'Tutup pengaturan',
    'settings.sectionLanguage': 'Bahasa Aplikasi',
    'settings.languageLabel': 'Bahasa Tampilan',
    'settings.languageDesc': 'Ubah bahasa seluruh antarmuka aplikasi secara langsung',
    'settings.langId': 'Indonesia',
    'settings.langEn': 'English',
    'settings.sectionAccount': 'Akun',
    'settings.editProfileTitle': 'Edit Profil',
    'settings.editProfileDesc': 'Perbarui nama tampilan dan bio singkat Anda',
    'settings.changePasswordTitle': 'Ubah Kata Sandi',
    'settings.changePasswordDesc': 'Perbarui kata sandi untuk menjaga keamanan akun',
    'settings.sectionNavigation': 'Preferensi Navigasi',
    'settings.routeNotifTitle': 'Notifikasi Rute',
    'settings.routeNotifDesc': 'Ingatkan pembaruan dan status navigasi rute tersimpan',
    'settings.distanceUnitTitle': 'Satuan Jarak',
    'settings.distanceUnitDesc': 'Berlaku langsung pada seluruh jarak rute dan destinasi',
    'settings.unitKm': 'KM',
    'settings.unitMiles': 'Miles',
    'settings.sectionDanger': 'Zona Bahaya',
    'settings.logoutTitle': 'Keluar dari Akun',
    'settings.logoutDesc': 'Akhiri sesi aktif pada perangkat ini',
    'settings.nameLabel': 'Nama Lengkap',
    'settings.namePlaceholder': 'Masukkan nama lengkap Anda',
    'settings.bioLabel': 'Bio Singkat',
    'settings.bioPlaceholder': 'Ceritakan gaya perjalanan atau tempat favoritmu di Bogor...',
    'settings.nameRequired': 'Nama lengkap minimal 2 karakter.',
    'settings.profileSaveFailed': 'Gagal menyimpan perubahan profil.',
    'settings.currentPasswordLabel': 'Kata Sandi Saat Ini',
    'settings.currentPasswordPlaceholder': 'Masukkan kata sandi saat ini',
    'settings.newPasswordLabel': 'Kata Sandi Baru',
    'settings.newPasswordPlaceholder': 'Minimal 6 karakter',
    'settings.confirmPasswordLabel': 'Konfirmasi Kata Sandi Baru',
    'settings.confirmPasswordPlaceholder': 'Ulangi kata sandi baru',
    'settings.passwordMinError': 'Kata sandi baru minimal 6 karakter.',
    'settings.passwordMismatch': 'Konfirmasi kata sandi baru tidak cocok.',
    'settings.currentPasswordRequired': 'Kata sandi saat ini wajib diisi.',
    'settings.passwordSaveFailed': 'Gagal memperbarui kata sandi.',
    'settings.updatePasswordBtn': 'Perbarui Kata Sandi',
    'settings.showPasswordAria': 'Tampilkan kata sandi',
    'settings.hidePasswordAria': 'Sembunyikan kata sandi',

    // Toasts
    'toast.activityDeleted': 'Aktivitas berhasil dihapus.',
    'toast.activityDeleteFailed': 'Gagal menghapus aktivitas.',
    'toast.loginToFollow': 'Silakan masuk terlebih dahulu untuk mengikuti penjelajah.',
    'toast.followSuccess': 'Berhasil mengikuti {name}!',
    'toast.unfollowSuccess': 'Batal mengikuti {name}.',
    'toast.followFailed': 'Gagal memperbarui status follow.',
    'toast.invalidImageType': 'Harap pilih file gambar (JPG, PNG, WEBP).',
    'toast.avatarTooLarge': 'Ukuran foto profil maksimal 15 MB.',
    'toast.avatarUpdated': 'Foto profil berhasil diperbarui!',
    'toast.avatarFailed': 'Gagal mengunggah foto profil. Silakan coba lagi.',
    'toast.profileUpdated': 'Profil berhasil diperbarui!',
    'toast.passwordUpdated': 'Kata sandi berhasil diperbarui!',
    'toast.languageChanged': 'Bahasa aplikasi diubah ke Bahasa Indonesia.',
    'toast.distanceUnitChangedKm': 'Satuan jarak diubah ke Kilometer (KM).',
    'toast.distanceUnitChangedMi': 'Satuan jarak diubah ke Miles (MI).',
    'toast.routeNotifOn': 'Notifikasi rute diaktifkan.',
    'toast.routeNotifOff': 'Notifikasi rute dinonaktifkan.',

    // Auth / LoginModal
    'auth.logoAlt': 'Logo Sabah Bogor',
    'auth.closeRegisterAria': 'Tutup dialog pendaftaran',
    'auth.closeLoginAria': 'Tutup dialog login',
    'auth.registerTitle': 'Buat akun baru',
    'auth.loginTitle': 'Masuk ke akun',
    'auth.registerDesc':
      'Daftar akun Sabah Bogor untuk menyimpan rute perjalanan, favorit, dan dokumentasi wisata Anda.',
    'auth.loginDesc':
      'Simpan rute perjalanan custom, bagikan dokumentasi wisata, dan kelola daftar favorit Anda.',
    'auth.fullNameLabel': 'Nama Lengkap',
    'auth.fullNamePlaceholder': 'Nama lengkap Anda',
    'auth.emailLabel': 'Email',
    'auth.emailPlaceholder': 'nama@email.com',
    'auth.passwordLabel': 'Kata Sandi',
    'auth.passwordMinPlaceholder': 'Minimal 6 karakter',
    'auth.confirmPasswordLabel': 'Konfirmasi Kata Sandi',
    'auth.confirmPasswordPlaceholder': 'Ulangi kata sandi',
    'auth.loginIdentityLabel': 'Email atau username',
    'auth.loginPasswordLabel': 'Kata sandi',
    'auth.loginPasswordPlaceholder': 'Masukkan kata sandi',
    'auth.showPasswordAria': 'Tampilkan kata sandi',
    'auth.hidePasswordAria': 'Sembunyikan kata sandi',
    'auth.showConfirmAria': 'Tampilkan konfirmasi kata sandi',
    'auth.hideConfirmAria': 'Sembunyikan konfirmasi kata sandi',
    'auth.registerBtn': 'Daftar Akun',
    'auth.loginBtn': 'Masuk',
    'auth.orDivider': 'atau',
    'auth.googleRegister': 'Daftar dengan Google',
    'auth.googleLogin': 'Masuk dengan Google',
    'auth.haveAccount': 'Sudah punya akun?',
    'auth.noAccount': 'Belum punya akun?',
    'auth.switchLogin': 'Masuk',
    'auth.switchRegister': 'Daftar sekarang',
    'auth.laterBtn': 'Nanti saja',
    'auth.errNameMin': 'Nama lengkap minimal 2 karakter.',
    'auth.errInvalidEmail': 'Masukkan alamat email yang valid.',
    'auth.errPasswordMin': 'Kata sandi minimal 6 karakter.',
    'auth.errPasswordMismatch': 'Konfirmasi kata sandi belum cocok.',
    'auth.errIdentityRequired': 'Masukkan email atau username Anda.',
    'auth.errPasswordRequired': 'Masukkan kata sandi Anda.',
    'auth.errRegisterFailed': 'Pendaftaran gagal. Periksa kembali data yang dimasukkan.',
    'auth.errLoginFailed': 'Login gagal. Periksa kembali email dan kata sandi.',
    'auth.errMissingToken': 'Respons autentikasi server tidak menyertakan token yang valid.',
    'auth.errConnect': 'Gagal terhubung ke server autentikasi.',

    // Notifications Drawer
    'notif.title': 'Notifikasi',
    'notif.newCount': '{count} Baru',
    'notif.closeAria': 'Tutup notifikasi',
    'notif.unreadAria': 'Belum dibaca',
    'notif.emptyTitle': 'Belum ada pembaruan',
    'notif.emptyDesc':
      'Notifikasi akan muncul saat Anda menyimpan destinasi favorit, membuat rute custom, berinteraksi sosial, atau menyelesaikan aksi.',
    'notif.markAllRead': 'Tandai dibaca',
    'notif.savedTime': 'Tersimpan',
    'notif.favTitle': '{name} disimpan ke Tersimpan',
    'notif.favFallbackTitle': 'Destinasi disimpan ke Tersimpan',
    'notif.favDesc': '{category} di Bogor masuk daftar tersimpan Anda.',
    'notif.favFallbackDesc': 'Tempat wisata berhasil disimpan ke daftar tersimpan Anda.',

    // Mascot labels
    'mascot.default': 'Maskot Rusa Tutul Sabah Bogor',
    'mascot.confused': 'Maskot Rusa Tutul Sabah Bogor membawa kamera sambil bertanya',
    'mascot.takingPhoto': 'Maskot Rusa Tutul Sabah Bogor sedang memotret',
    'mascot.happy': 'Maskot Rusa Tutul Sabah Bogor bahagia memegang peta lipat',
    'mascot.goodbye': 'Maskot Rusa Tutul Sabah Bogor melambaikan tangan perpisahan',
    'mascot.admin': 'Maskot Rusa Tutul Admin Sabah Bogor memeriksa daftar wisata',
    'mascot.tapAria': 'Ketuk maskot Rusa Sabah Bogor untuk menyapa',
    'mascot.greet1': 'Halo! Siap jelajah Bogor hari ini?',
    'mascot.greet2': 'Udara curug Bogor lagi sejuk banget!',
    'mascot.greet3': 'Yuk mampir ke Kebun Raya atau Suryakencana!',
    'mascot.greet4': 'Selamat berpetualang, hati-hati di jalan!',

    // Interactive Motion & Gestures
    'motion.stackHeading': 'Jelajah Cepat Destinasi',
    'motion.stackHint': 'Geser atau ketuk tumpukan kartu untuk melihat destinasi berikutnya',
    'motion.stackRecentHeading': 'Tumpukan Terakhir Dilihat',
    'motion.stackRecentHint': 'Geser atau ketuk kartu untuk melihat riwayat destinasi',
    'motion.stackNextAria': 'Lihat kartu destinasi berikutnya',
    'motion.stackTapFlipAria': 'Ketuk atau geser untuk melewati {name}',
    'motion.pullRefreshHint': 'Tarik ke bawah untuk memperbarui',
    'motion.pullReleaseHint': 'Lepas untuk menyegarkan',
    'motion.pullRefreshed': 'Info destinasi diperbarui',
    'motion.exploreSwipeHint': 'Geser kartu untuk menyorot pin di peta',
    'motion.navActiveProgress': 'Menuju tujuan',

    // Admin SPA & Mascot Feedback
    'admin.title': 'Admin Wisata Bogor',
    'admin.subtitle': 'Kelola data spasial, informasi wisata, dan galeri destinasi',
    'admin.loadingDb': 'Memuat database...',
    'admin.dbCount': '{count} lokasi di database',
    'admin.mainMap': 'Peta utama',
    'admin.logout': 'Keluar',
    'admin.navAria': 'Navigasi admin',
    'admin.tabEdit': 'Edit lokasi',
    'admin.tabAdd': 'Tambah lokasi',
    'admin.tabList': 'Daftar wisata ({count})',
    'admin.editingNotice': 'Sedang mengedit:',
    'admin.cancelEdit': 'Batal edit',
    'admin.infoHeading': 'Informasi Lokasi',
    'admin.infoDesc': 'Lengkapi identitas destinasi, kategori peta, tarif masuk, dan alamat.',
    'admin.nameLabel': 'Nama tempat wisata',
    'admin.namePlaceholder': 'Contoh: Kebun Raya Bogor',
    'admin.categoryLabel': 'Kategori',
    'admin.ticketLabel': 'Harga tiket',
    'admin.ticketPlaceholder': 'Contoh: Rp 15.000 atau Gratis',
    'admin.ratingLabel': 'Rating awal (0.0 – 5.0)',
    'admin.visibilityLabel': 'Visibilitas',
    'admin.markPopular': 'Tandai wisata populer',
    'admin.addressLabel': 'Alamat',
    'admin.addressPlaceholder': 'Jl. Ir. H. Juanda No.13, Kota Bogor, Jawa Barat',
    'admin.descLabel': 'Deskripsi',
    'admin.descPlaceholder': 'Tulis gambaran singkat daya tarik wisata, fasilitas, dan suasana lokasi',
    'admin.hoursHeading': 'Jam Operasional',
    'admin.open24h': 'Buka 24 jam',
    'admin.openTime': 'Jam buka',
    'admin.closeTime': 'Jam tutup',
    'admin.openDaysLabel': 'Hari buka (Senin–Minggu)',
    'admin.daily': 'Setiap hari',
    'admin.weekdays': 'Senin–Jumat',
    'admin.weekends': 'Akhir pekan',
    'admin.selectDaysAria': 'Pilih hari operasional',
    'admin.savedFormat': 'Format tersimpan:',
    'admin.coordHeading': 'Titik Koordinat',
    'admin.coordDesc': 'Klik peta, geser pin, atau isi koordinat secara langsung.',
    'admin.photosHeading': 'Foto Lokasi',
    'admin.photosCount': '{count} foto',
    'admin.photosDesc': 'Unggah satu atau beberapa foto. Foto pertama menjadi sampul utama destinasi.',
    'admin.photosDropAria': 'Pilih atau seret beberapa foto lokasi',
    'admin.photosDropTitle': 'Klik atau seret beberapa foto ke sini',
    'admin.photosDropHint': 'JPG, PNG, WebP · Kompresi otomatis saat dipilih',
    'admin.primaryBadge': 'Utama',
    'admin.setPrimaryBtn': 'Jadikan utama',
    'admin.removePhotoAria': 'Hapus foto {index}',
    'admin.resetForm': 'Reset formulir',
    'admin.saveLocation': 'Simpan Lokasi',
    'admin.searchPlaceholder': 'Cari nama wisata, kategori, atau alamat...',
    'admin.saveFilter': 'Simpan filter',
    'admin.loadErrorTitle': 'Gagal memuat daftar wisata',
    'admin.emptyDbTitle': 'Belum ada lokasi wisata di database',
    'admin.emptyFilterTitle': 'Tidak ada lokasi yang cocok dengan filter',
    'admin.emptyDbDesc': 'Tambahkan destinasi pertama melalui tab Tambah lokasi.',
    'admin.emptyFilterDesc': 'Ubah kata kunci pencarian atau pilih kategori lain.',
    'admin.addFirstBtn': 'Tambah lokasi pertama',
    'admin.showingCount': 'Menampilkan {shown} dari {total} destinasi wisata',
    'admin.popularBadge': 'Populer',
    'admin.addressMissing': 'Alamat belum tersedia',
    'admin.errNameRequired': 'Nama tempat wisata wajib diisi.',
    'admin.errAddressRequired': 'Alamat lengkap tempat wisata wajib diisi.',
    'admin.errInvalidCoords':
      'Koordinat Latitude dan Longitude harus valid. Klik peta untuk menetapkan pin.',
    'admin.errSaveGeneric': 'Terjadi kesalahan saat menyimpan lokasi ke database.',
    'admin.errSaveTitle': 'Gagal menyimpan',
    'admin.errDeleteTitle': 'Gagal menghapus',
    'admin.errDeleteGeneric': 'Tidak dapat menghapus lokasi ini.',
    'admin.deletedDetail': "'{name}' telah dihapus dari database.",
    'admin.filterSavedMsg': 'Filter pencarian dan kategori berhasil disimpan.',
    'admin.filterUnsavedTab':
      'Perubahan pencarian atau kategori belum disimpan sebelum berpindah tab.',
    'admin.filterUnsavedRefresh':
      'Filter daftar wisata belum disimpan. Simpan filter agar tetap aktif.',
    'admin.feedback.saveSuccessTitle': 'Perubahan berhasil disimpan!',
    'admin.feedback.saveSuccessDesc': 'Data destinasi wisata telah diperbarui di database.',
    'admin.feedback.filterUnsavedTitle': 'Filter tidak disimpan',
    'admin.feedback.filterUnsavedDesc': 'Perubahan pencarian atau kategori belum disimpan.',
    'admin.feedback.saveAgain': 'Simpan Ulang',
    'admin.feedback.deleteSuccessTitle': 'Data wisata berhasil dihapus.',
    'admin.feedback.deleteSuccessDesc': 'Destinasi telah dihapus dari daftar wisata Kota Bogor.',
    'admin.feedback.logoutTitle': 'Kamu yakin ingin keluar dari halaman Admin?',
    'admin.feedback.logoutDesc':
      'Sesi administrator Anda akan diakhiri dan Anda perlu masuk kembali untuk mengelola data wisata.',
    'admin.feedback.logoutConfirm': 'Ya, Keluar',
    'admin.feedback.logoutBusy': 'Keluar...',
    'admin.feedback.deleteTitle': 'Hapus data wisata ini?',
    'admin.feedback.deleteDesc':
      'Yakin ingin menghapus data wisata ini? Tindakan ini tidak bisa dibatalkan.',
    'admin.feedback.deleteConfirm': 'Hapus Data',
    'admin.feedback.errorTitle': 'Terjadi kesalahan',
    'admin.feedback.errorDesc': 'Permintaan tidak dapat diproses. Silakan coba lagi.',
    'admin.day.Senin': 'Sen',
    'admin.day.Selasa': 'Sel',
    'admin.day.Rabu': 'Rab',
    'admin.day.Kamis': 'Kam',
    'admin.day.Jumat': 'Jum',
    'admin.day.Sabtu': 'Sab',
    'admin.day.Minggu': 'Min',
  },
  en: {
    // Document & App Shell
    'app.pageTitle': 'Sabah Bogor - Your Guide to Exploring Bogor',
    'app.srTitle': 'Bogor Tourism GIS',
    'app.adminRedirectTitle': 'Redirecting to Admin Panel...',
    'app.adminRedirectDesc': 'You are being redirected to the backend destination management panel at',
    'app.openAdminPanel': 'Open Admin Panel',
    'app.backToMap': 'Back to Map',
    'app.serverDisconnected': 'Connection to server lost',
    'app.serverHintBefore': 'Start the Laravel server (',
    'app.serverHintAfter': ') to load destinations.',
    'app.retryConnectAria': 'Retry connecting to backend',
    'app.loadingShort': 'Loading...',
    'app.retry': 'Retry',
    'app.closeBannerAria': 'Dismiss backend warning',
    'app.errorBoundaryTitle': 'Something Went Wrong',
    'app.errorBoundaryDesc': 'Please reload the page to continue.',
    'app.reloadPage': 'Reload Page',

    // Bottom Navigation
    'nav.mainAria': 'Main navigation',
    'nav.explore': 'Explore',
    'nav.forYou': 'For You',
    'nav.navigation': 'Navigation',
    'nav.saved': 'Saved',
    'nav.activity': 'Activity',

    // Common
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.closeDialog': 'Close dialog',
    'common.save': 'Save',
    'common.saved': 'Saved',
    'common.saveChanges': 'Save Changes',
    'common.saving': 'Saving...',
    'common.back': 'Back',
    'common.retry': 'Try Again',
    'common.reload': 'Reload',
    'common.reset': 'Reset',
    'common.resetFilter': 'Reset filters',
    'common.processing': 'Processing...',
    'common.deleting': 'Deleting...',
    'common.deleteConfirm': 'Yes, Delete',
    'common.continue': 'Continue',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.share': 'Share',
    'common.linkCopied': 'Link copied',
    'common.scrollToTop': 'Back to top',
    'common.bogorWestJava': 'Bogor, West Java',
    'common.bogorCityWestJava': 'Bogor City, West Java',
    'common.notAvailable': 'Not available',
    'common.checkOnSite': 'Check on site',
    'common.enableGps': 'Enable GPS',
    'common.free': 'Free',
    'common.justNow': 'Just now',
    'common.defaultUser': 'Explorer',
    'common.destinationFallback': 'Destination',

    // Explore / Sidebar / Search / Filter
    'explore.sidebarLabel': 'Destinations list',
    'explore.closeSidebarAria': 'Collapse destinations sidebar',
    'explore.openSidebarAria': 'Expand destinations sidebar',
    'explore.closeSidebarTitle': 'Hide destinations panel',
    'explore.openSidebarTitle': 'Show destinations panel',
    'explore.sheetCollapseAria': 'Swipe down or tap to minimize destinations list',
    'explore.sheetExpandAria': 'Swipe up or tap to expand destinations list',
    'explore.sheetCollapseTitle': 'Pull down or click to collapse panel',
    'explore.sheetExpandTitle': 'Pull up or click to expand panel',
    'explore.desktopExpandAria': 'Expand destinations list',
    'explore.desktopCollapseAria': 'Collapse sidebar panel',
    'explore.desktopExpandTitle': 'Expand destinations panel',
    'explore.desktopCollapseTitle': 'Collapse panel',
    'explore.searchPlaceholder': 'Search destinations in Bogor',
    'explore.clearSearchAria': 'Clear search',
    'explore.filterBtnAriaActive': 'Filter destinations ({count} active filters)',
    'explore.filterBtnAria': 'Open advanced destination filters',
    'explore.filterBtnTitle': 'Advanced destination filters',
    'explore.categoryTabsAria': 'Category filter',
    'explore.filterDialogTitle': 'Filter Destinations',
    'explore.filterCloseAria': 'Close filter panel',
    'explore.filterCategory': 'Category',
    'explore.filterMinRating': 'Minimum Rating',
    'explore.filterRadius': 'Nearby Radius',
    'explore.filterNeedsGps': 'Requires GPS',
    'explore.filterPreferences': 'Preferences',
    'explore.filterOnlyPopular': 'Popular Only',
    'explore.filterMyFavorites': 'My Favorites',
    'explore.filterShowCount': 'Show ({count})',
    'explore.popularHeading': 'Popular with visitors',
    'explore.loadingDestinations': 'Loading destinations...',
    'explore.destinationsLabel': 'Destinations',
    'explore.sortAria': 'Sort order: {sort}. Click to change',
    'explore.sortListAria': 'Destination sort options',
    'explore.sortRelevant': 'Most relevant',
    'explore.sortHighestRated': 'Highest rated',
    'explore.sortNearest': 'Nearest',
    'explore.sortPopular': 'Most popular',
    'explore.loadFailedTitle': 'Failed to load destinations',
    'explore.loadFailedDesc': 'Make sure the backend server is running and try reloading.',
    'explore.connecting': 'Connecting...',
    'explore.noMatch': 'No matching destinations found.',
    'explore.activeOnMap': 'Active on map',
    'explore.shareText': 'Check out {name} on Sabah Bogor',
    'explore.shareCopiedAria': 'Link for {name} copied',
    'explore.sharePlaceAria': 'Share {name}',
    'explore.removeFavAria': 'Remove {name} from favorites',
    'explore.addFavAria': 'Save {name} to favorites',
    'explore.backToList': 'Back to list',
    'explore.address': 'Address',
    'explore.aboutDestination': 'About destination',
    'explore.placeNotFound': 'Destination not found.',

    // Map & Navigation
    'map.sectionAria': 'Bogor tourism map',
    'map.navGuideAria': 'Navigation guide',
    'map.navGuideText':
      'Choose a destination in Explore or build a Custom Route to start navigating.',
    'map.endJourney': 'End Trip',
    'map.transitBadge': 'Transit stop',
    'map.viewDetailAria': 'View details for {name}',
    'map.startBtn': 'Start',
    'map.startNavAria': 'Start navigation to {name}',
    'map.openHudDetailAria': 'View details for destination {name}',
    'map.routeBtn': 'Route',
    'map.detailBtn': 'Details',
    'map.distanceFromYou': '{distance} from your location',
    'map.distanceWithEta': '{distance} from you · Est. {eta}',
    'map.gpsOffHint': 'Enable GPS location access to see distance from you',
    'map.gpsOff': 'GPS off',
    'map.gpsSearching': 'GPS...',
    'map.yourLocationAria': 'Your location',
    'map.clusterTooltip': '{count} Destinations: {names}',
    'map.clusterMore': ' +{count} more',
    'map.locateShow': 'Show your location',
    'map.locateDenied': 'Location permission denied in browser',
    'map.locateCenter': 'Center on your location',
    'map.switch2DAria': 'Switch to flat 2D view',
    'map.switch3DAria': 'Switch to tilted 3D view',
    'map.mode3DTitle': '3D Mode Active (Click for Flat 2D)',
    'map.mode2DTitle': '2D Mode Active (Click for Tilted 3D)',
    'map.hideBoundaryAria': 'Hide Bogor City Boundary',
    'map.showBoundaryAria': 'Show Bogor City Boundary',
    'map.boundaryOnTitle': 'Bogor City Boundary: On (Click to hide)',
    'map.boundaryOffTitle': 'Bogor City Boundary: Off (Click to show)',
    'map.disableClusterAria': 'Disable Marker Clustering',
    'map.enableClusterAria': 'Enable Marker Clustering',
    'map.clusterOnTitle': 'Marker Clustering: On (Click to disable)',
    'map.clusterOffTitle': 'Marker Clustering: Off (Click to enable)',
    'map.metricsAria': 'Route estimate panel',
    'map.activeNavBadge': 'Active navigation',
    'map.customRouteBadge': 'Custom route',
    'map.customRouteFallback': 'Custom travel route',
    'map.routeJoinWord': ' to ',
    'map.pointFallback': 'Stop',
    'map.calculating': 'Calculating...',
    'map.totalEstimate': 'Total ETA:',
    'map.estimate': 'ETA:',
    'map.totalDistance': 'Total distance:',
    'map.distance': 'Distance:',
    'map.gpsFallbackMulti': 'GPS off · estimate calculated between route stops',
    'map.gpsFallbackSingle': 'GPS off · estimate calculated from Bogor City Center',
    'map.routeSelectorAria': 'Route options',
    'map.routeOptionLabel': 'Route {index}',
    'map.routeOptionAria': 'Select Route {index}, estimated {time}, distance {distance}',
    'map.trafficAria': 'Bogor traffic status: {status}',
    'map.trafficSmooth': 'Smooth traffic',
    'map.trafficMorningRush': 'Morning rush hour traffic',
    'map.trafficEveningRush': 'Evening rush hour traffic',
    'map.trafficWeekend': 'Potential weekend traffic',
    'map.trafficWeekendPeak': 'Busy weekend traffic',
    'map.trafficExtraMin': '+{min} min',
    'map.adminZoomIn': 'Zoom in',
    'map.adminZoomOut': 'Zoom out',
    'map.adminCenterBogor': 'Center on Bogor City',
    'map.adminCenterPinAria': 'Center pin on Bogor City',
    'map.adminMapHint': 'Click map or drag pin for precision',

    // Tourist Detail Page
    'detail.notFoundTitle': 'Destination details not found.',
    'detail.notFoundDesc':
      'Pick another destination from Explore to view its full details.',
    'detail.backToMap': 'Back to map',
    'detail.shareAria': 'Share this place',
    'detail.removeFavoriteAria': 'Remove from favorites',
    'detail.addFavoriteAria': 'Add to favorites',
    'detail.shareText': '{name} - Recommended destination in Bogor',
    'detail.actionsAria': 'Destination navigation actions',
    'detail.startJourney': 'Start Journey',
    'detail.openGoogleMaps': 'Open in Google Maps',
    'detail.quickInfoAria': 'Destination quick information',
    'detail.openingHours': 'Opening hours',
    'detail.ticketPrice': 'Admission',
    'detail.eta': 'Estimated arrival',
    'detail.addressAria': 'Destination address',
    'detail.aboutTitle': 'About this place',
    'detail.photosTitle': 'Location photos',
    'detail.photosSaved': '{count} saved',
    'detail.photosBadge': '{count} Photos',
    'detail.photosTapHint': 'Tap photo to open fullscreen gallery',
    'detail.openGalleryAria': 'Open photo gallery for {name}, {count} photos',
    'detail.galleryPreviewAria': '{name} gallery preview',
    'detail.zoomPhotoAria': 'Expand photo {index} of {total}',
    'detail.lightboxAria': '{name} photo gallery',
    'detail.closeGalleryAria': 'Close photo gallery',
    'detail.prevPhotoAria': 'Previous photo',
    'detail.nextPhotoAria': 'Next photo',
    'detail.viewPhotoAria': 'View photo {index}',
    'detail.selectPhotoAria': 'Select photo {index} of {total}',
    'detail.photoAlt': '{name} - photo {index} of {total}',
    'detail.similarHeading': 'Similar Places Nearby',
    'detail.nearest': 'Nearest',
    'detail.autoDescNature':
      '{name} is a popular nature destination in the Bogor area, offering cool air and scenic landscapes ideal for visiting with family or friends.',
    'detail.autoDescCulinary':
      '{name} is a favorite culinary spot in Bogor serving local dishes in a welcoming setting for relaxing with family or friends.',
    'detail.autoDescEducation':
      '{name} is a notable educational and cultural destination in Bogor combining recreation with local heritage for family and friends.',
    'detail.autoDescGeneric':
      'A popular destination and activity spot in the Bogor area worth visiting with family or friends.',

    // For You Page
    'foryou.title': 'For You',
    'foryou.subtitleLoggedIn': 'Personalized for {name}',
    'foryou.subtitleDefaultName': 'your journey',
    'foryou.subtitleGuest': 'Curated top destinations around Bogor',
    'foryou.openProfileAria': 'Open user profile',
    'foryou.signInAria': 'Sign in to account',
    'foryou.guestTitle': 'Save routes and personalize your picks',
    'foryou.guestDesc':
      'Sign in to Sabah Bogor to sync your favorite places, pick up where you left off, and tailor recommendations to your interests.',
    'foryou.guestCta': 'Sign In',
    'foryou.curatedHeading': 'Curated Picks in Bogor',
    'foryou.curatedDesc':
      'Top-rated destinations ready to explore or navigate directly on the map',
    'foryou.loadErrorTitle': 'Unable to load recommendations',
    'foryou.loadErrorAuthTitle': 'Unable to load recommendations',
    'foryou.loadErrorDesc': 'Check your backend server connection and try reloading.',
    'foryou.emptyAvailable': 'No destinations available to display yet.',
    'foryou.continueHeading': 'Continue your journey',
    'foryou.continueDesc': 'The last destination you viewed',
    'foryou.lastViewed': 'Last viewed',
    'foryou.continueRoute': 'Continue route',
    'foryou.personalizedHeading': 'Based on Your Interests & History',
    'foryou.personalizedFallbackDesc':
      'Showing featured Bogor destinations while your travel history builds up',
    'foryou.personalizedDesc':
      'Curated from your favorites, activities, and browsing history',
    'foryou.emptyRecs': 'No recommendations available right now.',
    'foryou.distanceFromYou': '{distance} from you',
    'foryou.viewDetail': 'View details',
    'foryou.routeBtn': 'Route',
    'foryou.quickRouteAria': 'Start quick route to {name}',

    // Saved Activities Page
    'saved.title': 'Saved',
    'saved.subtitle': 'Your favorite destinations, custom routes, and travel notes',
    'saved.addActivityTitle': 'Add New Travel Activity',
    'saved.addActivityAria': 'Add activity',
    'saved.notifTitle': 'Notifications',
    'saved.notifAria': 'View notifications',
    'saved.profileAria': 'User profile',
    'saved.guestTitle': 'Saved Albums & Collections',
    'saved.guestDesc':
      'Sign in to view and manage your favorite destinations, custom routes, and travel activity notes.',
    'saved.guestCta': 'Sign In',
    'saved.sortPrefix': 'Sort: {option}',
    'saved.sortLatest': 'Newest',
    'saved.sortOldest': 'Oldest',
    'saved.sortNameAZ': 'Name A-Z',
    'saved.folderRecentTitle': 'Recently viewed',
    'saved.folderRoutesTitle': 'Custom routes',
    'saved.folderFavoritesTitle': 'Favorites',
    'saved.collectionsHeading': 'Collections',
    'saved.spotsCountSingle': '{count} place',
    'saved.spotsCount': '{count} places',
    'saved.routesAvailable': '{count} Routes Ready',
    'saved.routesCountSingle': '{count} saved route',
    'saved.routesCount': '{count} saved routes',
    'saved.backToFoldersAria': 'Back to saved folders',
    'saved.recentHeader': 'Recently Viewed',
    'saved.recentSubtitle': 'Destinations you recently opened',
    'saved.recentEmptyTitle': 'No Browsing History Yet',
    'saved.recentEmptyDesc':
      'Explore spots on the Explore map to keep track of places you have visited.',
    'saved.favoritesHeader': 'Favorite Places',
    'saved.favoritesSubtitle': '{count} saved favorite destinations',
    'saved.favoritesEmptyTitle': 'No Favorites Yet',
    'saved.favoritesEmptyDesc':
      'Tap the heart icon on any destination in Explore to save it here.',
    'saved.myActivitiesHeading': 'My Travel Activities',
    'saved.recordedCount': '{count} logged',
    'saved.deleteActivityAria': 'Delete activity {name}',
    'saved.deleteActivityTitle': 'Delete activity',
    'saved.myActivitiesEmpty':
      'No saved travel activities yet. Tap the plus (+) button above to add one.',
    'saved.modalCloseAria': 'Close add activity modal',
    'saved.modalTitle': 'Add New Travel Activity',
    'saved.modalDesc': 'Record and save your upcoming travel plan',
    'saved.activityNameLabel': 'Activity Name',
    'saved.activityNamePlaceholder': 'e.g. Cycling at Bogor Botanical Gardens',
    'saved.activityLocationLabel': 'Destination Location',
    'saved.activityLocationPlaceholder': 'e.g. Kebun Raya Bogor',
    'saved.notifSavedTitle': 'Activity saved',
    'saved.notifSavedDesc': '"{name}" at {location} has been added to Saved Activities.',

    // Custom Routes Page
    'routes.title': 'Custom Routes',
    'routes.subtitle': 'Saved travel routes on your account',
    'routes.backAria': 'Back to saved activities',
    'routes.createBtn': 'Create Route',
    'routes.createShortBtn': 'New',
    'routes.connectedBadge': 'Connected',
    'routes.activeSavedCount': '{count} active saved routes',
    'routes.primaryBadge': 'Primary Route',
    'routes.stopsBadgeSingle': '{count} Stop',
    'routes.stopsBadge': '{count} Stops',
    'routes.deleteRouteAria': 'Delete route {title}',
    'routes.deleteRouteTitle': 'Delete route',
    'routes.startJourney': 'Start Journey',
    'routes.emptyTitle': 'No Custom Routes Yet',
    'routes.emptyDesc':
      'You have no custom routes yet. Click "Create Route" above to chain together your saved destinations.',
    'routes.createModalCloseAria': 'Close create custom route modal',
    'routes.createModalTitle': 'Build New Custom Route',
    'routes.createModalDesc': 'Select destinations to organize your itinerary',
    'routes.routeNameLabel': 'Route Name',
    'routes.routeNamePlaceholder': 'e.g. Culture & Botanical Garden Tour',
    'routes.chooseStopsLabel': 'Select stops:',
    'routes.savedSpotsCount': '{count} saved places',
    'routes.saveRouteBtn': 'Save Route',
    'routes.deleteModalCloseAria': 'Close delete route confirmation',
    'routes.deleteModalTitle': 'Delete Custom Route?',
    'routes.deleteModalDesc': 'Route "{title}" will be permanently removed from your saved routes.',
    'routes.stopStart': 'Starting Point',
    'routes.stopStartShort': 'Start',
    'routes.stopEnd': 'Final Destination',
    'routes.stopTransit': 'Transit {index}',
    'routes.newlyCreatedDesc': 'Newly created by you',
    'routes.notifCreatedTitle': 'New custom route: {title}',
    'routes.notifCreatedDesc':
      '{count} destinations ({distance}) have been added to Custom Routes.',
    'routes.notifDeletedTitle': 'Custom route deleted',
    'routes.notifDeletedDesc': 'Route "{title}" has been removed from your saved routes.',

    // Activities Page
    'activities.title': 'Activity',
    'activities.subtitle': 'Share your travel moments and browse stories from the Bogor community',
    'activities.notifTitle': 'View notifications',
    'activities.notifAria': 'Activity notifications',
    'activities.filterAria': 'Activity filter',
    'activities.tabYou': 'You',
    'activities.tabCommunity': 'Community',
    'activities.postBtn': 'Post',
    'activities.postBtnTitle': 'Post a travel photo',
    'activities.postBtnAria': 'Post travel photo',
    'activities.guestTitle': 'Your Travel Activity',
    'activities.guestDesc':
      'Sign in to view and share your personal Bogor travel stories and photos.',
    'activities.loadErrorTitle': 'Unable to load activities',
    'activities.loadErrorDesc': 'Check your backend server connection and try reloading.',
    'activities.myCountSuffix': 'activities from you this month',
    'activities.communityCountSuffix': 'community travel stories',
    'activities.emptyYouTitle': 'No Activity Posts Yet',
    'activities.emptyCommunityTitle': 'No Community Posts Yet',
    'activities.emptyYouDesc':
      'Tap the + Post button above to share your first travel story.',
    'activities.emptyCommunityDesc': 'No travel stories from the community yet.',
    'activities.shareFirstPhoto': 'Share First Photo',
    'activities.viewProfileTitle': 'View {name}\'s profile',
    'activities.viewProfileTag': '(View profile)',
    'activities.deleteMyTitle': 'Delete my activity',
    'activities.deleteMyAria': 'Delete this activity',
    'activities.postModalCloseAria': 'Close post modal',
    'activities.postModalTitle': 'Post Travel Photo',
    'activities.postModalDesc': 'Share your travel experience with the Sabah Bogor community',
    'activities.photoLabel': 'Activity Photo',
    'activities.photoPreviewAlt': 'Photo Preview',
    'activities.changePhoto': 'Change Photo',
    'activities.pickPhoto': 'Choose photo from gallery',
    'activities.pickPhotoHint': 'Tap to upload JPG/PNG image',
    'activities.locationLabel': 'Destination Location',
    'activities.locationPlaceholder': 'e.g. Curug Cikuluwung',
    'activities.captionLabel': 'Story / Caption',
    'activities.captionPlaceholder': 'Write about your experience here...',
    'activities.uploading': 'Uploading & Compressing...',
    'activities.shareToCommunity': 'Share with Community',
    'activities.deleteModalCloseAria': 'Close delete confirmation',
    'activities.deleteModalTitle': 'Delete Activity?',
    'activities.deleteModalDesc': 'This activity post will be permanently deleted.',
    'activities.notifDeletedTitle': 'Post deleted',
    'activities.notifDeletedDesc': 'Your activity story has been removed from the feed.',
    'activities.notifPostedTitle': 'Story shared with the community',
    'activities.notifPostedDesc':
      '"{title}" at {location} has been published to the Activity feed.',

    // Profile Header & Identity
    'profile.titleSelf': 'My Profile',
    'profile.titleOther': 'Explorer Profile',
    'profile.backAria': 'Go back to previous page',
    'profile.openSettingsAria': 'Open settings',
    'profile.defaultUser': 'Explorer',
    'profile.changeAvatarAria': 'Change profile photo',
    'profile.statusActive': 'Active Explorer',
    'profile.statusExplorer': 'Bogor Nature Explorer',
    'profile.defaultBio': 'Exploring Bogor nature trails and local culinary gems.',
    'profile.editProfile': 'Edit Profile',
    'profile.following': 'Following',
    'profile.followAction': 'Follow Journey',
    'profile.statRoutes': 'Custom Routes',
    'profile.statFollowers': 'Followers',
    'profile.statFollowing': 'Following',
    'profile.myRoutesTitle': 'My Routes',
    'profile.myRoutesSubtitle': 'Saved routes ready to navigate from your account',
    'profile.savedRoutesCount': '{count} Routes',
    'profile.routeDefaultSummary': 'Your custom Bogor itinerary',
    'profile.stopsCount': '{count} destinations',
    'profile.startRoute': 'Start Route Navigation',
    'profile.emptyRoutesTitle': 'No Saved Routes Yet',
    'profile.emptyRoutesDesc':
      'You have no custom routes yet. Plan your Bogor itinerary in the Saved tab.',
    'profile.recentActivities': "{name}'s Recent Activities",
    'profile.activitiesCount': '{count} Activities',
    'profile.justNow': 'Just now',
    'profile.deleteActivityAria': 'Delete this activity',
    'profile.emptyActivitiesTitle': 'No Recent Activities',
    'profile.emptyActivitiesDesc': '{name} has not shared any travel moments yet.',
    'profile.deleteModalTitle': 'Delete Activity?',
    'profile.deleteModalDesc': 'This activity post will be permanently removed.',
    'profile.deleteConfirm': 'Yes, Delete',
    'profile.deleting': 'Deleting...',
    'profile.logoutModalTitle': 'Are you sure you want to log out?',
    'profile.logoutModalDesc':
      'Your saved routes and travel notes will remain safely stored in this account.',
    'profile.logoutConfirm': 'Yes, Log Out',
    'profile.followNotifTitle': 'Started following {name}',
    'profile.followNotifDesc':
      'You are now connected with {name} in the Bogor explorer community.',
    'profile.avatarNotifTitle': 'Profile photo updated',
    'profile.avatarNotifDesc': 'Your profile photo changes have been saved.',

    // Settings Sheet
    'settings.title': 'Settings',
    'settings.closeAria': 'Close settings',
    'settings.sectionLanguage': 'App Language',
    'settings.languageLabel': 'Display Language',
    'settings.languageDesc': 'Switch the entire app interface language immediately',
    'settings.langId': 'Indonesia',
    'settings.langEn': 'English',
    'settings.sectionAccount': 'Account',
    'settings.editProfileTitle': 'Edit Profile',
    'settings.editProfileDesc': 'Update your display name and short bio',
    'settings.changePasswordTitle': 'Change Password',
    'settings.changePasswordDesc': 'Update your password to keep your account secure',
    'settings.sectionNavigation': 'Navigation Preferences',
    'settings.routeNotifTitle': 'Route Notifications',
    'settings.routeNotifDesc': 'Receive route updates and navigation reminders',
    'settings.distanceUnitTitle': 'Distance Unit',
    'settings.distanceUnitDesc': 'Applies immediately to all route and destination distances',
    'settings.unitKm': 'KM',
    'settings.unitMiles': 'Miles',
    'settings.sectionDanger': 'Danger Zone',
    'settings.logoutTitle': 'Log Out',
    'settings.logoutDesc': 'End your current session on this device',
    'settings.nameLabel': 'Full Name',
    'settings.namePlaceholder': 'Enter your full name',
    'settings.bioLabel': 'Short Bio',
    'settings.bioPlaceholder': 'Share your travel style or favorite Bogor spots...',
    'settings.nameRequired': 'Full name must be at least 2 characters.',
    'settings.profileSaveFailed': 'Failed to save profile changes.',
    'settings.currentPasswordLabel': 'Current Password',
    'settings.currentPasswordPlaceholder': 'Enter your current password',
    'settings.newPasswordLabel': 'New Password',
    'settings.newPasswordPlaceholder': 'At least 6 characters',
    'settings.confirmPasswordLabel': 'Confirm New Password',
    'settings.confirmPasswordPlaceholder': 'Re-enter your new password',
    'settings.passwordMinError': 'New password must be at least 6 characters.',
    'settings.passwordMismatch': 'New password confirmation does not match.',
    'settings.currentPasswordRequired': 'Current password is required.',
    'settings.passwordSaveFailed': 'Failed to update password.',
    'settings.updatePasswordBtn': 'Update Password',
    'settings.showPasswordAria': 'Show password',
    'settings.hidePasswordAria': 'Hide password',

    // Toasts
    'toast.activityDeleted': 'Activity deleted.',
    'toast.activityDeleteFailed': 'Failed to delete activity.',
    'toast.loginToFollow': 'Please sign in first to follow explorers.',
    'toast.followSuccess': 'Now following {name}!',
    'toast.unfollowSuccess': 'Unfollowed {name}.',
    'toast.followFailed': 'Failed to update follow status.',
    'toast.invalidImageType': 'Please choose an image file (JPG, PNG, WEBP).',
    'toast.avatarTooLarge': 'Maximum profile photo size is 15 MB.',
    'toast.avatarUpdated': 'Profile photo updated!',
    'toast.avatarFailed': 'Failed to upload profile photo. Please try again.',
    'toast.profileUpdated': 'Profile updated successfully!',
    'toast.passwordUpdated': 'Password updated successfully!',
    'toast.languageChanged': 'App language switched to English.',
    'toast.distanceUnitChangedKm': 'Distance unit changed to Kilometers (KM).',
    'toast.distanceUnitChangedMi': 'Distance unit changed to Miles (MI).',
    'toast.routeNotifOn': 'Route notifications enabled.',
    'toast.routeNotifOff': 'Route notifications muted.',

    // Auth / LoginModal
    'auth.logoAlt': 'Sabah Bogor Logo',
    'auth.closeRegisterAria': 'Close registration dialog',
    'auth.closeLoginAria': 'Close login dialog',
    'auth.registerTitle': 'Create new account',
    'auth.loginTitle': 'Sign in',
    'auth.registerDesc':
      'Create a Sabah Bogor account to save routes, favorites, and your Bogor travel moments.',
    'auth.loginDesc':
      'Save custom routes, share travel photos, and manage your favorite destinations.',
    'auth.fullNameLabel': 'Full Name',
    'auth.fullNamePlaceholder': 'Your full name',
    'auth.emailLabel': 'Email',
    'auth.emailPlaceholder': 'name@email.com',
    'auth.passwordLabel': 'Password',
    'auth.passwordMinPlaceholder': 'At least 6 characters',
    'auth.confirmPasswordLabel': 'Confirm Password',
    'auth.confirmPasswordPlaceholder': 'Re-enter password',
    'auth.loginIdentityLabel': 'Email or username',
    'auth.loginPasswordLabel': 'Password',
    'auth.loginPasswordPlaceholder': 'Enter your password',
    'auth.showPasswordAria': 'Show password',
    'auth.hidePasswordAria': 'Hide password',
    'auth.showConfirmAria': 'Show password confirmation',
    'auth.hideConfirmAria': 'Hide password confirmation',
    'auth.registerBtn': 'Create Account',
    'auth.loginBtn': 'Sign In',
    'auth.orDivider': 'or',
    'auth.googleRegister': 'Sign up with Google',
    'auth.googleLogin': 'Continue with Google',
    'auth.haveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.switchLogin': 'Sign in',
    'auth.switchRegister': 'Sign up now',
    'auth.laterBtn': 'Maybe later',
    'auth.errNameMin': 'Full name must be at least 2 characters.',
    'auth.errInvalidEmail': 'Please enter a valid email address.',
    'auth.errPasswordMin': 'Password must be at least 6 characters.',
    'auth.errPasswordMismatch': 'Password confirmation does not match.',
    'auth.errIdentityRequired': 'Please enter your email or username.',
    'auth.errPasswordRequired': 'Please enter your password.',
    'auth.errRegisterFailed': 'Registration failed. Please check your details.',
    'auth.errLoginFailed': 'Sign in failed. Check your email and password.',
    'auth.errMissingToken': 'Authentication response did not include a valid token.',
    'auth.errConnect': 'Unable to connect to authentication server.',

    // Notifications Drawer
    'notif.title': 'Notifications',
    'notif.newCount': '{count} New',
    'notif.closeAria': 'Close notifications',
    'notif.unreadAria': 'Unread',
    'notif.emptyTitle': 'No updates yet',
    'notif.emptyDesc':
      'Notifications will appear when you save favorite spots, create custom routes, connect with explorers, or complete actions.',
    'notif.markAllRead': 'Mark all read',
    'notif.savedTime': 'Saved',
    'notif.favTitle': '{name} saved to Saved',
    'notif.favFallbackTitle': 'Destination saved to Saved',
    'notif.favDesc': '{category} in Bogor has been added to your saved list.',
    'notif.favFallbackDesc': 'Destination has been added to your saved list.',

    // Mascot labels
    'mascot.default': 'Sabah Bogor Spotted Deer Mascot',
    'mascot.confused': 'Sabah Bogor Spotted Deer Mascot looking curious with a camera',
    'mascot.takingPhoto': 'Sabah Bogor Spotted Deer Mascot taking a photo',
    'mascot.happy': 'Sabah Bogor Spotted Deer Mascot happily holding a folded map',
    'mascot.goodbye': 'Sabah Bogor Spotted Deer Mascot waving goodbye',
    'mascot.admin': 'Sabah Bogor Admin Spotted Deer Mascot reviewing destinations',
    'mascot.tapAria': 'Tap the Sabah Bogor deer mascot to say hello',
    'mascot.greet1': 'Hi! Ready to explore Bogor today?',
    'mascot.greet2': 'Bogor waterfalls feel crisp and refreshing!',
    'mascot.greet3': 'How about the Botanical Gardens or Suryakencana?',
    'mascot.greet4': 'Enjoy your trip and travel safe!',

    // Interactive Motion & Gestures
    'motion.stackHeading': 'Quick Discovery Deck',
    'motion.stackHint': 'Swipe or tap the photo stack to flip to the next spot',
    'motion.stackRecentHeading': 'Recently Viewed Stack',
    'motion.stackRecentHint': 'Swipe or tap the card stack to browse your history',
    'motion.stackNextAria': 'Flip to next destination card',
    'motion.stackTapFlipAria': 'Tap or swipe to flip past {name}',
    'motion.pullRefreshHint': 'Pull down to refresh',
    'motion.pullReleaseHint': 'Release to refresh',
    'motion.pullRefreshed': 'Destination info refreshed',
    'motion.exploreSwipeHint': 'Swipe cards to highlight map pins',
    'motion.navActiveProgress': 'En route to destination',

    // Admin SPA & Mascot Feedback
    'admin.title': 'Bogor Tourism Admin',
    'admin.subtitle': 'Manage spatial data, destination details, and photo galleries',
    'admin.loadingDb': 'Loading database...',
    'admin.dbCount': '{count} spots in database',
    'admin.mainMap': 'Main map',
    'admin.logout': 'Log Out',
    'admin.navAria': 'Admin navigation',
    'admin.tabEdit': 'Edit spot',
    'admin.tabAdd': 'Add spot',
    'admin.tabList': 'Destinations ({count})',
    'admin.editingNotice': 'Editing:',
    'admin.cancelEdit': 'Cancel edit',
    'admin.infoHeading': 'Location Details',
    'admin.infoDesc': 'Fill in destination identity, map category, admission fee, and address.',
    'admin.nameLabel': 'Destination name',
    'admin.namePlaceholder': 'e.g. Kebun Raya Bogor',
    'admin.categoryLabel': 'Category',
    'admin.ticketLabel': 'Admission fee',
    'admin.ticketPlaceholder': 'e.g. Rp 15.000 or Free',
    'admin.ratingLabel': 'Initial rating (0.0 – 5.0)',
    'admin.visibilityLabel': 'Visibility',
    'admin.markPopular': 'Mark as popular spot',
    'admin.addressLabel': 'Address',
    'admin.addressPlaceholder': 'Jl. Ir. H. Juanda No.13, Bogor City, West Java',
    'admin.descLabel': 'Description',
    'admin.descPlaceholder': 'Write a brief summary of highlights, facilities, and atmosphere',
    'admin.hoursHeading': 'Opening Hours',
    'admin.open24h': 'Open 24 hours',
    'admin.openTime': 'Opening time',
    'admin.closeTime': 'Closing time',
    'admin.openDaysLabel': 'Open days (Mon–Sun)',
    'admin.daily': 'Daily',
    'admin.weekdays': 'Mon–Fri',
    'admin.weekends': 'Weekends',
    'admin.selectDaysAria': 'Select operating days',
    'admin.savedFormat': 'Saved format:',
    'admin.coordHeading': 'Coordinates',
    'admin.coordDesc': 'Click the map, drag the pin, or enter coordinates directly.',
    'admin.photosHeading': 'Location Photos',
    'admin.photosCount': '{count} photos',
    'admin.photosDesc': 'Upload one or more photos. The first photo becomes the cover image.',
    'admin.photosDropAria': 'Select or drag location photos',
    'admin.photosDropTitle': 'Click or drag photos here',
    'admin.photosDropHint': 'JPG, PNG, WebP · Auto-compressed on upload',
    'admin.primaryBadge': 'Cover',
    'admin.setPrimaryBtn': 'Set as cover',
    'admin.removePhotoAria': 'Remove photo {index}',
    'admin.resetForm': 'Reset form',
    'admin.saveLocation': 'Save Location',
    'admin.searchPlaceholder': 'Search destination name, category, or address...',
    'admin.saveFilter': 'Save filter',
    'admin.loadErrorTitle': 'Failed to load destinations',
    'admin.emptyDbTitle': 'No destinations in database yet',
    'admin.emptyFilterTitle': 'No destinations match your filter',
    'admin.emptyDbDesc': 'Add the first destination from the Add spot tab.',
    'admin.emptyFilterDesc': 'Try a different keyword or select another category.',
    'admin.addFirstBtn': 'Add first spot',
    'admin.showingCount': 'Showing {shown} of {total} destinations',
    'admin.popularBadge': 'Popular',
    'admin.addressMissing': 'Address not available',
    'admin.errNameRequired': 'Destination name is required.',
    'admin.errAddressRequired': 'Full address is required.',
    'admin.errInvalidCoords':
      'Latitude and Longitude must be valid. Click the map to drop a pin.',
    'admin.errSaveGeneric': 'An error occurred while saving to the database.',
    'admin.errSaveTitle': 'Save failed',
    'admin.errDeleteTitle': 'Delete failed',
    'admin.errDeleteGeneric': 'Unable to delete this location.',
    'admin.deletedDetail': "'{name}' has been removed from the database.",
    'admin.filterSavedMsg': 'Search and category filters have been saved.',
    'admin.filterUnsavedTab':
      'Search or category changes were not saved before switching tabs.',
    'admin.filterUnsavedRefresh':
      'Destination filters are unsaved. Save your filter to keep it active.',
    'admin.feedback.saveSuccessTitle': 'Changes saved!',
    'admin.feedback.saveSuccessDesc': 'Destination data has been updated in the database.',
    'admin.feedback.filterUnsavedTitle': 'Unsaved filters',
    'admin.feedback.filterUnsavedDesc': 'Search or category changes have not been saved.',
    'admin.feedback.saveAgain': 'Save Now',
    'admin.feedback.deleteSuccessTitle': 'Destination deleted.',
    'admin.feedback.deleteSuccessDesc': 'The destination has been removed from Bogor spots.',
    'admin.feedback.logoutTitle': 'Are you sure you want to log out of Admin?',
    'admin.feedback.logoutDesc':
      'Your administrator session will end and you will need to sign in again to manage spots.',
    'admin.feedback.logoutConfirm': 'Yes, Log Out',
    'admin.feedback.logoutBusy': 'Logging out...',
    'admin.feedback.deleteTitle': 'Delete this destination?',
    'admin.feedback.deleteDesc':
      'Are you sure you want to delete this destination? This action cannot be undone.',
    'admin.feedback.deleteConfirm': 'Delete Data',
    'admin.feedback.errorTitle': 'Something went wrong',
    'admin.feedback.errorDesc': 'Request could not be processed. Please try again.',
    'admin.day.Senin': 'Mon',
    'admin.day.Selasa': 'Tue',
    'admin.day.Rabu': 'Wed',
    'admin.day.Kamis': 'Thu',
    'admin.day.Jumat': 'Fri',
    'admin.day.Sabtu': 'Sat',
    'admin.day.Minggu': 'Sun',
  },
}

const CATEGORY_ID_MAP = {
  'alam & curug': 'Taman & Alam',
  'taman & alam': 'Taman & Alam',
}

const CATEGORY_EN_MAP = {
  semua: 'All',
  'alam & curug': 'Parks & Nature',
  'taman & alam': 'Parks & Nature',
  'wisata alam': 'Nature',
  'ruang publik': 'Public Space',
  'rekreasi keluarga': 'Family Recreation',
  agrowisata: 'Agrotourism',
  kuliner: 'Culinary',
  belanja: 'Shopping',
  'edukasi & budaya': 'Education & Culture',
  'sejarah & budaya': 'History & Culture',
  edukasi: 'Education',
  landmark: 'Landmark',
  'kampung wisata': 'Tourism Village',
  lainnya: 'Other',
}

const EXACT_DYNAMIC_EN_MAP = {
  'penjelajah alam dan pecinta curug di bogor.':
    'Nature explorer and waterfall enthusiast in Bogor.',
  'penjelajah wisata alam dan kuliner bogor.':
    'Exploring Bogor nature trails and local culinary gems.',
  'penjelajah wisata alam dan kuliner kota bogor.':
    'Exploring Bogor nature trails and local culinary gems.',
  'penjelajah alam dan pegiat wisata bogor.':
    'Nature explorer and Bogor travel enthusiast.',
  'penggemar wisata budaya, sejarah, dan spot edukasi bogor.':
    'Enthusiast of Bogor culture, history, and educational spots.',
  'pecinta trekking dan petualangan jernihnya curug sentul.':
    'Trekking enthusiast chasing Sentul waterfall adventures.',
  'administrator pengelola sig pariwisata kota bogor.':
    'Administrator of Bogor City Tourism GIS.',
  'rute favorit edukasi & sejarah bogor': 'Favorite Bogor Education & History Route',
  'rute baru dibuat oleh anda': 'Newly created by you',
  'rute kustom buatan anda': 'Your custom Bogor itinerary',
  'kuliner legendaris suryakencana': 'Legendary Suryakencana Culinary Trail',
  'titik awal': 'Starting Point',
  'transit pertama': 'First Transit',
  'destinasi akhir': 'Final Destination',
  'titik kunjungan': 'Stop Point',
  'baru saja': 'Just now',
  tersimpan: 'Saved',
  'hari ini': 'Today',
  kemarin: 'Yesterday',
  'belum tersedia': 'Not available',
  'cek di lokasi': 'Check on site',
  'aktifkan gps': 'Enable GPS',
  gratis: 'Free',
  'bogor, jawa barat': 'Bogor, West Java',
  'kota bogor, jawa barat': 'Bogor City, West Java',
  'destinasi disimpan ke tersimpan': 'Destination saved to Saved',
  'tempat wisata berhasil disimpan ke daftar tersimpan anda.':
    'Destination has been added to your saved list.',
  'aktivitas berhasil disimpan': 'Activity saved',
  'postingan berhasil dihapus': 'Post deleted',
  'cerita aktivitas anda telah dihapus dari linimasa.':
    'Your activity story has been removed from the feed.',
  'cerita dibagikan ke komunitas': 'Story shared with the community',
  'foto profil berhasil diperbarui': 'Profile photo updated',
  'perubahan foto profil akun anda telah tersimpan.':
    'Your profile photo changes have been saved.',
  'rute custom berhasil dihapus': 'Custom route deleted',
  'alamat belum tersedia': 'Address not available',
}

const TIME_UNIT_EN = {
  detik: ['second', 'seconds'],
  menit: ['minute', 'minutes'],
  jam: ['hour', 'hours'],
  hari: ['day', 'days'],
  minggu: ['week', 'weeks'],
  bulan: ['month', 'months'],
  tahun: ['year', 'years'],
}

const MONTH_ID_TO_EN = {
  januari: 'January',
  februari: 'February',
  maret: 'March',
  april: 'April',
  mei: 'May',
  juni: 'June',
  juli: 'July',
  agustus: 'August',
  september: 'September',
  oktober: 'October',
  november: 'November',
  desember: 'December',
  agt: 'Aug',
  okt: 'Oct',
  des: 'Dec',
}

export function translateKey(language, key, params = {}) {
  const dict = TRANSLATIONS[language] || TRANSLATIONS.id
  let template = dict[key] ?? TRANSLATIONS.id[key] ?? key
  for (const [paramKey, paramValue] of Object.entries(params)) {
    template = template.replaceAll(`{${paramKey}}`, String(paramValue))
  }
  return template
}

export function translateCategory(category, language = 'id') {
  if (!category || typeof category !== 'string') return ''
  const key = category.trim().toLowerCase()
  if (language === 'en') {
    return CATEGORY_EN_MAP[key] || category
  }
  return CATEGORY_ID_MAP[key] || category
}

export function translateDuration(rawText, language = 'id') {
  if (!rawText || typeof rawText !== 'string') return rawText || ''
  if (language !== 'en') return rawText
  let result = rawText.trim()
  if (/^aktifkan gps$/i.test(result)) return 'Enable GPS'
  if (/^menghitung\.{0,3}$/i.test(result)) return 'Calculating...'
  result = result
    .replace(/\b(\d+)\s*Jam\s*(\d+)\s*Menit\b/gi, '$1 hr $2 min')
    .replace(/\b(\d+)\s*Jam\b/gi, '$1 hr')
    .replace(/\b(\d+)\s*Menit\b/gi, '$1 min')
  return result
}

export function translateTicketPrice(rawText, language = 'id') {
  if (!rawText || typeof rawText !== 'string') return rawText || ''
  const normalized = rawText
    .trim()
    .replace(/(\d)\(/g, '$1 (')
    .replace(/\)\s*&\s*/g, ') & ')
    .replace(/([^\s])&([^\s])/g, '$1 & $2')
    .replace(/\)\s*\/\s*/g, ') / ')
    .replace(/\s{2,}/g, ' ')
  if (language !== 'en') return normalized
  if (/^gratis$/i.test(normalized)) return 'Free'
  if (/^cek di lokasi$/i.test(normalized)) return 'Check on site'
  if (/^belum tersedia$/i.test(normalized)) return 'Not available'
  return normalized
    .replace(/\bGratis\b/gi, 'Free')
    .replace(/\barea publik\b/gi, 'public area')
    .replace(/\bmulai dari\b/gi, 'from')
    .replace(/\/\s*orang\b/gi, '/person')
    .replace(/\/\s*kendaraan\b/gi, '/vehicle')
    .replace(/\bparkir\b/gi, 'parking')
    .replace(/\bweekday\b/gi, 'Weekday')
    .replace(/\bweekend\b/gi, 'Weekend')
    .replace(/\bHari biasa\b/gi, 'Weekdays')
    .replace(/\bAkhir pekan\b/gi, 'Weekends')
}

export function translateOperationalHours(rawText, language = 'id') {
  if (!rawText || typeof rawText !== 'string') return rawText || ''
  if (language !== 'en') return rawText
  const trimmed = rawText.trim()
  if (/^belum tersedia$/i.test(trimmed)) return 'Not available'
  return trimmed
    .replace(/\bBuka 24\s*Jam\b/gi, 'Open 24 Hours')
    .replace(/\b24\s*Jam\b/gi, '24 Hours')
    .replace(/\bSetiap\s*hari\b/gi, 'Daily')
    .replace(/\bSenin\b/gi, 'Mon')
    .replace(/\bSelasa\b/gi, 'Tue')
    .replace(/\bRabu\b/gi, 'Wed')
    .replace(/\bKamis\b/gi, 'Thu')
    .replace(/\bJumat\b/gi, 'Fri')
    .replace(/\bSabtu\b/gi, 'Sat')
    .replace(/\bMinggu\b/gi, 'Sun')
    .replace(/\bTutup\b/gi, 'Closed')
    .replace(/\bBuka\b/gi, 'Open')
}

export function translateDynamicText(rawText, language = 'id') {
  if (!rawText || typeof rawText !== 'string') return rawText || ''
  if (language !== 'en') return rawText

  const trimmed = rawText.trim()
  const lower = trimmed.toLowerCase()

  if (EXACT_DYNAMIC_EN_MAP[lower]) {
    return EXACT_DYNAMIC_EN_MAP[lower]
  }

  // "Tur Edukasi: ..." -> "Educational Tour: ..."
  if (/^Tur Edukasi:\s*/i.test(trimmed)) {
    return trimmed.replace(/^Tur Edukasi:\s*/i, 'Educational Tour: ')
  }

  // "Transit 2" -> "Transit 2"
  if (/^Transit\s+(\d+)$/i.test(trimmed)) {
    return trimmed
  }

  // "Dibuat 1 minggu lalu" -> "Created 1 week ago"
  const createdAgoMatch = trimmed.match(
    /^Dibuat\s+(\d+)\s+(detik|menit|jam|hari|minggu|bulan|tahun)\s+lalu$/i,
  )
  if (createdAgoMatch) {
    const qty = Number(createdAgoMatch[1])
    const unitPair = TIME_UNIT_EN[createdAgoMatch[2].toLowerCase()]
    if (unitPair) {
      return `Created ${qty} ${qty === 1 ? unitPair[0] : unitPair[1]} ago`
    }
  }

  // "3 hari lalu", "1 minggu lalu", "5 menit lalu"
  const relativeAgoMatch = trimmed.match(
    /^(\d+)\s+(detik|menit|jam|hari|minggu|bulan|tahun)\s+lalu$/i,
  )
  if (relativeAgoMatch) {
    const qty = Number(relativeAgoMatch[1])
    const unitPair = TIME_UNIT_EN[relativeAgoMatch[2].toLowerCase()]
    if (unitPair) {
      return `${qty} ${qty === 1 ? unitPair[0] : unitPair[1]} ago`
    }
  }

  // Stored notifications translated on the fly when user switches language
  const favSavedMatch = trimmed.match(/^(.+)\s+disimpan ke Tersimpan$/i)
  if (favSavedMatch) {
    return `${favSavedMatch[1]} saved to Saved`
  }

  const favDescMatch = trimmed.match(/^(.+)\s+di Bogor masuk daftar tersimpan Anda\.$/i)
  if (favDescMatch) {
    const cat = translateCategory(favDescMatch[1], 'en')
    return `${cat} in Bogor has been added to your saved list.`
  }

  const newRouteNotifMatch = trimmed.match(/^Rute custom baru:\s*(.+)$/i)
  if (newRouteNotifMatch) {
    return `New custom route: ${newRouteNotifMatch[1]}`
  }

  const routeCreatedDescMatch = trimmed.match(
    /^(\d+)\s+destinasi wisata\s+\(([^)]+)\)\s+berhasil ditambahkan ke Rute Custom\.$/i,
  )
  if (routeCreatedDescMatch) {
    return `${routeCreatedDescMatch[1]} destinations (${routeCreatedDescMatch[2]}) have been added to Custom Routes.`
  }

  const routeDeletedDescMatch = trimmed.match(
    /^Rute\s+"(.+)"\s+telah dihapus dari daftar rute tersimpan\.$/i,
  )
  if (routeDeletedDescMatch) {
    return `Route "${routeDeletedDescMatch[1]}" has been removed from your saved routes.`
  }

  const savedActNotifMatch = trimmed.match(
    /^"(.+)"\s+di\s+(.+)\s+berhasil ditambahkan ke Aktivitas Tersimpan\.$/i,
  )
  if (savedActNotifMatch) {
    return `"${savedActNotifMatch[1]}" at ${savedActNotifMatch[2]} has been added to Saved Activities.`
  }

  const postNotifMatch = trimmed.match(
    /^"(.+)"\s+di\s+(.+)\s+berhasil dipublikasikan di linimasa Aktivitas\.$/i,
  )
  if (postNotifMatch) {
    return `"${postNotifMatch[1]}" at ${postNotifMatch[2]} has been published to the Activity feed.`
  }

  const followTitleMatch = trimmed.match(/^Mulai mengikuti\s+(.+)$/i)
  if (followTitleMatch) {
    return `Started following ${followTitleMatch[1]}`
  }

  const followDescMatch = trimmed.match(
    /^Anda kini terhubung dengan\s+(.+)\s+di komunitas penjelajah Bogor\.$/i,
  )
  if (followDescMatch) {
    return `You are now connected with ${followDescMatch[1]} in the Bogor explorer community.`
  }

  // Indonesian calendar dates like "28 November 2026" or "14 Mei 2026" or "5 Agt"
  const dateRegex =
    /\b(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|Agt|Okt|Des)\b(\s+\d{4})?/gi
  if (dateRegex.test(trimmed)) {
    return trimmed.replace(dateRegex, (_, day, month, year = '') => {
      const enMonth = MONTH_ID_TO_EN[month.toLowerCase()] || month
      return `${enMonth} ${day}${year ? `, ${year.trim()}` : ''}`
    })
  }

  return trimmed
}
